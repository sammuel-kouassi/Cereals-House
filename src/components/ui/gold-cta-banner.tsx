import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import {
  ArrowRight,
  Briefcase,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Percent,
  Star,
  PackageCheck,
} from "lucide-react";
import cerealPackImg from "@/assets/hero_cereales_mixtes_pack.jpg";

interface ActionButton {
  label: string;
  href: string;
  isExternal?: boolean;
  variant?: "primary" | "secondary";
}

interface GoldCtaBannerProps {
  title: string;
  description: string;
  eyebrow?: string;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
  className?: string;
  children?: ReactNode;
  variant?: "b2b" | "discovery" | "auto";
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.979-.953 1.18-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.424-1.497-.897-.799-1.502-1.787-1.678-2.088-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.678-1.635-.928-2.239-.244-.588-.492-.508-.678-.518-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.23 3.111c.15.201 2.124 3.243 5.145 4.549.719.311 1.28.497 1.718.636.722.23 1.378.197 1.898.12.579-.086 1.78-.727 2.03-1.429.251-.702.251-1.304.176-1.43-.075-.125-.276-.201-.577-.351z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.174L2 22l4.981-1.405A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.167 8.167 0 01-4.228-1.176l-.303-.18-2.964.836.84-2.89-.197-.313A8.167 8.167 0 1112 20.2z"
      />
    </svg>
  );
}

