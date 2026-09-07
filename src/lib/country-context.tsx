import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listCountriesFn, type CountryItem } from "@/lib/products/products.functions";

export type Country = CountryItem;

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
    if (saved) setCode(saved);

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
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, c);
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
