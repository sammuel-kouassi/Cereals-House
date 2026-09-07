import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { INITIAL_PRODUCTS, seedDatabaseIfEmpty } from "@/integrations/neon/seed.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";

export interface ProductPriceItem {
  country_code: string;
  price: number;
  shipping_fee?: number | null;
}

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  unit: string;
  stock: number;
  weight_g?: number | null;
  target_audience?: string | null;
  audiences?: string[] | null;
  composition?: string | null;
  benefits?: string | null;
  preparation?: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  product_prices: ProductPriceItem[];
}

export interface CountryItem {
  code: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
  base_shipping_fee: number;
  flag_emoji?: string | null;
  is_active: boolean;
  sort_order: number;
}

/**
 * Récupère la liste des pays actifs
 */
export const listCountriesFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const countries = await query<CountryItem>(
      `SELECT code, name, currency_code, currency_symbol, base_shipping_fee, flag_emoji, is_active, sort_order
       FROM countries
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );

    if (countries.length > 0) {
      return countries.map((c) => ({
        ...c,
        base_shipping_fee: Number(c.base_shipping_fee || 0),
      }));
    }

    // Fallback par défaut si base vide
    return [
      { code: "CI", name: "Côte d'Ivoire", currency_code: "XOF", currency_symbol: "FCFA", base_shipping_fee: 1500, flag_emoji: "🇨🇮", is_active: true, sort_order: 1 },
      { code: "SN", name: "Sénégal", currency_code: "XOF", currency_symbol: "FCFA", base_shipping_fee: 2000, flag_emoji: "🇸🇳", is_active: true, sort_order: 2 },
      { code: "ML", name: "Mali", currency_code: "XOF", currency_symbol: "FCFA", base_shipping_fee: 2500, flag_emoji: "🇲🇱", is_active: true, sort_order: 3 },
      { code: "BF", name: "Burkina Faso", currency_code: "XOF", currency_symbol: "FCFA", base_shipping_fee: 2500, flag_emoji: "🇧🇫", is_active: true, sort_order: 4 },
      { code: "FR", name: "France", currency_code: "EUR", currency_symbol: "€", base_shipping_fee: 12, flag_emoji: "🇫🇷", is_active: true, sort_order: 5 },
      { code: "US", name: "États-Unis", currency_code: "USD", currency_symbol: "$", base_shipping_fee: 18, flag_emoji: "🇺🇸", is_active: true, sort_order: 6 },
    ];
  } catch (err) {
    console.warn("[listCountriesFn Error, using fallback]", err);
    return [];
  }
});

/**
 * Récupère les produits actifs avec leurs prix
 */
export const listProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // Vérifie et injecte les données de base si nécessaire
    await seedDatabaseIfEmpty();

    const rawProducts = await query<any>(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'country_code', pp.country_code,
                    'price', pp.price,
                    'shipping_fee', pp.shipping_fee
                  )
                ) FILTER (WHERE pp.id IS NOT NULL), '[]'
              ) as product_prices
       FROM products p
       LEFT JOIN product_prices pp ON pp.product_id = p.id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.name ASC`
    );

    if (rawProducts.length > 0) {
      return rawProducts.map((p) => ({
        ...p,
        weight_g: Number(p.weight_g || 0),
        stock: Number(p.stock || 0),
        product_prices: (p.product_prices || []).map((pp: any) => ({
          country_code: pp.country_code,
          price: Number(pp.price || 0),
          shipping_fee: Number(pp.shipping_fee || 0),
        })),
      })) as ProductItem[];
    }

    // Données de secours locales si Neon non encore connecté
    return INITIAL_PRODUCTS.map((p, idx) => ({
      id: `fallback-${idx}`,
      slug: p.slug,
      name: p.name,
      short_description: p.short_description,
      description: p.description,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      audiences: p.audiences,
      target_audience: p.target_audience,
      image_url: p.image_url,
      is_active: true,
      is_featured: p.is_featured,
      product_prices: p.prices,
    })) as ProductItem[];
  } catch (err) {
    console.error("[listProductsFn Error]", err);
    // Retourne le fallback pour ne pas bloquer l'UI
    return INITIAL_PRODUCTS.map((p, idx) => ({
      id: `fallback-${idx}`,
      slug: p.slug,
      name: p.name,
      short_description: p.short_description,
      description: p.description,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      audiences: p.audiences,
      target_audience: p.target_audience,
      image_url: p.image_url,
      is_active: true,
      is_featured: p.is_featured,
      product_prices: p.prices,
    })) as ProductItem[];
  }
});

/**
 * Récupère les produits vedettes pour la page d'accueil
 */
export const getFeaturedProductsFn = createServerFn({ method: "GET" }).handler(async () => {
  const products = await listProductsFn();
  return products.filter((p) => p.is_featured);
});

/**
 * Récupère le détail complet d'un produit par son slug
 */
export const getProductBySlugFn = createServerFn({ method: "POST" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    try {
      const product = await queryOne<any>(
        `SELECT p.*,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'country_code', pp.country_code,
                      'price', pp.price,
                      'shipping_fee', pp.shipping_fee
                    )
                  ) FILTER (WHERE pp.id IS NOT NULL), '[]'
                ) as product_prices
         FROM products p
         LEFT JOIN product_prices pp ON pp.product_id = p.id
         WHERE p.slug = $1 AND p.is_active = true
         GROUP BY p.id
         LIMIT 1`,
        [data.slug]
      );

      if (product) {
        // Récupérer aussi les avis
        const reviews = await query<any>(
          `SELECT id, author_name, rating, comment, created_at
           FROM product_reviews
           WHERE product_id = $1
           ORDER BY created_at DESC`,
          [product.id]
        );
        return { product: product as ProductItem, reviews };
      }

      // Fallback local
      const found = INITIAL_PRODUCTS.find((p) => p.slug === data.slug);
      if (found) {
        return {
          product: {
            id: `fallback-${found.slug}`,
            slug: found.slug,
            name: found.name,
            short_description: found.short_description,
            description: found.description,
            category: found.category,
            unit: found.unit,
            stock: found.stock,
            audiences: found.audiences,
            target_audience: found.target_audience,
            image_url: found.image_url,
            is_active: true,
            is_featured: found.is_featured,
            product_prices: found.prices,
          } as ProductItem,
          reviews: [],
        };
      }

      return null;
    } catch (err) {
      console.error("[getProductBySlugFn Error]", err);
      return null;
    }
  });

/**
 * Soumet un avis client pour un produit
 */
export const submitProductReviewFn = createServerFn({ method: "POST" })
  .validator((data: { productId: string; authorName: string; rating: number; comment?: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    const result = await queryOne<any>(
      `INSERT INTO product_reviews (product_id, user_id, author_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_name, rating, comment, created_at`,
      [
        data.productId,
        user?.id || null,
        data.authorName.trim() || (user?.full_name ?? "Client vérifié"),
        Math.max(1, Math.min(5, data.rating)),
        data.comment?.trim() || null,
      ]
    );

    return { review: result, success: true };
  });
