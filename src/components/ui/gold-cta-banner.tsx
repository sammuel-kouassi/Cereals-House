import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { ArrowRight, Briefcase } from "lucide-react";

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
}: GoldCtaBannerProps) {
  const { getLocalizedPath } = useLanguageNavigation();

  const isWhatsApp = (action?: ActionButton) =>
    action?.href.includes("wa.me") ||
    action?.href.includes("whatsapp") ||
    action?.label.toLowerCase().includes("whatsapp");

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-gold/35 border-animated-fine bg-card/40 backdrop-blur-md p-7 sm:p-11 lg:p-14 text-foreground shadow-sm ${className}`}
    >
      {/* ============================================================ */}
      {/* MOTIFS SOLAIRES ÉLÉGANTS & ONDULATIONS OR FINES              */}
      {/* ============================================================ */}
      <div
        className="pointer-events-none absolute -right-24 sm:-right-16 md:right-0 top-1/2 -translate-y-1/2 h-[420px] w-[420px] sm:h-[560px] sm:w-[560px] lg:h-[680px] lg:w-[680px] select-none"
        aria-hidden="true"
      >
        {/* Halo doux central */}
        <div className="absolute inset-[25%] rounded-full bg-gold/10 blur-3xl" />

        {/* Cercles fins concentriques gravés */}
        <div className="absolute inset-0 rounded-full border border-gold/[0.08]" />
        <div className="absolute inset-[10%] rounded-full border border-gold/[0.10] bg-gold/[0.01]" />
        <div className="absolute inset-[20%] rounded-full border border-gold/[0.12] bg-gold/[0.02]" />
        <div className="absolute inset-[30%] rounded-full border border-gold/[0.15] bg-gold/[0.03]" />
        <div className="absolute inset-[40%] rounded-full border border-gold/[0.18] bg-gold/[0.04]" />
        <div className="absolute inset-[50%] rounded-full border border-gold/[0.22] bg-gold/[0.06] shadow-[0_0_40px_rgba(217,119,6,0.08)]" />
        <div className="absolute inset-[62%] rounded-full bg-gradient-to-l from-gold/30 via-gold/15 to-transparent shadow-[0_0_60px_rgba(217,119,6,0.15)]" />
      </div>

      {/* ============================================================ */}
      {/* CONTENU TEXTUEL & BOUTONS TRANSPARENTS ÉLÉGANTS              */}
      {/* ============================================================ */}
      <div className="relative z-10 max-w-xl lg:max-w-2xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-transparent px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold shadow-xs mb-4">
            <Briefcase className="h-3.5 w-3.5 text-gold" />
            <span>{eyebrow}</span>
          </div>
        )}

        <h3 className="font-display text-2xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-primary leading-[1.14]">
          {title}
        </h3>

        <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-muted-foreground font-normal leading-relaxed max-w-lg">
          {description}
        </p>

        {children}

        {/* Boutons Haute Finition Transparents */}
        {(primaryAction || secondaryAction) && (
          <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Bouton Primaire : Transparent avec contour fin et flèche dorée */}
            {primaryAction &&
              (primaryAction.isExternal ? (
                <a
                  href={primaryAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-transparent hover:bg-gold/10 border-2 border-primary/30 hover:border-gold px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer backdrop-blur-xs"
                >
                  <span className="tracking-tight font-bold">{primaryAction.label}</span>
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-gold-foreground group-hover:translate-x-0.5 shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              ) : (
                <Link
                  to={getLocalizedPath(primaryAction.href)}
                  className="group inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-transparent hover:bg-gold/10 border-2 border-primary/30 hover:border-gold px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer backdrop-blur-xs"
                >
                  <span className="tracking-tight font-bold">{primaryAction.label}</span>
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold transition-all duration-300 group-hover:bg-gold group-hover:text-gold-foreground group-hover:translate-x-0.5 shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}

            {/* Bouton Secondaire : Transparent avec contour vert WhatsApp */}
            {secondaryAction &&
              (() => {
                const whatsapp = isWhatsApp(secondaryAction);

                const buttonClass = whatsapp
                  ? "group inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-transparent hover:bg-emerald-500/10 border-2 border-emerald-600/35 hover:border-emerald-600 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-emerald-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer backdrop-blur-xs"
                  : "group inline-flex items-center justify-between gap-3 sm:gap-3.5 rounded-full bg-transparent hover:bg-secondary/40 border-2 border-border/80 hover:border-primary/40 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer backdrop-blur-xs";

                const iconContainer = whatsapp ? (
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white shadow-xs">
                    <WhatsAppIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                ) : (
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 shadow-xs">
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
    </div>
  );
}
