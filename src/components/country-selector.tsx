import { useCountry } from "@/lib/country-context";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/flag";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function CountrySelector() {
  const { country, countries, setCountryCode } = useCountry();
  const { syncLanguageWithCountry } = useLanguageNavigation();
  const { t } = useTranslation();
  if (!country) return null;
  return (
    <label className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold/50 cursor-pointer">
      <Globe className="h-3.5 w-3.5 text-gold" />
      <Flag code={country.code} />
      <select
        value={country.code}
        onChange={(e) => {
          const newCode = e.target.value;
          setCountryCode(newCode);
          syncLanguageWithCountry(newCode);
        }}
        className="bg-transparent outline-none [&>option]:bg-background [&>option]:text-foreground cursor-pointer"
        aria-label={t("common.country")}
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