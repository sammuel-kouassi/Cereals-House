// Accès serveur aux promotions : création paresseuse des tables et application
// des remises aux prix lus en base.
import { query } from "@/integrations/neon/db.server";
import { currencyDecimals, discountedPrice, type PromotionInfo } from "@/lib/promotions/pricing";

// Même contenu que supabase/migrations/20261027190000_add_promotions_and_announcements.sql
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    percent_off NUMERIC(5,2) NOT NULL CHECK (percent_off >= 1 AND percent_off <= 90),
    label TEXT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at > starts_at)
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    cta_label TEXT,
    cta_url TEXT,
    show_promotions BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT false,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

let _schemaReady: Promise<void> | null = null;
export function ensurePromotionsSchema(): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) await query(stmt);
    })().catch((err) => {
      _schemaReady = null;
      throw err;
    });
  }
  return _schemaReady;
}

/** Promotions en cours (actives et dans leurs dates), indexées par produit. */
export async function getLivePromotions(): Promise<Map<string, PromotionInfo>> {
  try {
    await ensurePromotionsSchema();
    const rows = await query<{
      id: string;
      product_id: string;
      percent_off: string | number;
      label: string | null;
      ends_at: string | null;
    }>(
      `SELECT id, product_id, percent_off, label, ends_at
       FROM promotions
       WHERE is_active = true
         AND starts_at <= now()
         AND (ends_at IS NULL OR ends_at > now())`,
    );
    return new Map(
      rows.map((r) => [
        r.product_id,
        { id: r.id, percent_off: Number(r.percent_off), label: r.label, ends_at: r.ends_at },
      ]),
    );
  } catch (err) {
    // Une panne des promotions ne doit jamais empêcher de vendre au prix normal
    console.error("[Promotions] lecture impossible, prix normaux appliqués", err);
    return new Map();
  }
}

/** Nombre de décimales par pays, d'après la devise configurée. */
export async function getCountryDecimals(): Promise<Map<string, number>> {
  try {
    const rows = await query<{ code: string; currency_code: string }>(
      `SELECT code, currency_code FROM countries`,
    );
    return new Map(rows.map((r) => [r.code, currencyDecimals(r.currency_code)]));
  } catch {
    return new Map();
  }
}

type PricedProduct = {
  id: string;
  product_prices: { country_code: string; price: number; compare_at_price?: number | null }[];
};

/**
 * Remplace chaque prix par le prix remisé et conserve l'ancien dans
 * `compare_at_price` (affiché barré). Sans promotion, rien ne change.
 */
export function applyPromotion<T extends PricedProduct>(
  product: T,
  promo: PromotionInfo | undefined,
  decimals: Map<string, number> = new Map(),
): T & { promotion: PromotionInfo | null } {
  if (!promo) return { ...product, promotion: null };
  return {
    ...product,
    promotion: promo,
    product_prices: product.product_prices.map((pp) => ({
      ...pp,
      price: discountedPrice(pp.price, promo.percent_off, decimals.get(pp.country_code) ?? 0),
      compare_at_price: pp.price,
    })),
  };
}
