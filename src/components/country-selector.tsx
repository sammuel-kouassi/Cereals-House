import { useCountry } from "@/lib/country-context";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/flag";

export function CountrySelector({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Masque le nom du pays sous 1280px (header desktop compact) */
  compact?: boolean;
}) {
  const { country, countries, setCountryCode } = useCountry();
  const { t } = useTranslation();

  if (!country) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label
        className="group relative flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-xs text-foreground/90 transition-colors duration-200 hover:border-stone-500 dark:border-stone-700 cursor-pointer select-none"
        title={t("common.chooseCountry", "Choisir le pays de livraison")}
      >
        <Flag code={country.code} className="h-3.5 w-5 rounded-[2px] object-cover shadow-2xs" />
        <span className={`text-foreground ${compact ? "hidden xl:inline" : ""}`}>
          {country.name}
        </span>
        <span className="text-[11px] text-stone-500">
          {country.currency_symbol || "FCFA"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-stone-500" />

        {/* Sélecteur natif invisible qui couvre l'ensemble pour un UX tactile et desktop parfait */}
        <select
          value={country.code}
          onChange={(e) => setCountryCode(e.target.value)}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          aria-label={t("common.country", "Choisir le pays de livraison")}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code} className="bg-card text-foreground py-1">
              {c.name} ({c.currency_symbol})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}