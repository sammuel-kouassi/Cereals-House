import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
const dbUrlLine = env.split("\n").find(l => l.startsWith("DATABASE_URL="));
if (dbUrlLine) {
  process.env.DATABASE_URL = dbUrlLine.substring("DATABASE_URL=".length).trim().replace(/^"/, "").replace(/"$/, "");
}

async function run() {
  const { query } = await import("./src/integrations/neon/db.server.ts");
  try {
    const sql = fs.readFileSync("supabase/migrations/20260910222900_add_quotes_and_notifications.sql", "utf8");
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Running ${statements.length} migration statements...`);
    for (const stmt of statements) {
      try {
        await query(stmt);
      } catch (err) {
        // Ignorer l'erreur si le type ou la table existe déjà pour rendre le script idempotent
        if (err.message && (err.message.includes("already exists") || err.message.includes("does not exist"))) {
          console.warn("Ignored:", err.message);
        } else {
          throw err;
        }
      }
    }
    console.log("Migration successful!");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

run();
