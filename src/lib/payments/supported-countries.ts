// Gestion des pays où le paiement en ligne direct est actif.
// Actuellement, seule la Côte d'Ivoire (CI) dispose du paiement en ligne instantané via Paystack :
// - Mobile Money : Wave, Orange Money, MTN MoMo, Moov Money
// - Cartes bancaires : Visa, Mastercard, Apple Pay
//
// Les autres pays (Sénégal, Mali, Burkina, France, etc.) sont gérés via le parcours de commande export assistée sur-mesure.

export const ONLINE_PAYMENT_SUPPORTED_COUNTRIES = ["CI"] as const;

export type OnlinePaymentSupportedCountry =
  (typeof ONLINE_PAYMENT_SUPPORTED_COUNTRIES)[number];

export function isOnlinePaymentSupported(
  code: string | undefined | null,
): boolean {
  if (!code) return false;
  return code.toUpperCase().trim() === "CI";
}

// Alias de rétro-compatibilité
export const CINETPAY_SUPPORTED_COUNTRIES = ["CI"] as const;
export type CinetPaySupportedCountry = (typeof CINETPAY_SUPPORTED_COUNTRIES)[number];
export function isCinetPaySupportedCountry(
  code: string | undefined | null,
): boolean {
  return isOnlinePaymentSupported(code);
}
