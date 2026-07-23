// Server functions d'administration pour les exceptions de frais de
// livraison par ville (ex: Abidjan moins cher que le reste de la Côte
// d'Ivoire). Voir supported-countries / checkout.tsx pour la logique de
// résolution (ville trouvée → ce tarif ; sinon → tarif de base du pays).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";

export const listCityShippingRatesAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("city_shipping_rates")
      .select("*")
      .order("country_code", { ascending: true });
    if (error) throw new Error(error.message);
    return { rates: data ?? [] };
  });

const upsertInputSchema = z.object({
  id: z.string().uuid().optional(),
  countryCode: z.string().length(2),
  cityName: z.string().trim().min(1).max(80),
  shippingFee: z.number().min(0),
});

export const upsertCityShippingRateAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("city_shipping_rates").upsert(
      {
        id: data.id,
        country_code: data.countryCode.toUpperCase(),
        city_name: data.cityName,
        shipping_fee: data.shippingFee,
      },
      { onConflict: "country_code,city_name" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });

const deleteInputSchema = z.object({ id: z.string().uuid() });

export const deleteCityShippingRateAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deleteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("city_shipping_rates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });