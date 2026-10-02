import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { useCountry } from "@/lib/country-context";
import { listProductsFn } from "@/lib/products/products.functions";
import { imageFor } from "@/lib/products-meta";
import { formatPrice } from "@/lib/format";

export function DynamicHowItWorks() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const { country } = useCountry();
  const [isPaused, setIsPaused] = useState(false);

  // Récupération dynamique de tous les produits enregistrés en base de données
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => listProductsFn(),
  });

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  // Duplication fluide pour l'effet de boucle infinie sans saut
  let displayList = dbProducts;
  if (displayList.length > 0 && displayList.length < 6) {
    while (displayList.length < 6) {
      displayList = [...displayList, ...dbProducts];
    }
  }
  const marqueeItems = displayList.length > 0 ? [...displayList, ...displayList] : [];

  return (
    <section className="relative border-y border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/40 py-10 sm:py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête sobre et épuré */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900 dark:text-amber-300 mb-2">
                <Sparkles className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                <span>{t("howItWorks.badge", "Sélection Meunerie • Zéro grain de sable garanti")}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {t("howItWorks.title", "Sélectionnez vos céréales de terroirs")}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-xl">
                {t(
                  "howItWorks.desc",
                  "Chaque variété est récoltée à maturité, méticuleusement triée, lavée à l'eau claire et précuite à la vapeur. Prêtes pour vos préparations en 3 minutes.",
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={getLocalizedPath("/products")}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-gold hover:text-amber-950 dark:hover:text-amber-300 transition-colors group"
              >
                <span>{t("howItWorks.seeShop", "Voir toute la boutique")}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Plateau Principal : Ruban de céréales compact à défilement horizontal très doux */}
        <div
          className="relative rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-white dark:bg-[#1A1410] p-4 sm:p-5 shadow-xs overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dégradés d'estompage latéraux doux */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-16 z-10 bg-gradient-to-r from-white dark:from-[#1A1410] via-white/80 dark:via-[#1A1410]/80 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-16 z-10 bg-gradient-to-l from-white dark:from-[#1A1410] via-white/80 dark:via-[#1A1410]/80 to-transparent" />

          {/* Indication visuelle discrète */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 mb-3 px-1">
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-500 dark:text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("howItWorks.marqueeHint", "Défilement continu doux • Survolez un paquet pour le figer")}
            </span>
            <span className="hidden sm:inline text-stone-400 dark:text-stone-500">
              {isLoading
                ? t("howItWorks.loading", "Chargement...")
                : dbProducts.length > 1
                ? t("howItWorks.availableCount", "{{count}} variétés artisanales disponibles", { count: dbProducts.length })
                : t("howItWorks.availableCountSingle", "1 variété artisanale disponible")}
            </span>
          </div>

          {/* Ruban animé en continu avec vitesse douce */}
          <div className="relative w-full overflow-hidden py-1">
            {isLoading && marqueeItems.length === 0 ? (
              <div className="flex gap-2.5 sm:gap-3 py-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-40 sm:w-46 md:w-50 shrink-0 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 p-2.5 animate-pulse space-y-2"
                  >
                    <div className="h-24 sm:h-28 rounded-lg bg-stone-200 dark:bg-stone-800" />
                    <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
                    <div className="h-2.5 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="animate-cereal-marquee flex gap-2.5 sm:gap-3"
                style={{
                  animationDuration: "75s",
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              >
                {marqueeItems.map((p, idx) => {
                  const priceObj = p.product_prices?.find((pr) => pr.country_code === currentCountryCode);
                  const basePrice = p.product_prices?.find((pr) => pr.country_code === "CI")?.price ?? p.product_prices?.[0]?.price ?? 0;
                  const price = priceObj?.price ?? basePrice;
                  const formattedPrice = formatPrice(price, currencySymbol);

                  const badge = p.is_featured
                    ? t("howItWorks.selectionTag", "Sélection")
                    : typeof p.stock === "number" && p.stock > 0 && p.stock <= 10
                    ? t("howItWorks.limitedStockTag", "Stock limité")
                    : p.category || t("howItWorks.allNaturalTag", "100% Naturel");

                  const subtitle =
                    p.short_description ||
                    (p.unit
                      ? t("howItWorks.packedIn", "Conditionné en {{unit}}", { unit: p.unit })
                      : t("howItWorks.terroirSelection", "Sélection terroir"));
                  const tag = p.category || t("howItWorks.pureCereal", "Céréale pure");
                  const image = imageFor(p.slug, p.image_url);

                  return (
                    <Link
                      key={`${p.id}-${idx}`}
                      to={getLocalizedPath(`/products/${p.slug}`)}
                      className="group block w-40 sm:w-46 md:w-50 shrink-0 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 p-2.5 hover:border-amber-400 dark:hover:border-gold hover:bg-white dark:hover:bg-stone-900 hover:shadow-md transition-all duration-300"
                    >
                      <div className="h-24 sm:h-28 rounded-lg overflow-hidden mb-2 bg-stone-200 dark:bg-stone-800 relative">
                        <img
                          src={image}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-stone-950/80 text-white backdrop-blur-xs">
                          {badge}
                        </span>
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                          {formattedPrice}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-xs sm:text-[13px] text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-gold transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {subtitle}
                        </p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between text-[11px] text-amber-800 dark:text-gold font-semibold">
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate max-w-[70px]">
                          {tag}
                        </span>
                        <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                          {t("product.addToCart", "Commander")}
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bandeau de réassurance sobre et aéré au bas */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{t("howItWorks.guarantee1Title", "Zéro sable garanti")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>{t("howItWorks.guarantee2Title", "Meule de pierre & Cuisson douce")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{t("howItWorks.guarantee3Title", "Livraison express suivie")}</span>
              </div>
            </div>

            <Link
              to={getLocalizedPath("/products")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-stone-950 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] shrink-0"
            >
              <span>{t("howItWorks.seeShop", "Accéder à la boutique")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
