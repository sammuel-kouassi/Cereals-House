import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Baby, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { ProductSearchBar } from "@/components/product-search-bar";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Boutique — Cereals House" },
      { name: "description", content: "Découvrez toutes nos céréales premium : riz, mil, fonio, maïs, sorgho, blé, arachide, niébé." },
    ],
  }),
  component: ProductsPage,
});

type AudienceFilter = "all" | "enfant" | "adulte";

function ProductsPage() {
  const { t } = useTranslation();
  const ALL = t("products.all");
  const [category, setCategory] = useState<string>(ALL);
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [query, setQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, short_description, category, unit, audiences, product_prices(country_code, price)")
        .eq("is_active", true)
        .order("name");
      return (data ?? []) as unknown as Array<{
        id: string;
        slug: string;
        name: string;
        short_description: string | null;
        category: string | null;
        unit: string;
        audiences: string[] | null;
        product_prices: { country_code: string; price: number }[];
      }>;
    },
  });

  const categories = [ALL, ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const q = normalize(query.trim());

  const filtered = products.filter((p) => {
    const catOk = category === ALL || p.category === category;
    const audOk = audience === "all" || (p.audiences ?? []).includes(audience);
    const searchOk =
      !q ||
      normalize(p.name).includes(q) ||
      normalize(p.short_description ?? "").includes(q) ||
      normalize(p.category ?? "").includes(q);
    return catOk && audOk && searchOk;
  });

  const suggestions = Array.from(
    new Map(
      [
        ...products.map((p) => ({ label: p.name, type: "product" as const })),
        ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).map((c) => ({
          label: c,
          type: "category" as const,
        })),
      ].map((s) => [s.label.toLowerCase(), s]),
    ).values(),
  );

  const audienceChips: { key: AudienceFilter; label: string; icon: typeof Users }[] = [
    { key: "all", label: t("products.audienceAll"), icon: Users },
    { key: "enfant", label: t("audience.kid"), icon: Baby },
    { key: "adulte", label: t("audience.adult"), icon: User },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center motion-safe:animate-[fade-in_0.6s_ease-out]">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">{t("products.eyebrow")}</span>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">{t("products.title")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("products.subtitle")}</p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <ProductSearchBar value={query} onChange={setQuery} suggestions={suggestions} />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                category === c
                  ? "border-gold bg-gold text-gold-foreground shadow-gold"
                  : "border-border bg-card text-foreground/80 hover:border-gold/40 hover:-translate-y-0.5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("products.filterAudience")}
          </span>
          {audienceChips.map((chip) => {
            const active = audience === chip.key;
            const Icon = chip.icon;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setAudience(chip.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("products.searchNoResults")}</p>
        </div>
      ) : (
        <>
          {query.trim() && (
            <p className="mt-8 text-center text-xs uppercase tracking-widest text-muted-foreground">
              {t(filtered.length === 1 ? "products.searchResultsOne" : "products.searchResultsMany", {
                count: filtered.length,
              })}
            </p>
          )}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                shortDescription={p.short_description}
                category={p.category}
                unit={p.unit}
                audiences={p.audiences}
                prices={p.product_prices ?? []}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}