export function GoldCtaBanner({
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  className = "",
  children,
  variant = "auto",
}: GoldCtaBannerProps) {
  const { getLocalizedPath } = useLanguageNavigation();

  // Détection automatique du type de bloc si variant === "auto"
  const isB2B =
    variant === "b2b" ||
    (variant === "auto" &&
      (eyebrow?.toLowerCase().includes("pro") ||
        eyebrow?.toLowerCase().includes("crèche") ||
        eyebrow?.toLowerCase().includes("distributeur") ||
        title.toLowerCase().includes("gros") ||
        title.toLowerCase().includes("25kg") ||
        title.toLowerCase().includes("b2b")));

  const isWhatsApp = (action?: ActionButton) =>
    action?.href.includes("wa.me") ||
    action?.href.includes("whatsapp") ||
    action?.label.toLowerCase().includes("whatsapp");

  return (
    <div
      className={`group relative overflow-hidden rounded-[2.25rem] sm:rounded-[2.75rem] border border-amber-900/15 dark:border-gold/30 border-animated-fine bg-gradient-to-br from-[#FCF9F4] via-[#F8F2E8] to-[#EFE4D2] dark:from-[#1A1410] dark:via-[#16100C] dark:to-[#100C09] py-9 sm:py-12 px-7 sm:px-10 lg:px-12 text-foreground shadow-lg transition-all duration-500 hover:shadow-2xl ${className}`}
    >
      {/* ─── HALOS LUMINEUX D'AMBIANCE CHAUDE ─── */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gold/15 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-amber-700/10 blur-3xl opacity-50" />

      {/* ─── GRILLE EN 2 COLONNES (Contenu à gauche, Visual Stack animé à droite) ─── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Colonne Gauche : Textes & Boutons (7 cols sur desktop) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-gold shadow-2xs mb-4">
              {isB2B ? (
                <Briefcase className="h-3.5 w-3.5 text-gold shrink-0" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
              )}
              <span>{eyebrow}</span>
            </div>
          )}

          <h3 className="font-display text-2xl sm:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-[1.15]">
            {title}
          </h3>

          <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-stone-600 dark:text-stone-300 font-normal leading-relaxed max-w-xl">
            {description}
          </p>

          {children}

          {/* Boutons Haute Finition Dynamiques */}
          {(primaryAction || secondaryAction) && (
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              {/* Bouton Primaire Haut de Gamme */}
              {primaryAction &&
                (primaryAction.isExternal ? (
                  <a
                    href={primaryAction.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/btn inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-[#1C140E] dark:bg-gold text-white dark:text-stone-950 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-black dark:hover:bg-amber-400 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="tracking-tight font-bold">{primaryAction.label}</span>
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white/15 dark:bg-black/15 text-gold dark:text-stone-950 transition-transform duration-300 group-hover/btn:translate-x-1 shadow-2xs">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </a>
                ) : (
                  <Link
                    to={getLocalizedPath(primaryAction.href)}
                    className="group/btn inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-[#1C140E] dark:bg-gold text-white dark:text-stone-950 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-black dark:hover:bg-amber-400 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="tracking-tight font-bold">{primaryAction.label}</span>
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white/15 dark:bg-black/15 text-gold dark:text-stone-950 transition-transform duration-300 group-hover/btn:translate-x-1 shadow-2xs">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}

              {/* Bouton Secondaire Soigné */}
              {secondaryAction &&
                (() => {
                  const whatsapp = isWhatsApp(secondaryAction);

                  const buttonClass = whatsapp
                    ? "group/sec inline-flex items-center justify-between gap-2.5 sm:gap-3 rounded-full border border-emerald-600/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold shadow-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    : "group/sec inline-flex items-center justify-between gap-2.5 sm:gap-3 rounded-full border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold shadow-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer";

                  const iconContainer = whatsapp ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 transition-transform duration-300 group-hover/sec:scale-110">
                      <WhatsAppIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 transition-transform duration-300 group-hover/sec:translate-x-0.5">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  );

                  return secondaryAction.isExternal ? (
                    <a
                      href={secondaryAction.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass}
                    >
                      <span className="tracking-tight">{secondaryAction.label}</span>
                      {iconContainer}
                    </a>
                  ) : (
                    <Link to={getLocalizedPath(secondaryAction.href)} className={buttonClass}>
                      <span className="tracking-tight">{secondaryAction.label}</span>
                      {iconContainer}
                    </Link>
                  );
                })()}
            </div>
          )}
        </div>

        {/* Colonne Droite : Composition Visuelle Stylée & Flottante (5 cols sur desktop) */}
        <div className="lg:col-span-5 relative w-full flex items-center justify-center pt-5 lg:pt-0">
          {isB2B ? (
            /* ─── VISUEL VARIANT B2B / GROSSISTE ─── */
            <div className="relative w-full max-w-sm my-2">
              {/* Carte Principale Glassmorphique */}
              <div className="relative rounded-2xl border border-gold/30 bg-white/80 dark:bg-[#1A1410]/90 backdrop-blur-md p-5 sm:p-6 shadow-xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      Disponibilité Immédiate
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gold px-2 py-0.5 rounded-full bg-gold/15">
                    Pro & Vrac
                  </span>
                </div>

                <div className="my-4 space-y-1">
                  <div className="text-xl sm:text-2xl font-display font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                    <span>Tarifs Grossistes</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-gold">
                      Sur mesure
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Dès 20 paquets ou en sacs de 25kg & 50kg
                  </p>
                </div>

                {/* 3 Points forts avec checkmarks */}
                <div className="space-y-2 pt-2 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Conditionnements professionnels scellés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Certificats sanitaires & traçabilité</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Devis sous 24h & expédition palette</span>
                  </div>
                </div>
              </div>

              {/* Badge Flottant 1 (Haut Droite) */}
              <div className="animate-float-slow absolute -top-3 -right-2 sm:-right-3 rounded-xl border border-gold/40 bg-white/95 dark:bg-[#1E1712]/95 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-100">
                <Truck className="h-4 w-4 text-gold shrink-0" />
                <span>Livraison UEMOA & Abidjan</span>
              </div>

              {/* Badge Flottant 2 (Bas Gauche) */}
              <div className="animate-float-delayed absolute -bottom-3 -left-2 sm:-left-3 rounded-xl border border-emerald-500/40 bg-white/95 dark:bg-[#121A15]/95 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <WhatsAppIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Devis rapide via WhatsApp</span>
              </div>
            </div>
          ) : (
            /* ─── VISUEL VARIANT DÉCOUVERTE / BOUTIQUE / TERROIR ─── */
            <div className="relative w-full max-w-sm my-2">
              {/* Carte Principale avec image de céréales nobles */}
              <div className="relative overflow-hidden rounded-2xl border border-gold/35 bg-white/80 dark:bg-[#1A1410]/90 backdrop-blur-md p-3 sm:p-4 shadow-xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="relative h-44 sm:h-48 w-full overflow-hidden rounded-xl">
                  <img
                    src={cerealPackImg}
                    alt="Céréales Nobles Cereals House"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Badge en overlay sur l'image */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      <div className="flex items-center gap-1 text-gold text-xs">
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold" />
                        <span className="ml-1 text-[11px] font-bold text-white">4.9 / 5</span>
                      </div>
                      <p className="text-[10px] text-stone-300 font-light mt-0.5">
                        +1 200 familles et cuisiniers conquis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 px-1 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                    Sans sable garanti
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <PackageCheck className="h-3.5 w-3.5 text-gold" />
                    Livraison 24-48h
                  </span>
                </div>
              </div>

              {/* Badge Flottant 1 (Haut Droite) */}
              <div className="animate-float-slow absolute -top-3 -right-2 sm:-right-3 rounded-xl border border-gold/40 bg-white/95 dark:bg-[#1E1712]/95 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-100">
                <Sparkles className="h-4 w-4 text-gold shrink-0" />
                <span>100% Naturel & Meule</span>
              </div>

              {/* Badge Flottant 2 (Bas Gauche) */}
              <div className="animate-float-delayed absolute -bottom-3 -left-2 sm:-left-3 rounded-xl border border-amber-600/40 bg-white/95 dark:bg-[#1C140E]/95 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-gold">
                <Truck className="h-4 w-4 text-amber-600 dark:text-gold shrink-0" />
                <span>Expédition suivie en direct</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
