import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { imageFor } from "@/lib/products-meta";
import { formatPrice } from "@/lib/format";
import { useCountry } from "@/lib/country-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { useLanguageNavigation } from "@/lib/i18n-routing";

const LOW_STOCK_THRESHOLD = 15;

type Props = {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string | null;
  unit: string;
  prices: { country_code: string; price: number }[];
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
  const priceObj = prices.find((p) => p.country_code === currentCountryCode);
  const basePriceXof = prices.find((p) => p.country_code === "CI")?.price ?? prices[0]?.price ?? 0;
  const price = priceObj?.price ?? basePriceXof;

  const isKid = audiences?.includes("enfant");
  const isAdult = audiences?.includes("adulte");
  const lowStock = typeof stock === "number" && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = typeof stock === "number" && stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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
    toast.success(t("product.addedSuccess", "{{name}} ajouté au panier !", { name }));
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
      className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        added
          ? "bg-emerald-700 text-white"
          : "bg-[#2c1b11] text-stone-50 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
      } ${extra}`}
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  );

  // Disposition en liste : image à gauche, contenu à droite
  if (layout === "list") {
    return (
      <Link
        to={getLocalizedPath(`/products/${slug}`)}
        className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-card transition-colors duration-300 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600 sm:flex-row"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-900 sm:aspect-square sm:w-48 md:w-56">
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
            <h3 className="mt-1 font-display text-lg text-stone-950 dark:text-stone-50">{name}</h3>
            {shortDescription && (
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {shortDescription}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
            <div>
              <span className="font-display text-xl text-stone-950 dark:text-stone-50">
                {formatPrice(price, currencySymbol)}
              </span>
              <span className="ml-1.5 text-xs text-stone-500">/ {unit}</span>
              {stockNote && <div>{stockNote}</div>}
            </div>
            {addButton("")}
          </div>
        </div>
      </Link>
    );
  }

  // Disposition en grille (par défaut)
  return (
    <Link
      to={getLocalizedPath(`/products/${slug}`)}
      className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-card transition-colors duration-300 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
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
          <h3 className="mt-1 line-clamp-1 font-display text-lg text-stone-950 dark:text-stone-50">{name}</h3>
          {shortDescription && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {shortDescription}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
          <div className="min-w-0">
            <span className="font-display text-xl text-stone-950 dark:text-stone-50">
              {formatPrice(price, currencySymbol)}
            </span>
            <span className="ml-1.5 text-xs text-stone-500">/ {unit}</span>
            {stockNote && <div>{stockNote}</div>}
          </div>
          {addButton("")}
        </div>
      </div>
    </Link>
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
