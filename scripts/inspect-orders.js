import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const env = fs.readFileSync(".env", "utf8");
const dbUrlLine = env.split("\n").find(l => l.startsWith("DATABASE_URL="));
const url = dbUrlLine ? dbUrlLine.substring("DATABASE_URL=".length).trim().replace(/^"/, "").replace(/"$/, "") : "";

const sql = neon(url);
async function run() {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'`;
  console.log("Orders columns:", cols.map(c => c.column_name).join(", "));
}
run().catch(console.error);
