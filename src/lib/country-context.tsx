import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listCountriesFn, type CountryItem } from "@/lib/products/products.functions";
import i18n from "@/lib/i18n";

export type Country = CountryItem;

const ANGLOPHONE_COUNTRIES = new Set([
  "US",
  "USA",
  "GB",
  "UK",
  "GH",
  "NG",
  "KE",
  "ZA",
  "LR",
  "SL",
  "GM",
  "UG",
  "TZ",
  "RW",
  "CA",
  "AU",
  "NZ",
  "IE",
]);

/**
 * Détermine la langue selon le pays sélectionné :
 * - Anglais ("en") pour les pays anglophones (USA, Ghana, Nigeria, UK, etc.)
 * - Français ("fr") pour les pays francophones (Côte d'Ivoire, Sénégal, Mali, Burkina Faso, France, etc.)
 */
export function getLanguageForCountry(countryCode?: string | null): "fr" | "en" {
  if (!countryCode) return "fr";
  const upper = countryCode.toUpperCase().trim();
  return ANGLOPHONE_COUNTRIES.has(upper) ? "en" : "fr";
}

type Ctx = {
  countries: Country[];
  country: Country | null;
  setCountryCode: (code: string) => void;
  loading: boolean;
};

const CountryContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "ch_country";

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [code, setCode] = useState<string>("CI");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initialCode = saved || "CI";
    setCode(initialCode);

    listCountriesFn()
      .then((data) => {
        setCountries(data ?? []);
      })
      .catch((err) => {
        console.error("[CountryProvider load error]", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setCountryCode = (c: string) => {
    setCode(c);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, c);
    }
  };

  const country = countries.find((c) => c.code === code) ?? countries[0] ?? null;

  return (
    <CountryContext.Provider value={{ countries, country, setCountryCode, loading }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
