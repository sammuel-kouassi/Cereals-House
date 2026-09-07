import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getRequest } from "@tanstack/react-start/server";
import { query, queryOne } from "./db.server";

const JWT_SECRET_STRING = process.env.AUTH_SECRET || "cereals-house-neon-secret-key-2026-very-secure-jwt";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  role: "admin" | "customer";
  avatar_url: string | null;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: "admin" | "customer";
}

/**
 * Crée un JWT signé pour l'utilisateur
 */
export async function createSessionToken(user: { id: string; email: string; role: string }): Promise<string> {
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Vérifie et décode un JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || !payload.email) return null;
    return {
      userId: payload.sub as string,
      email: payload.email as string,
      role: (payload.role as "admin" | "customer") || "customer",
    };
  } catch {
    return null;
  }
}

/**
 * Récupère l'utilisateur actuellement authentifié depuis les headers de la requête
 */
export async function getCurrentUser(): Promise<UserRecord | null> {
  try {
    const request = getRequest();
    if (!request?.headers) return null;

    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    } else {
      // Vérifie les cookies éventuels
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/ch_auth_token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const user = await queryOne<UserRecord>(
      `SELECT id, email, full_name, phone, country_code, role, avatar_url, created_at
       FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId]
    );

    return user;
  } catch (err) {
    console.error("[getCurrentUser Error]", err);
    return null;
  }
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function registerUser(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  countryCode?: string;
}) {
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [input.email.trim()]
  );

  if (existing) {
    throw new Error("Un compte existe déjà avec cette adresse email.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const newUser = await queryOne<UserRecord>(
    `INSERT INTO users (email, password_hash, full_name, phone, country_code, role)
     VALUES (LOWER($1), $2, $3, $4, $5, 'customer')
     RETURNING id, email, full_name, phone, country_code, role, avatar_url, created_at`,
    [
      input.email.trim(),
      passwordHash,
      input.fullName?.trim() || null,
      input.phone?.trim() || null,
      input.countryCode?.trim() || null,
    ]
  );

  if (!newUser) throw new Error("Échec de la création du compte.");

  const token = await createSessionToken(newUser);
  return { user: newUser, token };
}

/**
 * Connexion d'un utilisateur existant
 */
export async function loginUser(email: string, password: string) {
  const user = await queryOne<UserRecord & { password_hash: string }>(
    `SELECT id, email, password_hash, full_name, phone, country_code, role, avatar_url, created_at
     FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email.trim()]
  );

  if (!user || !user.password_hash) {
    throw new Error("Identifiants incorrects (email ou mot de passe invalide).");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Identifiants incorrects (email ou mot de passe invalide).");
  }

  const { password_hash: _, ...safeUser } = user;
  const token = await createSessionToken(safeUser);
  return { user: safeUser, token };
}

/**
 * Authentification / Connexion avec Google OAuth / Google ID Token
 */
export async function loginWithGoogleServer(input: {
  idToken?: string;
  code?: string;
  redirectUri?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}) {
  let googleEmail = input.email?.trim()?.toLowerCase() || "";
  let googleName = input.fullName?.trim() || "";
  let googleAvatar = input.avatarUrl?.trim() || "";

  // 1. Si un idToken Google est fourni, on vérifie auprès de l'API Google
  if (input.idToken) {
    try {
      const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`);
      if (resp.ok) {
        const tokenInfo = await resp.json();
        if (tokenInfo.email) {
          googleEmail = tokenInfo.email.toLowerCase();
          googleName = tokenInfo.name || googleName || tokenInfo.given_name || "";
          googleAvatar = tokenInfo.picture || googleAvatar || "";
        }
      }
    } catch (err) {
      console.warn("[Google Auth Token Verification Warning]", err);
    }
  }

  // 2. Si un code d'autorisation OAuth est fourni, on échange contre des tokens
  if (input.code && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: input.code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: input.redirectUri || "http://localhost:8080/auth",
          grant_type: "authorization_code",
        }),
      });

      if (tokenResp.ok) {
        const tokens = await tokenResp.json();
        if (tokens.access_token) {
          const userinfoResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (userinfoResp.ok) {
            const profile = await userinfoResp.json();
            if (profile.email) {
              googleEmail = profile.email.toLowerCase();
              googleName = profile.name || googleName;
              googleAvatar = profile.picture || googleAvatar;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[Google OAuth Code Exchange Warning]", err);
    }
  }

  if (!googleEmail) {
    throw new Error("Impossible de récupérer l'adresse email depuis votre compte Google.");
  }

  // 3. Rechercher ou créer l'utilisateur dans la base Neon
  let user = await queryOne<UserRecord>(
    `SELECT id, email, full_name, phone, country_code, role, avatar_url, created_at
     FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [googleEmail]
  );

  if (user) {
    // Mettre à jour l'avatar ou le nom si manquants
    if (!user.avatar_url && googleAvatar) {
      await queryOne(
        `UPDATE users SET avatar_url = $1, full_name = COALESCE(full_name, $2) WHERE id = $3 RETURNING id`,
        [googleAvatar, googleName || null, user.id]
      );
      user.avatar_url = googleAvatar;
      if (!user.full_name && googleName) user.full_name = googleName;
    }
  } else {
    // Créer un nouvel utilisateur Google dans Neon
    user = await queryOne<UserRecord>(
      `INSERT INTO users (email, full_name, avatar_url, role)
       VALUES (LOWER($1), $2, $3, 'customer')
       RETURNING id, email, full_name, phone, country_code, role, avatar_url, created_at`,
      [googleEmail, googleName || null, googleAvatar || null]
    );
  }

  if (!user) {
    throw new Error("Erreur lors de l'enregistrement de l'utilisateur Google.");
  }

  const token = await createSessionToken(user);
  return { user, token };
}

