import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query } from "@/integrations/neon/db.server";

export interface CityShippingRate {
  id: string;
  country_code: string;
  city_name: string;
  shipping_fee: number;
}

export const listCityShippingRatesAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const rates = await query<CityShippingRate>(
      `SELECT id, country_code, city_name, shipping_fee FROM city_shipping_rates ORDER BY country_code, city_name`
    ).catch(() => [] as CityShippingRate[]);
    return { rates: rates ?? [] };
  });

const upsertInputSchema = z.object({
  id: z.string().optional(),
  countryCode: z.string().length(2),
  cityName: z.string().trim().min(1).max(80),
  shippingFee: z.number().min(0),
});

export const upsertCityShippingRateAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertInputSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.id) {
      await query(
        `UPDATE city_shipping_rates SET country_code = $1, city_name = $2, shipping_fee = $3, updated_at = now() WHERE id = $4`,
        [data.countryCode, data.cityName, data.shippingFee, data.id]
      ).catch(() => null);
    } else {
      await query(
        `INSERT INTO city_shipping_rates (country_code, city_name, shipping_fee) VALUES ($1, $2, $3)`,
        [data.countryCode, data.cityName, data.shippingFee]
      ).catch(() => null);
    }
    return { success: true };
  });

const deleteInputSchema = z.object({ id: z.string() });

export const deleteCityShippingRateAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deleteInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(`DELETE FROM city_shipping_rates WHERE id = $1`, [data.id]).catch(() => null);
    return { success: true };
  });
