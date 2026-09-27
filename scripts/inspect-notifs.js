import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const env = fs.readFileSync(".env", "utf8");
const dbUrlLine = env.split("\n").find(l => l.startsWith("DATABASE_URL="));
const url = dbUrlLine ? dbUrlLine.substring("DATABASE_URL=".length).trim().replace(/^"/, "").replace(/"$/, "") : "";

const sql = neon(url);
async function run() {
  const notifCols = await sql`SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'admin_notifications'`;
  console.log("admin_notifications columns:", notifCols);

  const enumVals = await sql`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'admin_notification_type'`;
  console.log("admin_notification_type values:", enumVals.map(e => e.enumlabel));
}
run().catch(console.error);
