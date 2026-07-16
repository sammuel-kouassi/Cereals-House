// Server functions d'administration pour la table "countries". C'est la
// table de référence dont dépendent les prix produits (product_prices.
// country_code) et les commandes — elle doit être peuplée AVANT les produits.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";

export const listCountriesAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("countries")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { countries: data ?? [] };
  });

const upsertCountryInputSchema = z.object({
  code: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/, "Le code pays doit être 2 lettres majuscules (ex: CI).")
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(100),
  currency_code: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/, "Le code devise doit être 3 lettres majuscules (ex: XOF).")
    .transform((v) => v.toUpperCase()),
  currency_symbol: z.string().trim().min(1).max(10),
  base_shipping_fee: z.number().min(0),
  flag_emoji: z.string().trim().max(10).optional().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().default(0),
  fx_rate_from_xof: z.number().positive().default(1),
  isNew: z.boolean().default(false),
});

export const upsertCountryAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertCountryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isNew, ...fields } = data;

    if (isNew) {
      const { error } = await supabaseAdmin.from("countries").insert(fields);
      if (error) throw new Error(error.message);
    } else {
      const { code, ...rest } = fields;
      const { error } = await supabaseAdmin.from("countries").update(rest).eq("code", code);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

const deactivateCountryInputSchema = z.object({ code: z.string().length(2) });

export const deactivateCountryAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deactivateCountryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Désactivation plutôt que suppression : un pays peut être référencé par
    // des commandes/prix existants (ON DELETE CASCADE les supprimerait aussi).
    const { error } = await supabaseAdmin
      .from("countries")
      .update({ is_active: false })
      .eq("code", data.code);
    if (error) throw new Error(error.message);
    return { success: true };
  });
