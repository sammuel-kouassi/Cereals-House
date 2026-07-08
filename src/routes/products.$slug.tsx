import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Leaf,
  Truck,
  ShieldCheck,
  Weight,
  Users,
  FileText,
  FlaskConical,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        <h1 className="font-display text-3xl font-bold text-primary">{t("product.notFound")}</h1>
        <Link to="/products" className="mt-4 inline-block text-gold hover:underline">{t("product.backToShop")}</Link>
      </div>
    );
  }

  const price = product.product_prices?.find((p) => p.country_code === country?.code)?.price ?? 0;

  const handleAdd = () => {
    add(
      { productId: product.id, slug: product.slug, name: product.name, image: imageFor(product.slug), unitPrice: price },
      qty,
    );
    toast.success(t("product.addedToast", { name: product.name }));
  };

  const handleBuy = () => {
    handleAdd();
    router.navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-gold">{t("product.breadcrumbHome")}</Link> <span className="mx-1">/</span>{" "}
        <Link to="/products" className="hover:text-gold">{t("product.breadcrumbShop")}</Link> <span className="mx-1">/</span>{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border bg-secondary">
          <img src={imageFor(product.slug)} alt={product.name} width={1024} height={1024} className="h-full w-full object-cover" />
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
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center rounded-l-full hover:bg-secondary" aria-label={t("product.decrease")}>
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-semibold">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center rounded-r-full hover:bg-secondary" aria-label={t("product.increase")}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">{product.unit}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={handleAdd} className="inline-flex items-center gap-2 rounded-full border border-primary bg-background px-6 py-3 text-sm font-semibold text-primary transition hover:bg-secondary">
              <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
            </button>
            <button type="button" onClick={handleBuy} className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:-translate-y-0.5 hover:bg-gold/90">
              {t("product.buyNow")}
            </button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Leaf, tx: t("product.natural") },
              { icon: Truck, tx: t("product.fastDelivery") },
              { icon: ShieldCheck, tx: t("product.securePayment") },
            ].map((f) => (
              <div key={f.tx} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <f.icon className="h-4 w-4 text-gold" /> {f.tx}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductDetails product={product as unknown as Record<string, unknown>} />
    </div>
  );
}

type DetailField = {
  key: "weight_g" | "target_audience" | "description" | "composition" | "benefits" | "preparation";
  labelKey: string;
  icon: typeof Weight;
  accent: string;
  format?: (v: unknown) => string;
};

const DETAILS: DetailField[] = [
  { key: "weight_g", labelKey: "product.fields.weight", icon: Weight, accent: "from-amber-400/20 to-amber-600/10", format: (v) => (v ? `${v} g` : "—") },
  { key: "target_audience", labelKey: "product.fields.audience", icon: Users, accent: "from-emerald-400/20 to-emerald-600/10" },
  { key: "description", labelKey: "product.fields.description", icon: FileText, accent: "from-sky-400/20 to-sky-600/10" },
  { key: "composition", labelKey: "product.fields.composition", icon: FlaskConical, accent: "from-violet-400/20 to-violet-600/10" },
  { key: "benefits", labelKey: "product.fields.benefits", icon: Sparkles, accent: "from-rose-400/20 to-rose-600/10" },
  { key: "preparation", labelKey: "product.fields.preparation", icon: ChefHat, accent: "from-orange-400/20 to-orange-600/10" },
];

function ProductDetails({ product }: { product: Record<string, unknown> }) {
  const { t } = useTranslation();
  const items = DETAILS.map((d) => ({ ...d, value: product[d.key] })).filter(
    (d) => d.value !== null && d.value !== undefined && d.value !== "",
  );

  if (items.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">{t("product.sheetEyebrow")}</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">{t("product.sheetTitle")}</h2>
        </div>
        <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent md:ml-8 md:block" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const value = item.format ? item.format(item.value) : String(item.value);
          return (
            <article
              key={item.key}
              style={{ animationDelay: `${idx * 80}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:fill-mode-both"
            >
              <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${item.accent} blur-2xl transition-transform duration-700 group-hover:scale-125`} />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold/90 to-gold/60 text-gold-foreground shadow-gold transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-primary">{t(item.labelKey)}</h3>
                  <p className="mt-2 leading-relaxed text-foreground/80">{value}</p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
            </article>
          );
        })}
      </div>
    </section>
  );
}