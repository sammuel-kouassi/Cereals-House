import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";

export interface PublicCityShippingRate {
  id: string;
  country_code: string;
  city_name: string;
  shipping_fee: number;
}

export const listPublicCityShippingRatesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const rates = await query<PublicCityShippingRate>(
        `SELECT id, country_code, city_name, CAST(shipping_fee AS DOUBLE PRECISION) as shipping_fee 
         FROM city_shipping_rates 
         ORDER BY country_code, city_name`
      );
      return { rates: rates ?? [] };
    } catch (err) {
      console.warn("[Shipping Rates Error]", err);
      return { rates: [] };
    }
  });

export const getCityShippingRateForCountryFn = createServerFn({ method: "POST" })
  .validator((data: { countryCode: string; cityName: string }) => data)
  .handler(async ({ data }) => {
    try {
      const rate = await queryOne<PublicCityShippingRate>(
        `SELECT id, country_code, city_name, CAST(shipping_fee AS DOUBLE PRECISION) as shipping_fee
         FROM city_shipping_rates
         WHERE country_code = $1 AND LOWER(TRIM(city_name)) = LOWER(TRIM($2))
         LIMIT 1`,
        [data.countryCode, data.cityName]
      );
      return { rate };
    } catch (err) {
      console.warn("[City Shipping Rate Query Error]", err);
      return { rate: null };
    }
  });
