import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Boutique — Cereals House" },
      { name: "description", content: "Découvrez toutes nos céréales premium : riz, mil, fonio, maïs, sorgho, blé, arachide, niébé." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [category, setCategory] = useState<string>("Tous");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, short_description, category, unit, product_prices(country_code, price)")
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    },
  });

  const categories = ["Tous", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = category === "Tous" ? products : products.filter((p) => p.category === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Boutique</span>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">Toutes nos céréales</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Sélectionnées avec soin auprès de producteurs locaux, conditionnées dans le respect des standards les plus exigeants.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === c
                ? "border-gold bg-gold text-gold-foreground"
                : "border-border bg-card text-foreground/80 hover:border-gold/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              shortDescription={p.short_description}
              category={p.category}
              unit={p.unit}
              prices={p.product_prices ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
