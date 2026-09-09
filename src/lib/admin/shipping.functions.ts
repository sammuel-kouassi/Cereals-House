import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query, queryOne } from "@/integrations/neon/db.server";

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
      `SELECT id, country_code, city_name, CAST(shipping_fee AS DOUBLE PRECISION) as shipping_fee 
       FROM city_shipping_rates 
       ORDER BY country_code, city_name`
    );
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
    const normalizedCity = data.cityName.trim();
    if (data.id) {
      const updated = await queryOne<CityShippingRate>(
        `UPDATE city_shipping_rates 
         SET country_code = $1, city_name = $2, shipping_fee = $3, updated_at = now() 
         WHERE id = $4
         RETURNING id, country_code, city_name, CAST(shipping_fee AS DOUBLE PRECISION) as shipping_fee`,
        [data.countryCode, normalizedCity, data.shippingFee, data.id]
      );
      return { success: true, rate: updated };
    } else {
      const inserted = await queryOne<CityShippingRate>(
        `INSERT INTO city_shipping_rates (country_code, city_name, shipping_fee) 
         VALUES ($1, $2, $3)
         ON CONFLICT (country_code, city_name) 
         DO UPDATE SET shipping_fee = EXCLUDED.shipping_fee, updated_at = now()
         RETURNING id, country_code, city_name, CAST(shipping_fee AS DOUBLE PRECISION) as shipping_fee`,
        [data.countryCode, normalizedCity, data.shippingFee]
      );
      return { success: true, rate: inserted };
    }
  });

const deleteInputSchema = z.object({ id: z.string() });

export const deleteCityShippingRateAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deleteInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(`DELETE FROM city_shipping_rates WHERE id = $1`, [data.id]);
    return { success: true };
  });
