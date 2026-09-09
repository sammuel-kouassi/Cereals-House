import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Baby, User, ShoppingBag, Check, Flame } from "lucide-react";
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
      imageUrl: imageUrl || imageFor(slug),
      prices,
    });

    setAdded(true);
    toast.success(t("product.addedSuccess", "{{name}} ajouté au panier !", { name }));
    setTimeout(() => setAdded(false), 1500);
  };

  // Disposition en liste élégante et compacte (image à gauche, contenu et boutons à droite)
  if (layout === "list") {
    return (
      <Link
        to={getLocalizedPath(`/products/${slug}`)}
        className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold"
      >
        {/* Liseré doré signature */}
        <span className="absolute inset-x-0 top-0 sm:inset-y-0 sm:left-0 sm:right-auto sm:w-1 sm:h-full z-10 h-0.5 origin-left sm:origin-top scale-x-0 sm:scale-x-100 sm:scale-y-0 bg-gradient-to-r sm:bg-gradient-to-b from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100 sm:group-hover:scale-y-100" />

        {/* Zone visuelle avec largeur contrôlée et proportions maîtrisées */}
        <div className="relative w-full sm:w-56 md:w-64 lg:w-72 shrink-0 aspect-[16/10] sm:aspect-square overflow-hidden bg-secondary">
          <img
            src={imageUrl || imageFor(slug)}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Badge Catégorie sur mobile */}
          {category && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur shadow-2xs sm:hidden">
              {category}
            </span>
          )}

          {/* Alerte stock faible */}
          {lowStock && !isOutOfStock && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur">
              <Flame className="h-3 w-3" /> {t("product.lowStock", "Plus que {{count}} en stock", { count: stock })}
            </span>
          )}

          {isOutOfStock && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 text-muted-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
              {t("product.outOfStock", "Rupture temporaire")}
            </span>
          )}
        </div>

        {/* Contenu textuel et actions à droite */}
        <div className="flex flex-1 flex-col justify-between p-5 sm:p-6 gap-4">
          <div>
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {category && (
                <span className="hidden sm:inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {category}
                </span>
              )}
              {isKid && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold shadow-2xs">
                  <Baby className="h-3 w-3" /> {t("audience.kid", "Bébé / Enfant")}
                </span>
              )}
              {isAdult && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-secondary/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-2xs">
                  <User className="h-3 w-3" /> {t("audience.adult", "Adulte")}
                </span>
              )}
            </div>

            <h3 className="font-display text-lg sm:text-xl font-bold text-primary transition-colors duration-200 group-hover:text-gold">
              {name}
            </h3>

            {shortDescription && (
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                {shortDescription}
              </p>
            )}
          </div>

          {/* Footer avec prix et boutons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gold font-display">
                {formatPrice(price, currencySymbol)}
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
                {unit}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={isOutOfStock}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
                  added
                    ? "bg-green-600 text-white"
                    : "bg-gold text-gold-foreground hover:bg-gold/90 hover:scale-102 active:scale-98"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                <span>{added ? t("product.addedToast", "Ajouté !") : t("product.addToCart", "Ajouter au panier")}</span>
              </button>

              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {t("common.details", "Détails →")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Disposition en grille par défaut
  return (
    <Link
      to={getLocalizedPath(`/products/${slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-gold"
    >
      {/* Liseré doré signature */}
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />

      {/* Zone visuelle */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageUrl || imageFor(slug)}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badge Catégorie */}
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur transition-transform duration-300 group-hover:-translate-y-0.5">
            {category}
          </span>
        )}

        {/* Badges Publics */}
        {(isKid || isAdult) && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {isKid && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold shadow-sm backdrop-blur">
                <Baby className="h-3 w-3" /> {t("audience.kid", "Bébé / Enfant")}
              </span>
            )}
            {isAdult && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
                <User className="h-3 w-3" /> {t("audience.adult", "Adulte")}
              </span>
            )}
          </div>
        )}

        {/* Alerte stock faible */}
        {lowStock && !isOutOfStock && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur">
            <Flame className="h-3 w-3" /> {t("product.lowStock", "Plus que {{count}} en stock", { count: stock })}
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 text-muted-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
            {t("product.outOfStock", "Rupture temporaire")}
          </span>
        )}

        {/* Bouton d'ajout rapide au panier express au survol */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isOutOfStock}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 shadow-md ${
            added
              ? "bg-green-600 text-white scale-110 opacity-100"
              : "bg-gold text-gold-foreground opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 hover:bg-gold/90"
          } cursor-pointer`}
          title={added ? t("product.addedToast", "Ajouté !") : t("product.addToCart", "Ajouter au panier")}
        >
          {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
        </button>
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-base sm:text-lg font-semibold text-primary transition-colors duration-200 group-hover:text-gold line-clamp-1">
          {name}
        </h3>
        {shortDescription && (
          <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {shortDescription}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-border/50">
          <div>
            <div className="text-lg sm:text-xl font-bold text-gold font-display">
              {formatPrice(price, currencySymbol)}
            </div>
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
              {unit}
            </div>
          </div>
          <span className="rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-primary transition-all duration-200 group-hover:bg-gold group-hover:text-gold-foreground">
            {t("common.details", "Détails →")}
          </span>
        </div>
      </div>
    </Link>
  );
}