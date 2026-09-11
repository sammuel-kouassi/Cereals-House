import { query } from "../src/integrations/neon/db.server";

async function main() {
  const quotes = await query("SELECT * FROM quote_requests");
  console.log("Quotes:", quotes);

  const notifications = await query("SELECT * FROM admin_notifications");
  console.log("Notifications:", notifications);
  
  process.exit(0);
}

main().catch(console.error);
