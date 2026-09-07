// Server functions d'administration pour les produits avec Neon DB
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query, queryOne } from "@/integrations/neon/db.server";

export const listProductsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const products = await query<any>(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', pp.id,
                    'country_code', pp.country_code,
                    'price', pp.price,
                    'shipping_fee', pp.shipping_fee
                  )
                ) FILTER (WHERE pp.id IS NOT NULL), '[]'
              ) as product_prices
       FROM products p
       LEFT JOIN product_prices pp ON pp.product_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    const countries = await query<any>(
      `SELECT code, name, currency_code, currency_symbol, is_active
       FROM countries
       ORDER BY sort_order ASC`
    );

    return { products: products ?? [], countries: countries ?? [] };
  });

const upsertProductInputSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.",
    ),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  short_description: z.string().trim().max(300).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  image_url: z.string().trim().max(2000).optional().nullable(),
  unit: z.string().trim().min(1).max(30).default("kg"),
  stock: z.number().int().min(0),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  weight_g: z.number().int().min(0).optional().nullable(),
  target_audience: z.string().trim().max(300).optional().nullable(),
  composition: z.string().trim().max(2000).optional().nullable(),
  benefits: z.string().trim().max(2000).optional().nullable(),
  preparation: z.string().trim().max(2000).optional().nullable(),
  audiences: z.array(z.string()).default([]),
});

export const upsertProductAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertProductInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { id, ...fields } = data;
    if (id) {
      await query(
        `UPDATE products SET
          slug = $1, name = $2, description = $3, short_description = $4,
          category = $5, image_url = $6, unit = $7, stock = $8,
          is_active = $9, is_featured = $10, weight_g = $11,
          target_audience = $12, composition = $13, benefits = $14,
          preparation = $15, audiences = $16, updated_at = now()
         WHERE id = $17`,
        [
          fields.slug, fields.name, fields.description || null, fields.short_description || null,
          fields.category || null, fields.image_url || null, fields.unit, fields.stock,
          fields.is_active, fields.is_featured, fields.weight_g || null,
          fields.target_audience || null, fields.composition || null, fields.benefits || null,
          fields.preparation || null, fields.audiences, id
        ]
      );
      return { id };
    }

    const created = await queryOne<{ id: string }>(
      `INSERT INTO products (
        slug, name, description, short_description, category, image_url, unit, stock,
        is_active, is_featured, weight_g, target_audience, composition, benefits, preparation, audiences
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        fields.slug, fields.name, fields.description || null, fields.short_description || null,
        fields.category || null, fields.image_url || null, fields.unit, fields.stock,
        fields.is_active, fields.is_featured, fields.weight_g || null,
        fields.target_audience || null, fields.composition || null, fields.benefits || null,
        fields.preparation || null, fields.audiences
      ]
    );

    return { id: created?.id };
  });

const deleteProductInputSchema = z.object({ id: z.string() });

export const deleteProductAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deleteProductInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(`UPDATE products SET is_active = false, updated_at = now() WHERE id = $1`, [data.id]);
    return { success: true };
  });

const upsertPriceInputSchema = z.object({
  productId: z.string(),
  countryCode: z.string().length(2),
  price: z.number().positive(),
  shippingFee: z.number().min(0).optional().nullable(),
});

export const upsertProductPriceAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertPriceInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(
      `INSERT INTO product_prices (product_id, country_code, price, shipping_fee)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, country_code) DO UPDATE SET
         price = EXCLUDED.price,
         shipping_fee = EXCLUDED.shipping_fee`,
      [data.productId, data.countryCode, data.price, data.shippingFee ?? null]
    );
    return { success: true };
  });

const updateStockInputSchema = z.object({
  productId: z.string(),
  stock: z.number().int().min(0),
});

export const updateProductStockAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => updateStockInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(`UPDATE products SET stock = $1, updated_at = now() WHERE id = $2`, [data.stock, data.productId]);
    return { success: true };
  });