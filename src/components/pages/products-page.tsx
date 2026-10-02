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
  Sparkles,
  ArrowUpDown,
  Boxes,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Star,
} from "lucide-react";
import heroLuxuryCereals from "@/assets/hero-luxury-cereals.jpg";
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Header Écrin Terroir & Épicerie Fine */}
      <div className="group relative overflow-hidden rounded-[2.25rem] sm:rounded-[2.75rem] border border-gold/35 border-animated-fine bg-gradient-to-br from-[#1C140E] via-[#241912] to-[#18110B] p-7 sm:p-10 lg:p-12 text-white shadow-2xl">
        {/* Halos lumineux d'ambiance */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/15 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-700/15 blur-3xl opacity-50" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Colonne Gauche : Titre, Slogan & Badges (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 bg-gold/15 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gold mb-4 shadow-xs">
              <Leaf className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>{t("products.catalogBadge", "Catalogue Officiel & Moutures d'Afrique")}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-100 leading-tight">
              {t("products.titlePart1", "Farines & céréales")}{" "}
              <span className="font-editorial text-gradient-gold font-normal">
                {t("products.titlePart2", "d'exception")}
              </span>
            </h1>

            <p className="mt-3 text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed font-light">
              {t(
                "products.subtitle",
                "Garanties 100% sans sable, mouture douce sur meule de pierre et scellées sous vide pour préserver chaque nutriment et arôme naturel.",
              )}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-3.5 sm:px-4 py-1.5 text-stone-200 font-medium shadow-xs">
                <Leaf className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>{t("products.badgeNatural", "100% Naturel & Sans additifs")}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-3.5 sm:px-4 py-1.5 text-stone-200 font-medium shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>{t("products.badgeVacuum", "Fraîcheur scellée sous vide")}</span>
              </div>
              {country && (
                <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3.5 sm:px-4 py-1.5 text-gold font-semibold shadow-xs">
                  <Flag code={country.code} className="h-3.5 w-5 rounded-[2px]" />
                  <span>{t("products.shippingToCountry", { country: country.name, defaultValue: `Livraison vers ${country.name}` })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite : Composition Visuelle Stylée & Flottante (5 cols) */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center pt-2 lg:pt-0">
            <div className="relative w-full max-w-sm my-2">
              {/* Carte Principale Vitrine Meunerie */}
              <div className="relative overflow-hidden rounded-2xl border border-gold/35 bg-stone-900/80 backdrop-blur-md p-3 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-xl">
                  <img
                    src={heroLuxuryCereals}
                    alt="Moutures et Céréales d'Exception Cereals House"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Overlay bas d'image : étoiles & pureté */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      <div className="flex items-center gap-1 text-gold text-xs">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <span className="ml-1 text-[11px] font-bold text-white">4.9 / 5</span>
                      </div>
                      <p className="text-[10px] text-stone-300 font-light mt-0.5">
                        {t("products.selectionPureMilling", "Sélection Meule de Pierre · Terroirs Nobles")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 px-1.5 flex items-center justify-between text-[11px] text-stone-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5 text-gold shrink-0" />
                    {t("products.westAfricanFarming", "Filières paysannes ouest-africaines")}
                  </span>
                  <span className="text-gold/90 font-semibold">Abidjan & UEMOA</span>
                </div>
              </div>

              {/* Badge Flottant 1 (Haut Droite, flottement doux) */}
              <div className="animate-float-slow absolute -top-3 -right-2 sm:-right-3 rounded-xl border border-gold/50 bg-[#1E1610]/95 backdrop-blur-md px-3.5 py-1.5 shadow-xl flex items-center gap-2 text-xs font-bold text-stone-100">
                <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>{t("products.stoneMillingBadge", "Mouture Meule Douce")}</span>
              </div>

              {/* Badge Flottant 2 (Bas Gauche, flottement différé) */}
              <div className="animate-float-delayed absolute -bottom-3 -left-2 sm:-left-3 rounded-xl border border-gold/40 bg-[#1C140E]/95 backdrop-blur-md px-3.5 py-1.5 shadow-xl flex items-center gap-2 text-xs font-bold text-gold">
                <ShieldCheck className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>{t("products.sandFreeBadge", "Zéro Sable Garanti")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Barre de Recherche Flottante */}
      <div className="max-w-2xl mx-auto -mt-6 relative z-20">
        <ProductSearchBar
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
          className="shadow-xl"
        />
      </div>

      {/* 4. Zone de Contrôles : Public + Tri + Bascule Vue */}
      <div className="space-y-6 pt-1">
        <div className="flex flex-col gap-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-card p-3 backdrop-blur shadow-xs">
            {/* Filtre Public Cible */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold uppercase tracking-wider text-stone-400 hidden sm:inline">
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-[#1C140E] text-gold dark:bg-gold dark:text-stone-950 shadow-xs font-bold"
                        : "bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-gold" /> {chip.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Tri */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5 text-gold" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground focus:border-gold focus:outline-none cursor-pointer"
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
                    viewMode === "grid" ? "bg-card text-gold shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={t("products.viewGrid", "Vue grille")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition cursor-pointer ${
                    viewMode === "list" ? "bg-card text-gold shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
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
