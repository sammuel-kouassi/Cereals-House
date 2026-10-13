/**
 * Référencement (SEO) : constantes et helpers partagés client / serveur.
 * Les informations de l'entreprise reprennent celles déjà affichées sur le site
 * (pied de page et page contact). Les modifier ici les met à jour partout
 * (balises Google, sitemap, données structurées).
 */

export const SITE_URL = "https://cereals-house.com";
export const SITE_NAME = "Cereals House";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero/hero_maison_cereales_boutique.jpg`;
export const LOGO_URL = `${SITE_URL}/logo.jpg`;

export const BUSINESS = {
  email: "contact@cereals-house.com",
  telephone: "+225 05 84 63 72 19",
  streetAddress: "9 Boulevard de France, Cocody Riviera",
  addressLocality: "Abidjan",
  addressCountry: "CI",
  founder: "DOSSOU Lucette",
  sameAs: [
    "https://www.facebook.com/share/1HjoGWMccN/?mibextid=wwXIfr",
    "https://www.tiktok.com/@shopingcommerce",
  ],
} as const;

/** Rend une URL d'image absolue (Google et les réseaux sociaux l'exigent). */
export function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  // Images intégrées (data:) : inutilisables par Google et les réseaux sociaux
  if (!pathOrUrl || pathOrUrl.startsWith("data:")) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Chemin équivalent dans l'autre langue (/fr/... <-> /en/...). */
export function localizedPath(pathname: string, lang: "fr" | "en"): string {
  const rest = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");
  return `/${lang}${rest === "/" ? "" : rest}`;
}

/** Données structurées de l'entreprise (schema.org), lues par Google. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: LOGO_URL,
        image: DEFAULT_OG_IMAGE,
        description:
          "Céréales et produits d'Afrique de l'Ouest : mil, fonio, sorgho et farines soigneusement triés, sans sable ni conservateurs.",
        email: BUSINESS.email,
        telephone: BUSINESS.telephone,
        founder: { "@type": "Person", name: BUSINESS.founder },
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS.streetAddress,
          addressLocality: BUSINESS.addressLocality,
          addressCountry: BUSINESS.addressCountry,
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: BUSINESS.telephone,
          email: BUSINESS.email,
          availableLanguage: ["French", "English"],
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:00",
            closes: "19:00",
          },
        },
        sameAs: BUSINESS.sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["fr", "en"],
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}
