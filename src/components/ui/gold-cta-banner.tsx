import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { ArrowRight, Check } from "lucide-react";
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
  const { t } = useTranslation();
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

  const points = isB2B
    ? [
        t("goldCta.fromPacks", "Dès 20 paquets • Conditionnements professionnels sur demande"),
        t("goldCta.point1", "Conditionnements professionnels scellés"),
        t("goldCta.point2", "Qualité et traçabilité des produits"),
        t("goldCta.point3", "Devis sous 24h & expédition palette"),
        t("goldCta.badgeUemoa", "Livraison UEMOA & Abidjan"),
      ]
    : [
        t("goldCta.sandFree", "Sans sable garanti"),
        t("goldCta.badgeNatural", "100% Naturel & Sans additifs"),
        t("goldCta.expressShipping", "Livraison suivie"),
      ];

  const primaryClass =
    "inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3 text-sm text-stone-950 transition-colors duration-300 hover:bg-[#d8b25f]";
  const secondaryClass =
    "inline-flex items-center gap-2.5 rounded-full border border-stone-50/30 px-6 py-3 text-sm text-stone-100 transition-colors duration-300 hover:border-stone-50/70";

  const renderAction = (action: ActionButton, className: string, icon: ReactNode) =>
    action.isExternal ? (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
        {icon}
        {action.label}
      </a>
    ) : (
      <Link to={getLocalizedPath(action.href)} className={className}>
        {action.label}
        {icon}
      </Link>
    );

  return (
    <div className={`overflow-hidden rounded-2xl bg-[#2c1b11] text-stone-100 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
          <h2 className="font-display text-[1.8rem] font-normal leading-[1.12] text-stone-50 sm:text-4xl lg:text-[2.6rem]">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-base">{description}</p>

          {children}

          {(primaryAction || secondaryAction) && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {primaryAction && renderAction(primaryAction, primaryClass, <ArrowRight className="h-4 w-4" />)}
              {secondaryAction &&
                renderAction(
                  secondaryAction,
                  secondaryClass,
                  isWhatsApp(secondaryAction) ? <WhatsAppIcon className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />,
                )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center border-t border-white/10 p-8 sm:p-12 lg:col-span-5 lg:border-l lg:border-t-0">
          {!isB2B && (
            <img
              src={cerealPackImg}
              alt={t("goldCta.imgAlt", "Céréales Nobles Cereals House")}
              loading="lazy"
              className="mb-6 aspect-[4/3] w-full rounded-lg object-cover"
            />
          )}
          {isB2B && (
            <p className="mb-4 font-display text-xl text-gold">{t("goldCta.wholesaleRates", "Tarifs Grossistes")}</p>
          )}
          <ul className="space-y-3 text-sm text-stone-200">
            {points.map((point) => (
              <li key={point} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
