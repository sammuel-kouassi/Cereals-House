import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Baby,
  User,
  Users,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ProductSearchBar } from "@/components/product-search-bar";
import { useCountry } from "@/lib/country-context";
import { Flag } from "@/components/flag";
import { Reveal } from "@/components/reveal";
import { useLanguageNavigation } from "@/lib/i18n-routing";

type AudienceFilter = "all" | "enfant" | "adulte";
type SortOption = "name" | "price-asc" | "price-desc" | "stock";

export function ProductsPage() {
  const { t } = useTranslation();
  const { country } = useCountry();
  const { getLocalizedPath } = useLanguageNavigation();
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: () => listProductsFn(),
  });

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());

  let filtered = products.filter((p) => {
    const audOk = audience === "all" || (p.audiences ?? []).includes(audience);
    const searchOk =
      !q ||
      normalize(p.name).includes(q) ||
      normalize(p.short_description ?? "").includes(q) ||
      normalize(p.category ?? "").includes(q);
    return audOk && searchOk;
  });

  // Tri
  filtered = [...filtered].sort((a, b) => {
    const priceA = a.product_prices.find((p) => p.country_code === currentCountryCode)?.price ?? 0;
    const priceB = b.product_prices.find((p) => p.country_code === currentCountryCode)?.price ?? 0;

    if (sortBy === "price-asc") return priceA - priceB;
    if (sortBy === "price-desc") return priceB - priceA;
    if (sortBy === "stock") return (b.stock ?? 0) - (a.stock ?? 0);
    return a.name.localeCompare(b.name);
  });

  const suggestions = Array.from(
    new Map(
      [
        ...products.map((p) => ({ label: p.name, type: "product" as const })),
        ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).map(
          (c) => ({ label: c, type: "category" as const }),
        ),
      ].map((item) => [item.label, item]),
    ).values(),
  );

  const audienceChips: { key: AudienceFilter; label: string; icon: typeof Users }[] = [
    { key: "all", label: t("products.audienceAll", "Tous publics"), icon: Users },
    { key: "enfant", label: t("products.babyAndKid", "Bébé & Enfant"), icon: Baby },
    { key: "adulte", label: t("products.adultAndFamily", "Adulte & Famille"), icon: User },
  ];

  const hasActiveFilters = audience !== "all" || query.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête de page éditorial */}
      <header className="grid gap-6 border-b border-stone-200 pb-8 pt-4 dark:border-stone-800 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <p className="text-sm italic text-amber-800 dark:text-gold">
            {t("products.catalogBadge", "Catalogue officiel · Céréales d'Afrique")}
          </p>
          <h1 className="mt-3 font-display text-[2.2rem] font-normal leading-[1.08] tracking-[-0.015em] text-stone-950 dark:text-stone-50 sm:text-5xl">
            {t("products.titlePart1", "Farines & céréales")}{" "}
            <em className="text-amber-800 dark:text-gold">{t("products.titlePart2", "d'exception")}</em>
          </h1>
        </div>
        <div className="lg:col-span-5">
          <p className="text-[0.95rem] leading-relaxed text-stone-600 dark:text-stone-400">
            {t(
              "products.subtitle",
              "Sélectionnées avec soin auprès de producteurs locaux, conditionnées dans le respect des standards les plus exigeants.",
            )}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-stone-700 dark:text-stone-300">
            <li>{t("products.badgeNatural", "100% Naturel & Sans additifs")}</li>
            <li>{t("products.sandFreeBadge", "Zéro Sable Garanti")}</li>
            {country && (
              <li className="flex items-center gap-2">
                <Flag code={country.code} className="h-3 w-4 rounded-[2px]" />
                {t("products.shippingToCountry", { country: country.name, defaultValue: `Livraison vers ${country.name}` })}
              </li>
            )}
          </ul>
        </div>
      </header>

      {/* Recherche */}
      <div className="relative z-20 max-w-2xl">
        <ProductSearchBar value={query} onChange={setQuery} suggestions={suggestions} />
      </div>

      {/* 4. Zone de Contrôles : Public + Tri + Bascule Vue */}
      <div className="space-y-6 pt-1">
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-stone-800">
            {/* Filtre Public Cible */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 hidden text-sm italic text-stone-500 sm:inline">
                {t("products.filterAudience", "Public")} :
              </span>
              {audienceChips.map((chip) => {
                const active = audience === chip.key;
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setAudience(chip.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 cursor-pointer ${
                      active
                        ? "border-[#2c1b11] bg-[#2c1b11] text-stone-50 dark:border-gold dark:bg-gold dark:text-stone-950"
                        : "border-stone-300 text-stone-700 hover:border-stone-500 dark:border-stone-700 dark:text-stone-300"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {chip.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Tri */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-full border border-stone-300 bg-background px-3.5 py-1.5 text-sm text-foreground focus:border-stone-500 focus:outline-none dark:border-stone-700 cursor-pointer"
                >
                  <option value="name">{t("products.sortName", "Nom (A-Z)")}</option>
                  <option value="price-asc">{t("products.sortPriceAsc", "Prix : Croissant")}</option>
                  <option value="price-desc">{t("products.sortPriceDesc", "Prix : Décroissant")}</option>
                  <option value="stock">{t("products.sortStock", "Disponibilité")}</option>
                </select>
              </div>

              {/* Bascule Grille / Liste */}
              <div className="hidden sm:flex items-center rounded-xl border border-border bg-secondary/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition cursor-pointer ${
                    viewMode === "grid" ? "bg-card text-stone-950 dark:text-stone-50 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t("products.viewGrid", "Vue grille")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition cursor-pointer ${
                    viewMode === "list" ? "bg-card text-stone-950 dark:text-stone-50 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t("products.viewList", "Vue liste")}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtres actifs & Reset */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 self-start text-xs">
              <span className="text-muted-foreground">{t("products.activeFilters", "Filtres actifs :")}</span>
              {audience !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-semibold text-primary border border-primary/30">
                  {audience === "enfant" ? t("products.babyAndKid", "Bébé & Enfant") : t("products.adultAndFamily", "Adulte & Famille")}
                  <button type="button" onClick={() => setAudience("all")} className="hover:text-primary cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {query.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 font-medium text-foreground border border-border">
                  "{query}"
                  <button type="button" onClick={() => setQuery("")} className="hover:text-primary cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setAudience("all");
                  setQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-destructive underline ml-2 cursor-pointer"
              >
                {t("products.resetAll", "Réinitialiser tout")}
              </button>
            </div>
          )}
        </div>

        {/* 4. Liste / Grille des Produits */}
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} layout="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} layout="list" />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mb-4">
              <Boxes className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">
              {t("products.searchNoResults", "Aucun produit ne correspond à votre recherche")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("products.searchNoResultsDesc", "Essayez de modifier vos filtres ou de chercher un autre terme (ex : riz, fonio, mil, moringa...).")}
            </p>
            <button
              type="button"
              onClick={() => {
                setAudience("all");
                setQuery("");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
            >
              {t("products.showAll", "Afficher toutes les céréales")}
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, idx) => (
              <Reveal key={p.id} delay={idx * 40}>
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  shortDescription={p.short_description}
                  category={p.category}
                  unit={p.unit}
                  prices={p.product_prices}
                  audiences={p.audiences}
                  imageUrl={p.image_url}
                  stock={p.stock}
                  layout="grid"
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p, idx) => (
              <Reveal key={p.id} delay={idx * 30}>
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  shortDescription={p.short_description}
                  category={p.category}
                  unit={p.unit}
                  prices={p.product_prices}
                  audiences={p.audiences}
                  imageUrl={p.image_url}
                  stock={p.stock}
                  layout="list"
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
