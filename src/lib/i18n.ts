import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
 import { fr } from "./locales/fr";
import { en } from "./locales/en";

const isBrowser = typeof window !== "undefined";

if (!i18n.isInitialized) {
  const chain = isBrowser ? i18n.use(LanguageDetector) : i18n;
  chain.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: isBrowser ? undefined : "fr",
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    interpolation: { escapeValue: false },
    // Sync init so SSR + first client render both have translations available.
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "ch_lang",
      caches: ["localStorage"],
    },
  });
}

export default i18n;