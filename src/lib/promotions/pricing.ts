/**
 * Règles de prix des promotions, partagées entre le serveur (prix faisant foi)
 * et l'interface (aperçu en direct dans l'admin).
 *
 * Principe : le prix de base d'un produit n'est jamais modifié. Une promotion
 * est un pourcentage stocké à part ; le prix remisé est calculé à la lecture.
 * Supprimer ou mettre en pause la promotion rend donc l'ancien prix aussitôt.
 */

export type PromotionInfo = {
  id: string;
  percent_off: number;
  label: string | null;
  ends_at: string | null;
};

export type PromotionStatus = "active" | "scheduled" | "ended" | "paused";

export const MIN_PERCENT_OFF = 1;
export const MAX_PERCENT_OFF = 90;

/** Devises affichées sans décimales (même règle que formatPrice). */
const WHOLE_CURRENCIES = new Set(["XOF", "FCFA", "GHS"]);

export function currencyDecimals(currencyCode: string | null | undefined): number {
  return !currencyCode || WHOLE_CURRENCIES.has(currencyCode.toUpperCase()) ? 0 : 2;
}

/** Prix remisé, arrondi selon la devise : à l'unité (FCFA, cedi) ou au centime (€, $). */
export function discountedPrice(price: number, percentOff: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(price * (1 - percentOff / 100) * factor) / factor;
}

export function promotionStatus(
  p: {
    is_active: boolean;
    starts_at: string | Date;
    ends_at: string | Date | null;
  },
  now = new Date(),
): PromotionStatus {
  if (!p.is_active) return "paused";
  if (new Date(p.starts_at) > now) return "scheduled";
  if (p.ends_at && new Date(p.ends_at) <= now) return "ended";
  return "active";
}
