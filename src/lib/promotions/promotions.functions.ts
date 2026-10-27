// Server functions des promotions et des annonces (pop-up)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query, queryOne } from "@/integrations/neon/db.server";
import { ensurePromotionsSchema } from "@/lib/promotions/promotions.server";
import { MAX_PERCENT_OFF, MIN_PERCENT_OFF } from "@/lib/promotions/pricing";

export type AdminPromotionProduct = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  unit: string;
  is_active: boolean;
  /** Prix de base (jamais modifiés par les promotions) */
  prices: { country_code: string; price: number }[];
  promotion: {
    id: string;
    percent_off: number;
    label: string | null;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
  } | null;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  show_promotions: boolean;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/* Promotions (admin)                                                  */
/* ------------------------------------------------------------------ */

export const listPromotionsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    await ensurePromotionsSchema();
    const rows = await query<any>(
      `SELECT p.id, p.slug, p.name, p.image_url, p.unit, p.is_active,
              COALESCE(
                (SELECT json_agg(json_build_object('country_code', pp.country_code, 'price', pp.price)
                                 ORDER BY pp.country_code)
                 FROM product_prices pp WHERE pp.product_id = p.id), '[]'
              ) AS prices,
              CASE WHEN pr.id IS NULL THEN NULL ELSE json_build_object(
                'id', pr.id, 'percent_off', pr.percent_off, 'label', pr.label,
                'starts_at', pr.starts_at, 'ends_at', pr.ends_at, 'is_active', pr.is_active
              ) END AS promotion
       FROM products p
       LEFT JOIN promotions pr ON pr.product_id = p.id
       ORDER BY (pr.id IS NULL), p.name ASC`,
    );
    const countries = await query<{
      code: string;
      name: string;
      currency_code: string;
      currency_symbol: string;
      flag_emoji: string | null;
    }>(
      `SELECT code, name, currency_code, currency_symbol, flag_emoji FROM countries WHERE is_active = true ORDER BY sort_order ASC`,
    );
    const products: AdminPromotionProduct[] = rows.map((r) => ({
      ...r,
      prices: (r.prices || []).map((pp: any) => ({
        country_code: pp.country_code,
        price: Number(pp.price),
      })),
      promotion: r.promotion
        ? { ...r.promotion, percent_off: Number(r.promotion.percent_off) }
        : null,
    }));
    return { products, countries };
  });

// Les dates lues en base reviennent parfois en objets Date : on accepte les deux
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.string().datetime({ offset: true }),
);

const ENDS_IN_PAST = "Cette date de fin est déjà passée : la publication ne serait jamais visible.";
const ENDS_BEFORE_START = "La date de fin doit être après la date de début.";

const upsertPromotionSchema = z
  .object({
    productId: z.string().uuid(),
    percentOff: z.coerce
      .number()
      .min(MIN_PERCENT_OFF, `La remise doit être d'au moins ${MIN_PERCENT_OFF} %.`)
      .max(MAX_PERCENT_OFF, `La remise ne peut pas dépasser ${MAX_PERCENT_OFF} %.`),
    label: z.string().trim().max(60).optional().nullable(),
    startsAt: isoDate.optional().nullable(),
    endsAt: isoDate.optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => !d.endsAt || !d.startsAt || new Date(d.endsAt) > new Date(d.startsAt), {
    message: ENDS_BEFORE_START,
  })
  .refine((d) => !d.isActive || !d.endsAt || new Date(d.endsAt) > new Date(), {
    message: ENDS_IN_PAST,
  });

/** Crée ou remplace la promotion d'un produit (une seule par produit). */
export const upsertPromotionAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertPromotionSchema.parse(data))
  .handler(async ({ data }) => {
    await ensurePromotionsSchema();
    const row = await queryOne<{ id: string }>(
      `INSERT INTO promotions (product_id, percent_off, label, starts_at, ends_at, is_active)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), $5::timestamptz, $6)
       ON CONFLICT (product_id) DO UPDATE SET
         percent_off = EXCLUDED.percent_off,
         label = EXCLUDED.label,
         starts_at = EXCLUDED.starts_at,
         ends_at = EXCLUDED.ends_at,
         is_active = EXCLUDED.is_active,
         updated_at = now()
       RETURNING id`,
      [
        data.productId,
        Math.round(data.percentOff * 100) / 100,
        data.label?.trim() || null,
        data.startsAt || null,
        data.endsAt || null,
        data.isActive,
      ],
    );
    return { id: row?.id ?? null };
  });

