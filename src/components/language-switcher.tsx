import { Languages } from "lucide-react";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { currentLang, switchLanguage } = useLanguageNavigation();
  const next = currentLang === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => switchLanguage(next)}
      aria-label={next === "en" ? "Switch to English" : "Passer en français"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/80 transition hover:border-gold/50 hover:text-gold cursor-pointer ${className}`}
    >
      <Languages className="h-3.5 w-3.5 text-gold" />
      <span className={currentLang === "fr" ? "text-gold font-bold" : ""}>FR</span>
      <span className="text-muted-foreground">/</span>
      <span className={currentLang === "en" ? "text-gold font-bold" : ""}>EN</span>
    </button>
  );
}