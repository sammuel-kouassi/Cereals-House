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
} from "lucide-react";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { ProductCard } from "@/components/product-card";
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
  const ALL = t("products.all", "Toutes les catégories");
  const [category, setCategory] = useState<string>(ALL);
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

  const categories = [
    ALL,
    ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])),
  ];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());

  let filtered = products.filter((p) => {
    const catOk = category === ALL || p.category === category;
    const audOk = audience === "all" || (p.audiences ?? []).includes(audience);
    const searchOk =
      !q ||
      normalize(p.name).includes(q) ||
      normalize(p.short_description ?? "").includes(q) ||
      normalize(p.category ?? "").includes(q);
    return catOk && audOk && searchOk;
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

  const hasActiveFilters = category !== ALL || audience !== "all" || query.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Header Épuré & Transparent de la Boutique */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/35 border-animated-fine bg-card/40 backdrop-blur-md p-8 sm:p-12 text-foreground shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-600/5 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-primary leading-tight">
            {t("products.title", "Nos farines & céréales fraîches")}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            {t("products.subtitle", "Garanties sans sable ni cailloux, moulues sur meule de pierre et prêtes à être cuisinées pour toute la famille.")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-transparent px-3.5 py-1 text-foreground/80 font-medium shadow-2xs">
              <Leaf className="h-3.5 w-3.5 text-gold" />
              <span>100% Naturel & Sans additifs</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-transparent px-3.5 py-1 text-foreground/80 font-medium shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              <span>Fraîcheur scellée sous vide</span>
            </div>
            {country && (
              <div className="flex items-center gap-1.5 rounded-full border border-gold/35 bg-transparent px-3.5 py-1 text-gold font-semibold shadow-2xs">
                <Flag code={country.code} className="h-3.5 w-5 rounded-[2px]" />
                <span>Livraison vers {country.name}</span>
              </div>
            )}
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

      {/* 3. Zone de Filtrage & Contrôles */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col gap-4">
          {/* Barre de contrôle : Public + Tri + Bascule Vue */}
          <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-3.5 backdrop-blur shadow-xs">
            {/* Filtre Public Cible */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "bg-secondary/70 text-foreground/70 hover:text-primary hover:bg-secondary"
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
                  title="Vue grille"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition cursor-pointer ${
                    viewMode === "list" ? "bg-card text-gold shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Vue liste"
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
              {category !== ALL && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold border border-gold/30">
                  {category}
                  <button type="button" onClick={() => setCategory(ALL)} className="hover:text-primary cursor-pointer ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
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
                  setCategory(ALL);
                  setAudience("all");
                  setQuery("");
                }}
                className="text-xs text-muted-foreground hover:text-destructive underline ml-2 cursor-pointer"
              >
                Réinitialiser tout
              </button>
            </div>
          )}
        </div>

        {/* 4. Liste / Grille des Produits */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mb-4">
              <Boxes className="h-8 w-8" />
            </div>
            <h3 className="font-display text-lg font-bold text-primary">
              {t("products.searchNoResults", "Aucun produit ne correspond à votre recherche")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Essayez de modifier vos filtres ou de chercher un autre terme (ex : riz, fonio, mil, moringa...).
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory(ALL);
                setAudience("all");
                setQuery("");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
            >
              Afficher toutes les céréales
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
