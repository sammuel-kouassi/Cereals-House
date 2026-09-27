import { useCountry } from "@/lib/country-context";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/flag";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function CountrySelector() {
  const { country } = useCountry();
  const { t } = useTranslation();
  if (!country) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1.5 text-xs font-semibold text-foreground/90 shadow-2xs select-none"
      title={t("common.country", "Côte d'Ivoire (FCFA)")}
    >
      <Flag code="CI" className="h-3.5 w-5 rounded-[2px] object-cover" />
      <span>Côte d'Ivoire</span>
      <span className="rounded-full bg-gold/20 px-1.5 py-0.2 text-[10px] font-bold text-gold">FCFA</span>
    </div>
  );
}