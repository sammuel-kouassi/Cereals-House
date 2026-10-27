import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/format";

type PriceLike = { country_code: string; price: number; compare_at_price?: number | null };

/** Prix (remisé si promotion) et ancien prix pour un pays, avec repli sur la CI. */
export function resolvePrice(prices: PriceLike[] | undefined, countryCode: string, fallback = 0) {
  const row =
    prices?.find((p) => p.country_code === countryCode) ??
    prices?.find((p) => p.country_code === "CI") ??
    prices?.[0];
  const price = Number(row?.price ?? fallback);
  const compareAt = row?.compare_at_price != null ? Number(row.compare_at_price) : null;
  const onSale = compareAt != null && compareAt > price;
  return {
    price,
    compareAt: onSale ? compareAt : null,
    percentOff: onSale ? Math.round((1 - price / compareAt) * 100) : 0,
  };
}

const SIZES = {
  sm: { price: "text-sm", old: "text-xs" },
  md: { price: "font-display text-xl", old: "text-sm" },
  lg: { price: "font-display text-3xl", old: "text-base" },
} as const;

/**
 * Prix de vente, suivi de l'ancien prix barré et de la remise quand une
 * promotion est en cours. Le lecteur d'écran annonce « ancien prix ».
 */
export function PriceTag({
  price,
  compareAt,
  currencySymbol,
  size = "md",
  showPercent = true,
  className = "",
}: {
  price: number;
  compareAt?: number | null;
  currencySymbol: string;
  size?: keyof typeof SIZES;
  showPercent?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const s = SIZES[size];
  const onSale = compareAt != null && compareAt > price;
  const percent = onSale ? Math.round((1 - price / compareAt) * 100) : 0;

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums ${className}`}
    >
      <span
        className={`${s.price} ${onSale ? "text-amber-800 dark:text-gold" : "text-stone-950 dark:text-stone-50"}`}
      >
        {formatPrice(price, currencySymbol)}
      </span>
      {onSale && (
        <>
          <s className={`${s.old} text-stone-500 decoration-stone-400 decoration-1`}>
            <span className="sr-only">{t("promo.oldPrice", "Ancien prix")} </span>
            {formatPrice(compareAt, currencySymbol)}
          </s>
          {showPercent && (
            <span className={`${s.old} italic text-amber-800 dark:text-gold`}>−{percent} %</span>
          )}
        </>
      )}
    </span>
  );
}

/** Pastille discrète posée sur l'image produit. */
export function SaleBadge({ percentOff, label }: { percentOff: number; label?: string | null }) {
  if (percentOff <= 0) return null;
  return (
    <span className="pointer-events-none absolute left-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full bg-[#2c1b11]/90 px-2.5 py-1 text-xs text-stone-50 backdrop-blur-sm dark:bg-gold dark:text-stone-950">
      <span className="tabular-nums">−{percentOff} %</span>
      {label && <span className="italic opacity-80">{label}</span>}
    </span>
  );
}
