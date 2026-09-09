import { Client } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

// Charger le .env manuellement
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match) {
        databaseUrl = match[1];
        break;
      }
    }
  } catch {}
}

if (!databaseUrl) {
  databaseUrl = "postgresql://neondb_owner:npg_E7fj2baORUzF@ep-empty-dew-ayjdu99n-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
}

async function migrate() {
  console.log("Connexion à Neon DB...");
  const client = new Client(databaseUrl);
  await client.connect();

  console.log("Création de la table city_shipping_rates...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS city_shipping_rates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
      city_name TEXT NOT NULL,
      shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_city_shipping_rates_country_city UNIQUE (country_code, city_name)
    );

    DROP TRIGGER IF EXISTS trg_city_shipping_rates_updated_at ON city_shipping_rates;
    CREATE TRIGGER trg_city_shipping_rates_updated_at 
    BEFORE UPDATE ON city_shipping_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log("✅ Table city_shipping_rates créée et configurée avec succès !");
  
  // Vérification
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'city_shipping_rates'`);
  console.log("Colonnes de city_shipping_rates:", res.rows);

  await client.end();
}

migrate().catch(console.error);
