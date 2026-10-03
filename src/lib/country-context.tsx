import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listCountriesFn, type CountryItem } from "@/lib/products/products.functions";
import {
  isOnlinePaymentSupported,
  ONLINE_PAYMENT_SUPPORTED_COUNTRIES,
} from "@/lib/payments/supported-countries";
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

const FALLBACK_COUNTRIES: CountryItem[] = [
  {
    code: "CI",
    name: "Côte d'Ivoire",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 1500,
    flag_emoji: "🇨🇮",
    is_active: true,
    sort_order: 1,
  },
  {
    code: "SN",
    name: "Sénégal",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 2000,
    flag_emoji: "🇸🇳",
    is_active: true,
    sort_order: 2,
  },
  {
    code: "ML",
    name: "Mali",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 2500,
    flag_emoji: "🇲🇱",
    is_active: true,
    sort_order: 3,
  },
  {
    code: "BF",
    name: "Burkina Faso",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 2500,
    flag_emoji: "🇧🇫",
    is_active: true,
    sort_order: 4,
  },
  {
    code: "BJ",
    name: "Bénin",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 2500,
    flag_emoji: "🇧🇯",
    is_active: true,
    sort_order: 5,
  },
  {
    code: "TG",
    name: "Togo",
    currency_code: "XOF",
    currency_symbol: "FCFA",
    base_shipping_fee: 2500,
    flag_emoji: "🇹🇬",
    is_active: true,
    sort_order: 6,
  },
];

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>(FALLBACK_COUNTRIES);
  const [code, setCode] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isOnlinePaymentSupported(saved)) {
        return saved.toUpperCase();
      }
    }
    return "CI";
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCountriesFn()
      .then((data) => {
        // Filtre les pays supportés pour la boutique client (CI, SN, ML, BF, BJ, TG)
        const supportedList = (data ?? []).filter((c) =>
          isOnlinePaymentSupported(c.code)
        );
        if (supportedList.length > 0) {
          // Trie selon sort_order
          supportedList.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
          setCountries(supportedList);
        }
      })
      .catch((err) => {
        console.error("[CountryProvider load error]", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setCountryCode = (newCode: string) => {
    const upper = newCode.toUpperCase().trim();
    if (isOnlinePaymentSupported(upper)) {
      setCode(upper);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, upper);
      }
    }
  };

  const country =
    countries.find((c) => c.code === code) ??
    countries.find((c) => c.code === "CI") ??
    countries[0] ??
    null;

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
