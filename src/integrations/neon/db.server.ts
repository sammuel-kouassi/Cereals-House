import { neon, neonConfig, Pool } from "@neondatabase/serverless";

// Active le pooling HTTP pour les environnements serverless
neonConfig.fetchConnectionCache = true;

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
  let s = url.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
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
  const currentUrl = getDbUrl();
  const currentSql = currentUrl ? neon(currentUrl) : sql;
  if (!currentUrl || !currentSql) {
    console.warn("[Neon DB] Simulation de requête (DATABASE_URL absente) :", queryString.slice(0, 80));
    return [];
  }
  try {
    const result = typeof (currentSql as any).query === "function"
      ? await (currentSql as any).query(queryString, params)
      : await (currentSql as any)(queryString, params);
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

let _cancellationColumnsEnsured = false;
export async function ensureCancellationColumns(): Promise<void> {
  if (_cancellationColumnsEnsured) return;
  _cancellationColumnsEnsured = true;
  if (!DATABASE_URL || !sql) return;
  try {
    await query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS cancellation_requested BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
      ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS cancellation_request_status TEXT;
    `);
    await query(`
      DO $$ BEGIN
        ALTER TYPE admin_notification_type ADD VALUE IF NOT EXISTS 'cancellation_request';
      EXCEPTION
        WHEN undefined_object THEN null;
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => null);
  } catch (e) {
    console.warn("[Neon DB] ensureCancellationColumns notice:", e);
  }
}
