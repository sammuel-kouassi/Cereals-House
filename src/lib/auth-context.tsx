import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { signInFn, signUpFn, signInWithGoogleFn, getMeFn } from "@/lib/auth/auth.functions";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  country_code?: string | null;
  role: "admin" | "customer";
  avatar_url?: string | null;
  created_at?: string;
};

type Ctx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; fullName?: string; phone?: string; countryCode?: string }) => Promise<void>;
  signInWithGoogle: (data: { idToken?: string; code?: string; redirectUri?: string; email?: string; fullName?: string; avatarUrl?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);
const TOKEN_KEY = "ch_auth_token";
const USER_KEY = "ch_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const savedUser = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }

      // Synchronisation avec le serveur
      if (savedToken) {
        getMeFn()
          .then(({ user: serverUser }) => {
            if (serverUser) {
              setUser(serverUser);
              localStorage.setItem(USER_KEY, JSON.stringify(serverUser));
            } else {
              // Token expiré
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              setUser(null);
              setToken(null);
            }
          })
          .catch(() => {
            // garder la session locale en cas d'erreur réseau
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const saveAuthSession = (authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      document.cookie = `ch_auth_token=${authToken}; path=/; max-age=2592000; SameSite=Lax`;
    }
  };

  const signIn = async (email: string, password: string) => {
    const res = await signInFn({ data: { email, password } });
    if (res?.user && res?.token) {
      saveAuthSession(res.user, res.token);
    }
  };

  const signUp = async (data: { email: string; password: string; fullName?: string; phone?: string; countryCode?: string }) => {
    const res = await signUpFn({ data });
    if (res?.user && res?.token) {
      saveAuthSession(res.user, res.token);
    }
  };

  const signInWithGoogle = async (googleData: {
    idToken?: string;
    code?: string;
    redirectUri?: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  }) => {
    const res = await signInWithGoogleFn({ data: googleData });
    if (res?.user && res?.token) {
      saveAuthSession(res.user, res.token);
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      document.cookie = "ch_auth_token=; path=/; max-age=0; SameSite=Lax";
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
