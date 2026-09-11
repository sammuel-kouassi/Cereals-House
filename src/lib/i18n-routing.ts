import { useRouter, useLocation } from "@tanstack/react-router";
import i18n from "@/lib/i18n";
import { getLanguageForCountry } from "./country-context";

export type SupportedLanguage = "fr" | "en";

export function getCurrentLangFromPath(pathname: string): SupportedLanguage {
  const segment = pathname.split("/")[1]?.toLowerCase();
  if (segment === "en") return "en";
  if (segment === "fr") return "fr";
  return (i18n.language === "en" ? "en" : "fr") as SupportedLanguage;
}

/**
 * Retourne le chemin préfixé par la langue active (/fr/... ou /en/...).
 */
export function getLocalizedPath(path: string, targetLang?: string): string {
  const lang = targetLang || (i18n.language === "en" ? "en" : "fr");
  // Nettoie le chemin des préfixes existants /fr ou /en
  let cleanPath = path.replace(/^\/(fr|en)(\/|$)/, "/");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  if (cleanPath === "/") return `/${lang}`;
  return `/${lang}${cleanPath}`;
}

/**
 * Hook pour changer de langue et synchroniser l'URL (/fr/... <-> /en/...).
 */
export function useLanguageNavigation() {
  const router = useRouter();
  const location = useLocation();

  const switchLanguage = (newLang: SupportedLanguage) => {
    i18n.changeLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_lang", newLang);
      document.documentElement.lang = newLang;
      const targetPath = getLocalizedPath(window.location.pathname + window.location.search + window.location.hash, newLang);
      window.location.href = targetPath;
      return;
    }
    const targetPath = getLocalizedPath(location.pathname + location.search + location.hash, newLang);
    router.navigate({ href: targetPath, replace: true });
  };

  const syncLanguageWithCountry = (countryCode: string) => {
    const targetLang = getLanguageForCountry(countryCode);
    i18n.changeLanguage(targetLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_lang", targetLang);
    }
    const currentLang = getCurrentLangFromPath(location.pathname);
    if (currentLang !== targetLang) {
      const targetPath = getLocalizedPath(location.pathname + location.search + location.hash, targetLang);
      router.navigate({ href: targetPath, replace: true });
    }
  };

  return {
    currentLang: (i18n.language === "en" ? "en" : "fr") as SupportedLanguage,
    switchLanguage,
    syncLanguageWithCountry,
    getLocalizedPath: (p: string) => getLocalizedPath(p, i18n.language === "en" ? "en" : "fr"),
  };
}
