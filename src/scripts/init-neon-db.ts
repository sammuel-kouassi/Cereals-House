import { Client, neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_E7fj2baORUzF@ep-empty-dew-ayjdu99n-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Connexion à Neon PostgreSQL avec Client...");
  const client = new Client(DATABASE_URL);
  await client.connect();

  const schemaPath = path.resolve(process.cwd(), "src/integrations/neon/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  console.log("Application du schéma PostgreSQL complet...");
  await client.query(schemaSql);
  console.log("✅ Schéma PostgreSQL et triggers créés avec succès !");

  await client.end();

  // Maintenant utilisation du client tagged template pour les insertions
  const sql = neon(DATABASE_URL);

  console.log("Insertion des produits initiaux...");
  const products = [
    {
      slug: "farine-infantile-enrichie",
      name: "Farine Infantile Enrichie au Moringa",
      description: "Notre farine infantile enrichie est spécialement conçue pour accompagner la diversification alimentaire des tout-petits dès 6 mois. Composée de mil, maïs jaune, soja torréfié et poudre de moringa bio, elle apporte tous les micronutriments essentiels pour une croissance vigoureuse.",
      short_description: "Pour bébés dès 6 mois. Riche en fer, calcium, protéines végétales et vitamines naturelles.",
      category: "Farines Infantiles",
      image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
      unit: "pot 500g",
      stock: 45,
      weight_g: 500,
      target_audience: "Bébés (6+ mois)",
      audiences: ["Bébés (6+ mois)", "Enfants"],
      composition: "Mil perlé précuit (40%), Maïs jaune local (25%), Soja torréfié (20%), Poudre de feuilles de Moringa oleifera bio (5%), Poudre de pain de singe / Baobab (10%).",
      benefits: "Favorise le développement cérébral et la prise de poids saine. Renforce le système immunitaire. Facilement digeste et sans conservateurs artificiels.",
      preparation: "Mélanger 3 cuillères à soupe de farine dans 200ml d'eau tiède ou de lait. Cuire à feu doux pendant 5 à 7 minutes en remuant constamment jusqu'à obtention d'une texture onctueuse.",
      is_active: true,
      is_featured: true,
      prices: { CI: 2500, SN: 3000, ML: 3000, BF: 3000, FR: 8.5, US: 9.5 }
    },
    {
      slug: "millet-perle-bio",
      name: "Mil Perlé Décortiqué Bio",
      description: "Céréale ancestrale sans gluten cultivée traditionnellement en Afrique de l'Ouest. Idéal pour préparer des bouillies onctueuses, des couscous de mil traditionnels (Thiéré) ou des galettes énergétiques.",
      short_description: "100% Mil perlé biologique, sans gluten, riche en fibres et minéraux.",
      category: "Céréales & Grains",
      image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=80",
      unit: "sachet 1kg",
      stock: 60,
      weight_g: 1000,
      target_audience: "Toute la famille",
      audiences: ["Toute la famille", "Adultes & Séniors"],
      composition: "100% Grains de mil perlé (Pennisetum glaucum) soigneusement nettoyés, lavés et décortiqués.",
      benefits: "Index glycémique modéré, excellent pour la régulation du cholestérol et de la glycémie. Riche en magnésium et phosphore.",
      preparation: "Faire tremper 30 min, puis cuire dans 2 volumes d'eau bouillante pendant 20 minutes.",
      is_active: true,
      is_featured: true,
      prices: { CI: 1800, SN: 2200, ML: 2200, BF: 2200, FR: 6.0, US: 7.0 }
    },
    {
      slug: "fonio-precuit-guinee",
      name: "Fonio Blanc Précuit du Fouta",
      description: "Le fonio est le joyau méconnu des céréales africaines : ultra-léger, digeste, sans gluten et cuit en seulement 5 minutes. Une alternative gastronomique au quinoa et au riz.",
      short_description: "La plus ancienne céréale d'Afrique, cuisson express 5 min, saveur noisette.",
      category: "Céréales & Grains",
      image_url: "https://images.unsplash.com/photo-1543353071-087092ec393a?w=800&auto=format&fit=crop&q=80",
      unit: "paquet 500g",
      stock: 35,
      weight_g: 500,
      target_audience: "Toute la famille",
      audiences: ["Toute la famille", "Sportifs & Actifs"],
      composition: "100% Fonio blanc précuit à la vapeur douce.",
      benefits: "Riche en acides aminés soufrés (méthionine et cystine) souvent absents des autres céréales. Convient parfaitement aux personnes diabétiques.",
      preparation: "Verser dans un bol, couvrir d'eau bouillante salée à niveau égal, couvrir 5 minutes, égrener à la fourchette avec une noisette de beurre ou d'huile.",
      is_active: true,
      is_featured: true,
      prices: { CI: 3200, SN: 3500, ML: 3500, BF: 3500, FR: 9.0, US: 10.0 }
    },
    {
      slug: "farine-sorgho-rouge",
      name: "Farine de Sorgho Rouge Énergisante",
      description: "Farine artisanale moulue sur meule de pierre, issue de sorgho rouge sélectionné. Idéale pour les bouillies fortifiantes, les crêpes et les pâtisseries traditionnelles sans gluten.",
      short_description: "Riche en antioxydants polyphénols, fer et énergie naturelle pour toute la famille.",
      category: "Farines Naturelles",
      image_url: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=800&auto=format&fit=crop&q=80",
      unit: "paquet 1kg",
      stock: 40,
      weight_g: 1000,
      target_audience: "Toute la famille",
      audiences: ["Toute la famille", "Sportifs & Actifs", "Femmes enceintes"],
      composition: "100% grains de sorgho rouge torréfiés puis finement moulus.",
      benefits: "Puissant pouvoir antioxydant grâce aux anthocyanes. Apport continu en énergie complexe sans pic glycémique.",
      preparation: "Délayer dans de l'eau froide avec une pincée de sel, porter à ébullition en remuant jusqu'à épaississement. Servir avec du lait et du miel.",
      is_active: true,
      is_featured: false,
      prices: { CI: 2000, SN: 2400, ML: 2400, BF: 2400, FR: 7.0, US: 8.0 }
    },
    {
      slug: "bouillie-maman-bebe",
      name: "Délice Maman-Bébé Multicéréales & Baobab",
      description: "Formule premium associant mil, avoine, graines de sésame et pulpe de baobab. Recommandée pour soutenir l'allaitement maternel et l'énergie des jeunes mamans, ainsi que pour les enfants en pleine croissance.",
      short_description: "Complexe revitalisant pour jeunes mamans et enfants. Vitamine C naturelle et calcium.",
      category: "Farines Infantiles",
      image_url: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop&q=80",
      unit: "bocal 750g",
      stock: 25,
      weight_g: 750,
      target_audience: "Mères & Bébés",
      audiences: ["Femmes enceintes", "Bébés (6+ mois)", "Adultes & Séniors"],
      composition: "Mil germé (35%), Flocons d'avoine complète (25%), Sésame blanc (15%), Pulpe de fruit de baobab (15%), Fleur de sel de Guérande (0.5%), Cannelle douce (0.5%).",
      benefits: "Très haute teneur en vitamine C et fibres prébiotiques. Stimule la lactation et combat la fatigue post-partum.",
      preparation: "Cuire 6 minutes dans du lait végétal ou animal. Aromatiser selon goût avec un filet de miel d'acacia.",
      is_active: true,
      is_featured: true,
      prices: { CI: 3800, SN: 4200, ML: 4200, BF: 4200, FR: 11.0, US: 12.5 }
    }
  ];

  for (const prod of products) {
    const rows = await sql`
      INSERT INTO products (
        slug, name, description, short_description, category, image_url, unit, stock, weight_g,
        target_audience, audiences, composition, benefits, preparation, is_active, is_featured
      ) VALUES (
        ${prod.slug}, ${prod.name}, ${prod.description}, ${prod.short_description}, ${prod.category},
        ${prod.image_url}, ${prod.unit}, ${prod.stock}, ${prod.weight_g}, ${prod.target_audience},
        ${prod.audiences}, ${prod.composition}, ${prod.benefits}, ${prod.preparation}, ${prod.is_active}, ${prod.is_featured}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        short_description = EXCLUDED.short_description,
        category = EXCLUDED.category,
        image_url = EXCLUDED.image_url,
        stock = EXCLUDED.stock,
        is_active = EXCLUDED.is_active,
        is_featured = EXCLUDED.is_featured
      RETURNING id;
    `;

    const productId = rows[0]?.id;
    if (productId) {
      for (const [countryCode, price] of Object.entries(prod.prices)) {
        await sql`
          INSERT INTO product_prices (product_id, country_code, price)
          VALUES (${productId}, ${countryCode}, ${price})
          ON CONFLICT (product_id, country_code) DO UPDATE SET price = EXCLUDED.price;
        `;
      }
    }
  }

  // Administrateur initial
  const adminEmail = "sammuel.kouassi2026@gmail.com";
  const passwordHash = await bcrypt.hash("cerealsHouse2026@", 10);

  await sql`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES (${adminEmail}, ${passwordHash}, 'Samuel Kouassi (Admin)', 'admin')
    ON CONFLICT (email) DO UPDATE SET
      role = 'admin',
      password_hash = EXCLUDED.password_hash;
  `;
  console.log("✅ Compte administrateur configuré :", adminEmail);

  // Vérification
  const countRes = await sql`SELECT count(*) as total FROM products;`;
  console.log("📊 Total produits enregistrés dans Neon :", countRes[0]?.total);

  const countriesRes = await sql`SELECT count(*) as total FROM countries;`;
  console.log("🌍 Total pays supportés enregistrés dans Neon :", countriesRes[0]?.total);

  console.log("🎉 BASE DE DONNÉES NEON 100% OPÉRATIONNELLE ET SYNCHRONISÉE !");
}

main().catch(console.error);
