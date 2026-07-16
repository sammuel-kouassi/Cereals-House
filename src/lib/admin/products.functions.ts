// Server functions d'administration pour les produits, leurs prix par pays et
// leur stock. supabaseAdmin (service_role) contourne délibérément les RLS
// "products_public_read"/"prices_public_read" (lecture seule pour le public)
// puisqu'on a besoin d'écrire, et que les policies admin_all ont été retirées
// du côté client (voir require-admin.ts).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";

export const listProductsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*, product_prices(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: countries, error: countriesErr } = await supabaseAdmin
      .from("countries")
      .select("code, name, currency_code, currency_symbol, is_active")
      .order("sort_order", { ascending: true });
    if (countriesErr) throw new Error(countriesErr.message);

    return { products: products ?? [], countries: countries ?? [] };
  });

const upsertProductInputSchema = z.object({
  id: z.string().uuid().optional(), // absent → création
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
  // Utilisé pour le filtre "Public" de la boutique (enfant/adulte) — tableau
  // de tags libres plutôt qu'un enum strict, pour rester extensible.
  audiences: z.array(z.string()).default([]),
});

export const upsertProductAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertProductInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { id, ...fields } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("products").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

const deleteProductInputSchema = z.object({ id: z.string().uuid() });

export const deleteProductAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deleteProductInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Désactivation plutôt que suppression : préserve l'historique des
    // commandes passées qui référencent ce produit.
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const upsertPriceInputSchema = z.object({
  productId: z.string().uuid(),
  countryCode: z.string().length(2),
  price: z.number().positive(),
  shippingFee: z.number().min(0).optional().nullable(),
});

export const upsertProductPriceAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertPriceInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("product_prices").upsert(
      {
        product_id: data.productId,
        country_code: data.countryCode,
        price: data.price,
        shipping_fee: data.shippingFee ?? null,
      },
      { onConflict: "product_id,country_code" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });

const updateStockInputSchema = z.object({
  productId: z.string().uuid(),
  stock: z.number().int().min(0),
});

export const updateProductStockAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => updateStockInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ stock: data.stock })
      .eq("id", data.productId);
    if (error) throw new Error(error.message);
    return { success: true };
  });