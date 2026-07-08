import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage === "en" ? "en" : "fr";
  const next = current === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      aria-label={next === "en" ? "Switch to English" : "Passer en français"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/80 transition hover:border-gold/50 hover:text-gold ${className}`}
    >
      <Languages className="h-3.5 w-3.5 text-gold" />
      <span className={current === "fr" ? "text-gold" : ""}>FR</span>
      <span className="text-muted-foreground">/</span>
      <span className={current === "en" ? "text-gold" : ""}>EN</span>
    </button>
  );
}