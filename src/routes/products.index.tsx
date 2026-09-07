import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { ProductCard } from "@/components/product-card";
import { ProductSearchBar } from "@/components/product-search-bar";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Boutique & Céréales — Cereals House" },
      {
        name: "description",
        content:
          "Découvrez toutes nos céréales africaines premium : riz parfumé, mil, fonio royal, farines infantiles enrichies, sorgho et plus.",
      },
    ],
  }),
  component: ProductsPage,
});

type AudienceFilter = "all" | "enfant" | "adulte";
type SortOption = "name" | "price-asc" | "price-desc" | "stock";

function ProductsPage() {
  const { t } = useTranslation();
  const { country } = useCountry();
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
          (c) => ({
            label: c,
            type: "category" as const,
          }),
        ),
      ].map((s) => [s.label.toLowerCase(), s]),
    ).values(),
  );

  const audienceChips: { key: AudienceFilter; label: string; icon: typeof Users }[] = [
    { key: "all", label: t("products.audienceAll", "Tout public"), icon: Users },
    { key: "enfant", label: t("audience.kid", "Bébé & Enfant"), icon: Baby },
    { key: "adulte", label: t("audience.adult", "Adulte & Famille"), icon: User },
  ];

  const hasActiveFilters = category !== ALL || audience !== "all" || !!query.trim();

  const clearAllFilters = () => {
    setCategory(ALL);
    setAudience("all");
    setQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Entête de page */}
      <div className="text-center motion-safe:animate-[fade-in_0.5s_ease-out]">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> {t("products.eyebrow", "Notre Boutique en Ligne")}
        </span>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
          {t("products.title", "Céréales & Farines de Terroir")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t("products.subtitle", "Sélection rigoureuse des meilleures céréales d'Afrique : saines, nutritives, 100% naturelles.")}
        </p>
      </div>

      {/* Barre de recherche et filtres de base */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <ProductSearchBar value={query} onChange={setQuery} suggestions={suggestions} />

        {/* Pilules de catégories */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                category === c
                  ? "border-gold bg-gold text-gold-foreground shadow-gold"
                  : "border-border bg-card text-foreground/80 hover:border-gold/40 hover:-translate-y-0.5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Barre de contrôle secondaire : Public + Tri + Bascule Vue Grille/Liste */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          {/* Filtre Public Cible */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Public :
            </span>
            {audienceChips.map((chip) => {
              const active = audience === chip.key;
              const Icon = chip.icon;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setAudience(chip.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-foreground/70 hover:text-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Tri */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5 text-gold" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="price-asc">Prix : Croissant</option>
                <option value="price-desc">Prix : Décroissant</option>
                <option value="stock">Disponibilité</option>
              </select>
            </div>

            {/* Bascule Grille / Liste */}
            <div className="hidden sm:flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`grid h-7 w-7 place-items-center rounded-md transition cursor-pointer ${
                  viewMode === "grid" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`grid h-7 w-7 place-items-center rounded-md transition cursor-pointer ${
                  viewMode === "list" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
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
            <span className="text-muted-foreground">Filtres actifs :</span>
            {category !== ALL && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 font-semibold text-gold">
                {category}
                <button type="button" onClick={() => setCategory(ALL)} className="hover:text-primary cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {audience !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
                {audience === "enfant" ? "Bébé & Enfant" : "Adulte & Famille"}
                <button type="button" onClick={() => setAudience("all")} className="hover:text-primary cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {query.trim() && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">
                "{query}"
                <button type="button" onClick={() => setQuery("")} className="hover:text-primary cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-gold font-semibold hover:underline ml-2 cursor-pointer"
            >
              Réinitialiser tout
            </button>
          </div>
        )}
      </div>

      {/* Grille / Liste des produits */}
      {isLoading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-secondary/70" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-14 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mb-4">
            <SlidersHorizontal className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-display text-xl font-bold text-primary">
            {t("products.searchNoResults", "Aucune céréale ne correspond à vos critères")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Modifiez vos filtres ou effectuez une recherche avec d'autres termes.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
          >
            Afficher tous les produits
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              shortDescription={p.short_description}
              category={p.category}
              unit={p.unit}
              audiences={p.audiences}
              imageUrl={p.image_url}
              stock={p.stock}
              prices={p.product_prices ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              shortDescription={p.short_description}
              category={p.category}
              unit={p.unit}
              audiences={p.audiences}
              imageUrl={p.image_url}
              stock={p.stock}
              prices={p.product_prices ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}