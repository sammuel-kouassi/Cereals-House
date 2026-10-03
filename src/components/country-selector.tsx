import { useCountry } from "@/lib/country-context";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/flag";

export function CountrySelector({ className = "" }: { className?: string }) {
  const { country, countries, setCountryCode } = useCountry();
  const { t } = useTranslation();

  if (!country) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label
        className="group relative flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-foreground/90 transition-all duration-200 hover:border-gold hover:bg-gold/15 hover:shadow-xs cursor-pointer select-none"
        title={t("common.chooseCountry", "Choisir le pays de livraison")}
      >
        <Flag code={country.code} className="h-3.5 w-5 rounded-[2px] object-cover shadow-2xs" />
        <span className="font-semibold text-foreground tracking-tight">{country.name}</span>
        <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
          {country.currency_symbol || "FCFA"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gold/75 transition-transform duration-200 group-hover:text-gold" />

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