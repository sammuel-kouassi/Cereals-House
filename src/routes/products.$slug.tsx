import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Leaf, Truck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { imageFor } from "@/lib/products-meta";
import { useCountry } from "@/lib/country-context";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { country } = useCountry();
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_prices(country_code, price, shipping_fee)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="h-96 animate-pulse rounded-2xl bg-secondary" /></div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-primary">Produit introuvable</h1>
        <Link to="/products" className="mt-4 inline-block text-gold hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  const price = product.product_prices?.find((p) => p.country_code === country?.code)?.price ?? 0;

  const handleAdd = () => {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: imageFor(product.slug),
        unitPrice: price,
      },
      qty,
    );
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleBuy = () => {
    handleAdd();
    router.navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-gold">Accueil</Link> <span className="mx-1">/</span>{" "}
        <Link to="/products" className="hover:text-gold">Boutique</Link> <span className="mx-1">/</span>{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
          <img
            src={imageFor(product.slug)}
            alt={product.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">{product.category}</span>
          )}
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">{product.name}</h1>
          {product.short_description && (
            <p className="mt-3 text-lg text-muted-foreground">{product.short_description}</p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <div className="font-display text-4xl font-bold text-gold">
              {country ? formatPrice(price, country.currency_code, country.currency_symbol) : "—"}
            </div>
            <div className="text-sm text-muted-foreground">/ {product.unit}</div>
          </div>

          {product.description && (
            <p className="mt-6 leading-relaxed text-foreground/85">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border bg-card">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center rounded-l-full hover:bg-secondary"
                aria-label="Réduire"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="grid h-11 w-11 place-items-center rounded-r-full hover:bg-secondary"
                aria-label="Augmenter"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{product.unit}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-background px-6 py-3 text-sm font-semibold text-primary transition hover:bg-secondary"
            >
              <ShoppingBag className="h-4 w-4" /> Ajouter au panier
            </button>
            <button
              type="button"
              onClick={handleBuy}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:-translate-y-0.5 hover:bg-gold/90"
            >
              Acheter maintenant
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Leaf, t: "100% naturel" },
              { icon: Truck, t: "Livraison rapide" },
              { icon: ShieldCheck, t: "Paiement sécurisé" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <f.icon className="h-4 w-4 text-gold" /> {f.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
