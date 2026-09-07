import { neon, neonConfig, Pool } from "@neondatabase/serverless";

// Active le pooling HTTP pour les environnements serverless
neonConfig.fetchConnectionCache = true;

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";

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
