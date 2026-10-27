import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { imageFor } from "@/lib/products-meta";
import { PriceTag, SaleBadge, resolvePrice } from "@/components/price-tag";
import { useCountry } from "@/lib/country-context";
import { useCart } from "@/lib/cart-context";
import { useLanguageNavigation } from "@/lib/i18n-routing";

const LOW_STOCK_THRESHOLD = 15;

type Props = {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string | null;
  unit: string;
  prices: { country_code: string; price: number; compare_at_price?: number | null }[];
  /** Libellé de la promotion en cours (ex. « Offre de saison ») */
  promotionLabel?: string | null;
  audiences?: string[] | null;
  imageUrl?: string | null;
  stock?: number;
  layout?: "grid" | "list";
};

export function ProductCard({
  slug,
  name,
  shortDescription,
  category,
  unit,
  prices,
  promotionLabel,
  audiences,
  imageUrl,
  stock,
  layout = "grid",
}: Props) {
  const { country } = useCountry();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";
  const { price, compareAt, percentOff } = resolvePrice(prices, currentCountryCode);

  const isKid = audiences?.includes("enfant");
  const isAdult = audiences?.includes("adulte");
  const lowStock = typeof stock === "number" && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart({
      slug,
      name,
      unit,
      imageUrl: imageFor(slug, imageUrl),
      prices,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const audienceLabel = [
    isKid ? t("audience.kid", "Bébé / Enfant") : null,
    isAdult ? t("audience.adult", "Adulte") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const metaLine = [category, audienceLabel].filter(Boolean).join(" — ");

  const stockNote = isOutOfStock ? (
    <span className="text-xs italic text-stone-500">{t("product.outOfStock", "Rupture")}</span>
  ) : lowStock ? (
    <span className="text-xs italic text-amber-800 dark:text-gold">
      {t("product.lowStock", "Plus que {{count}}", { count: stock })}
    </span>
  ) : null;

  const addButton = (extra: string) => (
    <button
      type="button"
      onClick={handleQuickAdd}
      disabled={isOutOfStock}
      aria-label={added ? t("product.addedToast", "Ajouté !") : t("product.addToCart", "Ajouter au panier")}
      title={added ? t("product.addedToast", "Ajouté !") : t("product.addToCart", "Ajouter au panier")}
      className={`relative z-10 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        added
          ? "bg-amber-800 text-stone-50 dark:bg-gold dark:text-stone-950"
          : "bg-[#2c1b11] text-stone-50 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
      } ${extra}`}
    >
      {added ? (
        <Check className="h-4 w-4 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200" />
      ) : (
        <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );

  // Disposition en liste : image à gauche, contenu à droite
  if (layout === "list") {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-card transition-colors duration-300 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600 sm:flex-row">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-900 sm:aspect-square sm:w-48 md:w-56">
          <SaleBadge percentOff={percentOff} label={promotionLabel} />
          <img
            src={imageFor(slug, imageUrl)}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div>
            {metaLine && <p className="text-xs italic text-stone-500">{metaLine}</p>}
            <h3 className="mt-1 font-display text-lg text-stone-950 dark:text-stone-50">
              <Link to={getLocalizedPath(`/products/${slug}`)} className="after:absolute after:inset-0 after:content-['']">
                {name}
              </Link>
            </h3>
            {shortDescription && (
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {shortDescription}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
            <div>
              <PriceTag price={price} compareAt={compareAt} currencySymbol={currencySymbol} showPercent={false} />
              <span className="ml-1.5 text-xs text-stone-500">/ {unit}</span>
              {stockNote && <div>{stockNote}</div>}
            </div>
            {addButton("")}
          </div>
        </div>
      </div>
    );
  }

  // Disposition en grille (par défaut)
  return (
    <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-card transition-colors duration-300 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
        <SaleBadge percentOff={percentOff} label={promotionLabel} />
        <img
          src={imageFor(slug, imageUrl)}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <div>
          {metaLine && <p className="line-clamp-1 text-xs italic text-stone-500">{metaLine}</p>}
          <h3 className="mt-1 line-clamp-1 font-display text-lg text-stone-950 dark:text-stone-50">
            <Link to={getLocalizedPath(`/products/${slug}`)} className="after:absolute after:inset-0 after:content-['']">
              {name}
            </Link>
          </h3>
          {shortDescription && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {shortDescription}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="min-w-0">
            <PriceTag price={price} compareAt={compareAt} currencySymbol={currencySymbol} showPercent={false} />
              <span className="ml-1.5 text-xs text-stone-500">/ {unit}</span>
            {stockNote && <div>{stockNote}</div>}
          </div>
          {addButton("")}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex animate-pulse flex-col items-center gap-4 rounded-xl border border-stone-200 p-4 dark:border-stone-800 sm:flex-row">
        <div className="h-28 w-full shrink-0 rounded-lg bg-stone-200/80 dark:bg-stone-800 sm:w-44" />
        <div className="w-full flex-1 space-y-2.5">
          <div className="h-3.5 w-3/4 rounded bg-stone-200/80 dark:bg-stone-800" />
          <div className="h-2.5 w-1/2 rounded bg-stone-200/70 dark:bg-stone-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
      <div className="aspect-[4/3] w-full bg-stone-200/80 dark:bg-stone-800" />
      <div className="space-y-2.5 p-5">
        <div className="h-3.5 w-3/4 rounded bg-stone-200/80 dark:bg-stone-800" />
        <div className="h-2.5 w-1/2 rounded bg-stone-200/70 dark:bg-stone-800" />
      </div>
    </div>
  );
}
