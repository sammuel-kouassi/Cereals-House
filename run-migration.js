import { query } from "./src/integrations/neon/db.server.js";
import fs from "fs";

async function run() {
  try {
    const sql = fs.readFileSync("supabase/migrations/20260910222900_add_quotes_and_notifications.sql", "utf8");
    console.log("Running migration...");
    await query(sql);
    console.log("Migration successful!");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

run();
