import { neon, neonConfig, Pool } from "@neondatabase/serverless";

import fs from "fs";
import path from "path";

// Active le pooling HTTP pour les environnements serverless
neonConfig.fetchConnectionCache = true;

// Fonction simple pour lire .env manuellement si process.env.DATABASE_URL est vide
function getDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^DATABASE_URL=(.*)$/m);
      if (match) {
        let val = match[1].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        return val;
      }
    }
  } catch (e) {
    // ignore
  }
  return "";
}

const DATABASE_URL = getDbUrl();

if (!DATABASE_URL && typeof window === "undefined") {
  console.warn(
    "[Neon DB] DATABASE_URL non trouvée dans les variables d'environnement. " +
    "Veuillez renseigner DATABASE_URL dans votre fichier .env pour activer la connexion directe à Neon."
  );
}

// Instance SQL taguée pour les requêtes rapides sans état
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null;

// Pool de connexion pour les transactions
let _pool: Pool | null = null;
export function getDbPool(): Pool {
  if (!_pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL est requise pour créer un pool de connexion Neon.");
    }
    _pool = new Pool({ connectionString: DATABASE_URL });
  }
  return _pool;
}

/**
 * Exécute une requête SQL avec paramètres sécurisés.
 */
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  if (!DATABASE_URL || !sql) {
    console.warn("[Neon DB] Simulation de requête (DATABASE_URL absente) :", queryString.slice(0, 80));
    return [];
  }
  try {
    const result = typeof (sql as any).query === "function"
      ? await (sql as any).query(queryString, params)
      : await (sql as any)(queryString, params);
    return (result as unknown as T[]) ?? [];
  } catch (error) {
    console.error("[Neon DB Error]", error);
    throw error;
  }
}

/**
 * Exécute une requête qui doit renvoyer une seule ligne ou null.
 */
export async function queryOne<T = any>(queryString: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(queryString, params);
  return rows.length > 0 ? rows[0] : null;
}
