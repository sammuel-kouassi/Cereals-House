import { neon } from "@neondatabase/serverless";
import fs from "fs";
import bcrypt from "bcryptjs";

const envContent = fs.readFileSync(".env", "utf8");
const match = envContent.match(/^DATABASE_URL=(.*)$/m);
if (!match) {
  console.error("DATABASE_URL non trouvée dans .env");
  process.exit(1);
}
let dbUrl = match[1].trim();
if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
  dbUrl = dbUrl.slice(1, -1);
}

const sql = neon(dbUrl);

async function main() {
  const targetEmail = "lucettedossou@gmail.com".toLowerCase().trim();
  console.log("Vérification de l'utilisateur :", targetEmail);

  const existing = await sql`SELECT id, email, full_name, role FROM users WHERE LOWER(email) = ${targetEmail} LIMIT 1;`;

  if (existing.length > 0) {
    const user = existing[0];
    console.log("Utilisateur trouvé :", user);
    if (user.role !== "admin") {
      await sql`UPDATE users SET role = 'admin', updated_at = now() WHERE id = ${user.id};`;
      console.log(`✅ Rôle mis à jour avec succès : ${targetEmail} est maintenant 'admin'.`);
    } else {
      console.log(`ℹ️ ${targetEmail} possède déjà le rôle 'admin'.`);
    }
  } else {
    console.log("Utilisateur inexistant, création du compte administrateur...");
    const defaultPassword = "cerealsHouse2026@";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const inserted = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${targetEmail}, ${passwordHash}, 'Lucette Dossou (Admin)', 'admin')
      RETURNING id, email, full_name, role, created_at;
    `;
    console.log("✅ Compte administrateur créé avec succès :", inserted[0]);
    console.log("🔑 Mot de passe temporaire initialisé à :", defaultPassword);
  }

  const allAdmins = await sql`SELECT id, email, full_name, role FROM users WHERE role = 'admin';`;
  console.log("\n📋 Liste actuelle des administrateurs :");
  console.table(allAdmins);
}

main().catch(console.error);
