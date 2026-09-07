import { query, queryOne } from "./db.server";

export const INITIAL_PRODUCTS = [
  {
    slug: "farine-infantile-bebe-mix",
    name: "Farine Infantile Bébé Mix Enrichie",
    category: "Farines Infantiles",
    short_description: "Farine nutritive à base de mil, soja et maïs enrichie en vitamines pour la croissance harmonieuse des bébés.",
    description: "Formulée spécialement pour la diversification alimentaire des nourrissons dès 6 mois. Élaborée avec des céréales locales sélectionnées sans conservateurs chimiques.",
    unit: "boîte de 500g",
    stock: 45,
    is_featured: true,
    target_audience: "Bébés (dès 6 mois) & Enfants",
    audiences: ["enfant"],
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 2500 },
      { country_code: "SN", price: 2800 },
      { country_code: "FR", price: 6.5 },
      { country_code: "US", price: 7.5 },
    ],
  },
  {
    slug: "fonio-precuit-naturel",
    name: "Fonio Blanc Précuit du Sahel",
    category: "Grains & Céréales Précoutes",
    short_description: "Céréale ancestrale sans gluten, légère, digeste et riche en acides aminés essentiels.",
    description: "Le fonio est cultivé de manière traditionnelle en Afrique de l'Ouest. Prêt en seulement 5 minutes à la vapeur ou en couscous, il accompagne poissons, viandes et sauces traditionnelles.",
    unit: "sachet de 1kg",
    stock: 60,
    is_featured: true,
    target_audience: "Famille, Diabétiques, Sans gluten",
    audiences: ["adulte", "enfant"],
    image_url: "https://images.unsplash.com/photo-1574316071802-0d684efa7cd5?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 3000 },
      { country_code: "SN", price: 3200 },
      { country_code: "FR", price: 8.0 },
      { country_code: "US", price: 9.5 },
    ],
  },
  {
    slug: "farine-de-mil-degue",
    name: "Grains de Mil pour Dêguê / Thiakry",
    category: "Mil & Dérivés",
    short_description: "Granulés de mil roulés et cuits à la vapeur, parfaits pour préparer le fameux dessert onctueux au yaourt.",
    description: "Élaborés selon le savoir-faire artisanal, ces grains de mil apportent fermeté et saveur authentique à vos préparations de Dêguê (Thiakry).",
    unit: "paquet de 1kg",
    stock: 35,
    is_featured: true,
    target_audience: "Famille & Événements",
    audiences: ["adulte", "enfant"],
    image_url: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 2000 },
      { country_code: "SN", price: 2200 },
      { country_code: "FR", price: 5.5 },
      { country_code: "US", price: 6.5 },
    ],
  },
  {
    slug: "riz-parfume-local-premium",
    name: "Riz Parfumé Local de Terroir",
    category: "Riz de Terroir",
    short_description: "Riz long grain parfumé cultivé dans les plaines fluviales, trié et débarrassé de toute impureté.",
    description: "Ce riz d'exception dégage un arôme subtil et une texture tendre qui ne colle pas. Idéal pour vos riz gras, tiep bou dien ou riz blanc d'accompagnement.",
    unit: "sac de 5kg",
    stock: 80,
    is_featured: true,
    target_audience: "Grande consommation & Famille",
    audiences: ["adulte", "enfant"],
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 6500 },
      { country_code: "SN", price: 7000 },
      { country_code: "FR", price: 16.0 },
      { country_code: "US", price: 19.0 },
    ],
  },
  {
    slug: "farine-de-sorgho-pure",
    name: "Farine de Sorgho Rouge Pure",
    category: "Sorgho & Farines",
    short_description: "Riche en fer, antioxydants et fibres. Idéale pour bouillies énergétiques et pâtisseries sans gluten.",
    description: "Le sorgho est une céréale fortifiante particulièrement recommandée pour les personnes anémiques, les sportifs, les femmes enceintes et les personnes âgées.",
    unit: "sachet de 1kg",
    stock: 25,
    is_featured: false,
    target_audience: "Adultes, Santé & Bien-être",
    audiences: ["adulte"],
    image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 2200 },
      { country_code: "SN", price: 2400 },
      { country_code: "FR", price: 6.0 },
      { country_code: "US", price: 7.0 },
    ],
  },
  {
    slug: "pack-grossiste-farine-infantile-25kg",
    name: "Pack Grossiste : Farine Infantile (25kg)",
    category: "Vente en Gros (B2B)",
    short_description: "Format économique destiné aux crèches, maternités, ONG et revendeurs spécialisés.",
    description: "Conditionnement hermétique en sac kraft renforcé de 25kg. Conforme aux normes sanitaires strictes et traçabilité certifiée.",
    unit: "sac de 25kg",
    stock: 15,
    is_featured: false,
    target_audience: "Professionnels, Crèches & Grossistes",
    audiences: ["enfant", "adulte"],
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    prices: [
      { country_code: "CI", price: 48000 },
      { country_code: "SN", price: 52000 },
      { country_code: "FR", price: 120.0 },
      { country_code: "US", price: 140.0 },
    ],
  }
];

export async function seedDatabaseIfEmpty() {
  try {
    const existing = await queryOne<{ count: string }>("SELECT count(*) as count FROM products");
    if (existing && parseInt(existing.count, 10) > 0) {
      return { seeded: false, message: "La base contient déjà des produits." };
    }

    for (const p of INITIAL_PRODUCTS) {
      const inserted = await queryOne<{ id: string }>(
        `INSERT INTO products (slug, name, short_description, description, category, unit, stock, is_featured, is_active, target_audience, audiences, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          p.slug,
          p.name,
          p.short_description,
          p.description,
          p.category,
          p.unit,
          p.stock,
          p.is_featured,
          p.target_audience,
          p.audiences,
          p.image_url,
        ]
      );

      if (inserted && p.prices) {
        for (const price of p.prices) {
          await query(
            `INSERT INTO product_prices (product_id, country_code, price)
             VALUES ($1, $2, $3)
             ON CONFLICT (product_id, country_code) DO UPDATE SET price = EXCLUDED.price`,
            [inserted.id, price.country_code, price.price]
          );
        }
      }
    }

    return { seeded: true, count: INITIAL_PRODUCTS.length };
  } catch (err) {
    console.error("[Seed Database Error]", err);
    return { seeded: false, error: err instanceof Error ? err.message : String(err) };
  }
}
