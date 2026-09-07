// Server functions d'administration pour la table "countries" avec Neon DB
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query } from "@/integrations/neon/db.server";

export const listCountriesAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const countries = await query<any>(
      `SELECT * FROM countries ORDER BY sort_order ASC`
    );
    return { countries: countries ?? [] };
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
  isNew: z.boolean().default(false),
});

export const upsertCountryAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertCountryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { isNew, ...fields } = data;

    if (isNew) {
      await query(
        `INSERT INTO countries (code, name, currency_code, currency_symbol, base_shipping_fee, flag_emoji, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           currency_code = EXCLUDED.currency_code,
           currency_symbol = EXCLUDED.currency_symbol,
           base_shipping_fee = EXCLUDED.base_shipping_fee,
           flag_emoji = EXCLUDED.flag_emoji,
           is_active = EXCLUDED.is_active,
           sort_order = EXCLUDED.sort_order`,
        [
          fields.code,
          fields.name,
          fields.currency_code,
          fields.currency_symbol,
          fields.base_shipping_fee,
          fields.flag_emoji || null,
          fields.is_active,
          fields.sort_order,
        ]
      );
    } else {
      await query(
        `UPDATE countries SET
           name = $1,
           currency_code = $2,
           currency_symbol = $3,
           base_shipping_fee = $4,
           flag_emoji = $5,
           is_active = $6,
           sort_order = $7
         WHERE code = $8`,
        [
          fields.name,
          fields.currency_code,
          fields.currency_symbol,
          fields.base_shipping_fee,
          fields.flag_emoji || null,
          fields.is_active,
          fields.sort_order,
          fields.code,
        ]
      );
    }
    return { success: true };
  });

const deactivateCountryInputSchema = z.object({ code: z.string().length(2) });

export const deactivateCountryAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => deactivateCountryInputSchema.parse(data))
  .handler(async ({ data }) => {
    await query(`UPDATE countries SET is_active = false WHERE code = $1`, [data.code]);
    return { success: true };
  });