export const setPromotionActiveAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data }) => {
    await query(`UPDATE promotions SET is_active = $2, updated_at = now() WHERE id = $1`, [
      data.id,
      data.isActive,
    ]);
    return { success: true };
  });

/** Supprime la promotion : le produit revient immédiatement à son prix de base. */
export const deletePromotionAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await query(`DELETE FROM promotions WHERE id = $1`, [data.id]);
    return { success: true };
  });

/* ------------------------------------------------------------------ */
/* Annonces (pop-up)                                                   */
/* ------------------------------------------------------------------ */

export const listAnnouncementsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    await ensurePromotionsSchema();
    return query<Announcement>(`SELECT * FROM announcements ORDER BY updated_at DESC`);
  });

const httpOrPath = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v.startsWith("/") || /^https?:\/\//.test(v),
    "Le lien doit commencer par / ou https://",
  );

const upsertAnnouncementSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(2, "Titre trop court.").max(80),
    message: z.string().trim().min(2, "Message trop court.").max(400),
    ctaLabel: z.string().trim().max(40).optional().nullable(),
    ctaUrl: httpOrPath.optional().nullable().or(z.literal("")),
    showPromotions: z.boolean().default(true),
    isActive: z.boolean().default(false),
    startsAt: isoDate.optional().nullable(),
    endsAt: isoDate.optional().nullable(),
  })
  .refine((d) => !d.endsAt || !d.startsAt || new Date(d.endsAt) > new Date(d.startsAt), {
    message: ENDS_BEFORE_START,
  })
  .refine((d) => !d.isActive || !d.endsAt || new Date(d.endsAt) > new Date(), {
    message: ENDS_IN_PAST,
  });

export const upsertAnnouncementAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => upsertAnnouncementSchema.parse(data))
  .handler(async ({ data }) => {
    await ensurePromotionsSchema();
    const params = [
      data.title,
      data.message,
      data.ctaLabel?.trim() || null,
      data.ctaUrl?.trim() || null,
      data.showPromotions,
      data.isActive,
      data.startsAt || null,
      data.endsAt || null,
    ];
    // Une seule annonce active à la fois : activer celle-ci met les autres en pause
    if (data.isActive) {
      await query(
        `UPDATE announcements SET is_active = false WHERE is_active = true AND id IS DISTINCT FROM $1`,
        [data.id ?? null],
      );
    }
    if (data.id) {
      await query(
        `UPDATE announcements SET title = $2, message = $3, cta_label = $4, cta_url = $5,
           show_promotions = $6, is_active = $7, starts_at = COALESCE($8::timestamptz, starts_at),
           ends_at = $9::timestamptz, updated_at = now()
         WHERE id = $1`,
        [data.id, ...params],
      );
      return { id: data.id };
    }
    const row = await queryOne<{ id: string }>(
      `INSERT INTO announcements (title, message, cta_label, cta_url, show_promotions, is_active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamptz, now()), $8::timestamptz)
       RETURNING id`,
      params,
    );
    return { id: row?.id ?? null };
  });

export const deleteAnnouncementAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    await query(`DELETE FROM announcements WHERE id = $1`, [data.id]);
    return { success: true };
  });

/** Annonce publique en cours (ou null) — lue par le pop-up de la boutique. */
export const getActiveAnnouncementFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await ensurePromotionsSchema();
    return await queryOne<Announcement>(
      `SELECT * FROM announcements
       WHERE is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
       ORDER BY updated_at DESC
       LIMIT 1`,
    );
  } catch (err) {
    console.error("[Announcements] lecture impossible", err);
    return null;
  }
});
