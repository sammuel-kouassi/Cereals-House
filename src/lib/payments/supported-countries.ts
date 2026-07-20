// Liste des pays où l'intégration de paiement en ligne CinetPay est active.
// Fichier volontairement minimal et sans dépendance au SDK cinetpay-js (qui,
// lui, est serveur-only) : il est importé aussi bien par du code client
// (checkout.tsx, orders.$id.tsx) que par cinetpay.server.ts, donc il ne doit
// jamais tirer de secret ni de librairie serveur avec lui.
//
// ⚠️ Réduit temporairement à la Côte d'Ivoire (19/07/2026) : le support
// CinetPay a confirmé (1) que chaque pays nécessite un compte/des identifiants
// séparés — le partage entre pays ne fonctionne pas — et (2) que leurs
// services sont pour l'instant MOMENTANÉMENT INDISPONIBLES au Mali, Burkina
// Faso, Togo et Bénin. Remettre ces pays ici dès que de vrais identifiants
// (CINETPAY_API_KEY_XX / CINETPAY_API_PASSWORD_XX) sont obtenus et que
// CinetPay confirme la réouverture de son service dans le pays concerné.
export const CINETPAY_SUPPORTED_COUNTRIES = ["CI"] as const;

export type CinetPaySupportedCountry = (typeof CINETPAY_SUPPORTED_COUNTRIES)[number];

export function isCinetPaySupportedCountry(
  code: string | undefined | null,
): code is CinetPaySupportedCountry {
  return !!code && (CINETPAY_SUPPORTED_COUNTRIES as readonly string[]).includes(code);
}