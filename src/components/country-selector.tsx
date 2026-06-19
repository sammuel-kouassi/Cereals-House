import { useCountry } from "@/lib/country-context";
import { Globe } from "lucide-react";

export function CountrySelector() {
  const { country, countries, setCountryCode } = useCountry();
  if (!country) return null;
  return (
    <label className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold/50">
      <Globe className="h-3.5 w-3.5 text-gold" />
      <span>{country.flag_emoji}</span>
      <select
        value={country.code}
        onChange={(e) => setCountryCode(e.target.value)}
        className="bg-transparent outline-none [&>option]:bg-background [&>option]:text-foreground"
        aria-label="Pays de livraison"
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} ({c.currency_symbol})
          </option>
        ))}
      </select>
    </label>
  );
}
