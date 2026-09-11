import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useLanguageNavigation } from "@/lib/i18n-routing";

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
}

export function GoldCtaBanner({
  title,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  className = "",
  children,
}: GoldCtaBannerProps) {
  const { getLocalizedPath } = useLanguageNavigation();

  return (
    <div
      className={`relative overflow-hidden rounded-[2.2rem] sm:rounded-[2.5rem] border border-amber-300/40 bg-gradient-to-r from-[#B8860B] via-[#C99719] to-[#E5B842] p-8 sm:p-12 lg:p-14 text-white shadow-[0_24px_55px_rgba(184,134,11,0.35)] ${className}`}
    >
      {/* ============================================================ */}
      {/* ONDES CONCENTRIQUES NETTES & LUMINEUSES (RÉFÉRENCE EXACTE FIDABIO) */}
      {/* ============================================================ */}
      <div
        className="pointer-events-none absolute -right-28 sm:-right-24 md:-right-16 top-1/2 -translate-y-1/2 h-[420px] w-[420px] sm:h-[540px] sm:w-[540px] lg:h-[680px] lg:w-[680px] select-none"
        aria-hidden="true"
      >
        {/* Bande 1 (la plus large) */}
        <div className="absolute inset-0 rounded-full bg-white/[0.08]" />

        {/* Bande 2 */}
        <div className="absolute inset-[10%] rounded-full bg-white/[0.13]" />

        {/* Bande 3 */}
        <div className="absolute inset-[20%] rounded-full bg-white/[0.20]" />

        {/* Bande 4 */}
        <div className="absolute inset-[30%] rounded-full bg-white/[0.28]" />

        {/* Bande 5 */}
        <div className="absolute inset-[40%] rounded-full bg-white/[0.38]" />

        {/* Bande 6 */}
        <div className="absolute inset-[50%] rounded-full bg-white/[0.52] shadow-[0_0_40px_rgba(255,255,255,0.4)]" />

        {/* Cœur radial intense */}
        <div className="absolute inset-[60%] rounded-full bg-gradient-to-l from-white via-white/90 to-white/60 shadow-[0_0_80px_rgba(255,255,255,0.8)]" />
      </div>

      {/* ============================================================ */}
      {/* CONTENU TEXTUEL & BOUTONS SIGNATURES SUR LA GAUCHE          */}
      {/* ============================================================ */}
      <div className="relative z-10 max-w-xl lg:max-w-2xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-black/20 backdrop-blur-sm px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-xs mb-4">
            {eyebrow}
          </div>
        )}

        <h3 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12] drop-shadow-sm">
          {title}
        </h3>

        <p className="mt-4 text-xs sm:text-sm lg:text-base text-white/95 font-medium leading-relaxed max-w-lg drop-shadow-xs">
          {description}
        </p>

        {children}

        {/* Boutons Pilules Noirs Signatures Fidabio avec Bille Sphérique 3D */}
        {(primaryAction || secondaryAction) && (
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3.5 sm:gap-4">
            {primaryAction && (
              primaryAction.isExternal ? (
                <a
                  href={primaryAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-between gap-3.5 rounded-full bg-[#120F0D] px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{primaryAction.label}</span>
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white via-stone-200 to-stone-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  </span>
                </a>
              ) : (
                <Link
                  to={getLocalizedPath(primaryAction.href)}
                  className="group inline-flex items-center justify-between gap-3.5 rounded-full bg-[#120F0D] px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>{primaryAction.label}</span>
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white via-stone-200 to-stone-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  </span>
                </Link>
              )
            )}

            {secondaryAction && (
              secondaryAction.isExternal ? (
                <a
                  href={secondaryAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-between gap-3.5 rounded-full bg-[#120F0D]/90 backdrop-blur-sm px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                >
                  <span>{secondaryAction.label}</span>
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white via-stone-200 to-stone-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  </span>
                </a>
              ) : (
                <Link
                  to={getLocalizedPath(secondaryAction.href)}
                  className="group inline-flex items-center justify-between gap-3.5 rounded-full bg-[#120F0D]/90 backdrop-blur-sm px-6 sm:px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                >
                  <span>{secondaryAction.label}</span>
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white via-stone-200 to-stone-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                  </span>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
