// Deux notions d'URL de base, volontairement séparées :
//
// - APP_URL : utilisée UNIQUEMENT pour les callbacks CinetPay
//   (successUrl/failedUrl/notifyUrl). Doit TOUJOURS être une URL joignable
//   depuis Internet par les serveurs CinetPay — jamais "localhost" (ngrok en
//   développement, le vrai domaine en production).
//
// - PUBLIC_APP_URL : utilisée pour tout lien cliqué par un humain (lien de
//   paiement envoyé au client, lien de suivi dans les emails, lien vers
//   l'admin). Si non définie, retombe sur APP_URL. Permet de mettre
//   "http://localhost:8080" ici pendant qu'on teste soi-même sur la même
//   machine, sans jamais casser les webhooks CinetPay qui restent sur
//   l'URL ngrok/production via APP_URL.
export function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error(
      "Variable d'environnement APP_URL manquante (ex: https://cerealshouse.com, ou l'URL " +
        "ngrok en développement). Nécessaire pour les callbacks CinetPay (successUrl/failedUrl/notifyUrl), " +
        "qui doivent être joignables depuis Internet par leurs serveurs.",
    );
  }
  return url.replace(/\/$/, "");
}

export function getPublicAppUrl(): string {
  const url = process.env.PUBLIC_APP_URL ?? process.env.APP_URL;
  if (!url) {
    throw new Error(
      "Variable d'environnement PUBLIC_APP_URL (ou à défaut APP_URL) manquante. " +
        "Nécessaire pour construire les liens cliqués par un humain (paiement, suivi de commande, admin).",
    );
  }
  return url.replace(/\/$/, "");
}
