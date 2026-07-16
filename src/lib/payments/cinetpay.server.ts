// Client CinetPay — SERVEUR UNIQUEMENT. Utilise le SDK officiel `cinetpay-js`
// (API "Direct v1"), configuré avec un compte marchand distinct par pays
// (règle CinetPay : "un compte = un pays" — chaque pays a son propre
// api_key/api_password).
//
// Pays actuellement pris en charge : Côte d'Ivoire, Burkina Faso, Mali, Togo,
// Bénin (tous en XOF). Le Ghana n'est PAS supporté par cette API CinetPay
// (ni comme pays, ni sa devise GHS) — voir cinetpay.functions.ts.
import { CinetPayClient, type CountryCode, type ClientConfig } from "cinetpay-js";
import {
  CINETPAY_SUPPORTED_COUNTRIES,
  type CinetPaySupportedCountry,
} from "@/lib/payments/supported-countries";

export const CINETPAY_MIN_AMOUNT = 100;
export const CINETPAY_MAX_AMOUNT = 2_500_000;

export type SupportedCinetPayCountry = CinetPaySupportedCountry;

// Vérification de cohérence au niveau des types : chaque pays qu'on active
// doit exister dans le SDK cinetpay-js. Cette ligne ne produit aucun code —
// si un pays invalide était ajouté à la liste partagée, ceci casserait la
// compilation ici plutôt qu'en production.
const _typeCheck: readonly CountryCode[] = CINETPAY_SUPPORTED_COUNTRIES;
void _typeCheck;

let _client: CinetPayClient | undefined;
let _configuredCountries: Set<string> | undefined;

function loadConfiguredCredentials(): ClientConfig["credentials"] {
  const credentials: Partial<Record<SupportedCinetPayCountry, { apiKey: string; apiPassword: string }>> = {};
  for (const country of CINETPAY_SUPPORTED_COUNTRIES) {
    const apiKey = process.env[`CINETPAY_API_KEY_${country}`];
    const apiPassword = process.env[`CINETPAY_API_PASSWORD_${country}`];
    if (apiKey && apiPassword) {
      credentials[country] = { apiKey, apiPassword };
    }
  }
  return credentials as ClientConfig["credentials"];
}

/**
 * Client CinetPay singleton, initialisé paresseusement avec les identifiants
 * de TOUS les pays configurés dans l'environnement (un pays sans variables
 * d'environnement définies est simplement absent — pas d'erreur au démarrage,
 * l'erreur ne survient que si on tente réellement un paiement pour ce pays).
 */
export function getCinetPayClient(): CinetPayClient {
  const credentials = loadConfiguredCredentials();
  _configuredCountries = new Set(Object.keys(credentials));

  if (!_client) {
    _client = new CinetPayClient({
      credentials,
      // TEMPORAIRE — à retirer une fois le paiement carte validé. Logge les
      // requêtes/réponses HTTP (mots de passe/numéros de carte masqués) pour
      // diagnostiquer un refus de paiement.
      debug: true,
    });
  }
  return _client;
}

/** Vrai si le pays est dans notre périmètre ET que ses identifiants sont configurés. */
export function isCinetPayCountryReady(
  countryCode: string,
): countryCode is SupportedCinetPayCountry {
  if (!_configuredCountries) getCinetPayClient();
  return (
    (CINETPAY_SUPPORTED_COUNTRIES as readonly string[]).includes(countryCode) &&
    !!_configuredCountries?.has(countryCode)
  );
}