// Liste des pays où l'intégration de paiement en ligne CinetPay est active.
// Fichier volontairement minimal et sans dépendance au SDK cinetpay-js (qui,
// lui, est serveur-only) : il est importé aussi bien par du code client
// (checkout.tsx, orders.$id.tsx) que par cinetpay.server.ts, donc il ne doit
// jamais tirer de secret ni de librairie serveur avec lui.
//
// Le Ghana n'y figure pas : CinetPay ne le supporte pas du tout sur cette API
// (ni le pays, ni sa devise GHS) — voir cinetpay.server.ts pour le détail.
export const CINETPAY_SUPPORTED_COUNTRIES = ["CI", "BF", "ML", "TG", "BJ"] as const;

export type CinetPaySupportedCountry = (typeof CINETPAY_SUPPORTED_COUNTRIES)[number];

export function isCinetPaySupportedCountry(
  code: string | undefined | null,
): code is CinetPaySupportedCountry {
  return !!code && (CINETPAY_SUPPORTED_COUNTRIES as readonly string[]).includes(code);
}
