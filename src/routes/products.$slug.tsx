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
  Flame,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { imageFor } from "@/lib/products-meta";
import { useCountry } from "@/lib/country-context";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { PageLoader } from "@/components/page-loader";
import { flyToCart } from "@/lib/fly-to-cart";

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
  const [householdSize, setHouseholdSize] = useState(4);
  const [mealsPerWeek, setMealsPerWeek] = useState(7);

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
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <PageLoader />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-primary">{t("product.notFound")}</h1>
        <Link to="/products" className="mt-4 inline-block text-gold hover:underline">
          {t("product.backToShop")}
        </Link>
      </div>
    );
  }

  const price = product.product_prices?.find((p) => p.country_code === country?.code)?.price ?? 0;

  // Stock réel (pas de fausse jauge) : on plafonne la quantité sélectionnable
  // et on affiche une alerte uniquement si le stock est effectivement bas.
  const stock = typeof product.stock === "number" ? product.stock : undefined;
  const lowStock = stock !== undefined && stock > 0 && stock <= 15;
  const outOfStock = stock !== undefined && stock <= 0;

  // Estimation indicative (pas une science exacte) : ~120 g de céréale sèche
  // par repas et par personne, pour aider les nouveaux acheteurs en ligne à
  // choisir une quantité sans se tromper. Uniquement pertinent pour les
  // produits vendus au kilo.
  const isKgProduct = product.unit?.toLowerCase().includes("kg");
  const recommendedKg = Math.max(1, Math.ceil((householdSize * mealsPerWeek * 120) / 1000));
  const mealsForQty = Math.round((qty * 1000) / 120);

  const handleAdd = (e?: React.MouseEvent<HTMLButtonElement>) => {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image_url || imageFor(product.slug),
        unitPrice: price,
      },
      qty,
    );
    if (e) flyToCart(e.currentTarget);
    toast.success(t("product.addedToast", { name: product.name }));
  };

  const handleBuy = (e?: React.MouseEvent<HTMLButtonElement>) => {
    handleAdd(e);
    router.navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="transition-colors duration-200 hover:text-gold">
            {t("product.breadcrumbHome")}
          </Link>{" "}
          <span className="mx-1">/</span>{" "}
          <Link to="/products" className="transition-colors duration-200 hover:text-gold">
            {t("product.breadcrumbShop")}
          </Link>{" "}
          <span className="mx-1">/</span> <span className="text-foreground">{product.name}</span>
        </nav>
      </Reveal>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <Reveal direction="left">
          <div className="group overflow-hidden rounded-3xl border border-border bg-secondary shadow-soft">
            <img
              src={product.image_url || imageFor(product.slug)}
              alt={product.name}
              width={1024}
              height={1024}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        </Reveal>

        <Reveal direction="right" delay={80}>
          <div>
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                {product.category}
              </span>
            )}
            <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
              {product.name}
            </h1>
            {product.short_description && (
              <p className="mt-3 text-lg text-muted-foreground">{product.short_description}</p>
            )}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <div className="font-display text-4xl font-bold text-gold">
                {country ? formatPrice(price, country.currency_code, country.currency_symbol) : "—"}
              </div>
              <div className="text-sm text-muted-foreground">/ {product.unit}</div>
              {lowStock && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                  <Flame className="h-3.5 w-3.5" /> {t("product.lowStock", { count: stock })}
                </span>
              )}
              {outOfStock && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {t("product.outOfStock")}
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-6 text-justify leading-relaxed text-foreground/85">
                {product.description}
              </p>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border bg-card transition-colors duration-300 hover:border-gold/40">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-11 w-11 place-items-center rounded-l-full transition-colors duration-200 hover:bg-secondary hover:text-gold active:scale-90"
                  aria-label={t("product.decrease")}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  key={qty}
                  className="w-12 text-center font-semibold motion-safe:animate-[fade-in_0.15s_ease-out_both]"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQty((q) => (stock !== undefined ? Math.min(stock, q + 1) : q + 1))
                  }
                  className="grid h-11 w-11 place-items-center rounded-r-full transition-colors duration-200 hover:bg-secondary hover:text-gold active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("product.increase")}
                  disabled={stock !== undefined && qty >= stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>

            {isKgProduct && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                {t("product.mealsEstimate", { count: mealsForQty })}
              </div>
            )}

            {isKgProduct && (
              <div className="mt-5 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Calculator className="h-4 w-4 text-gold" /> {t("product.calculatorTitle")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t("product.calculatorNote")}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("product.householdSize")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("product.mealsPerWeek")}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={21}
                      value={mealsPerWeek}
                      onChange={(e) => setMealsPerWeek(Math.max(1, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold/10 px-4 py-3">
                  <span className="text-sm text-foreground/85">
                    {t("product.recommendedQty", { count: recommendedKg })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty(stock !== undefined ? Math.min(stock, recommendedKg) : recommendedKg)
                    }
                    className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
                  >
                    {t("product.applyQty")}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-background px-6 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuy}
                disabled={outOfStock}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {t("product.buyNow")}
              </button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Leaf, tx: t("product.natural") },
                { icon: Truck, tx: t("product.fastDelivery") },
                { icon: ShieldCheck, tx: t("product.securePayment") },
              ].map((f) => (
                <div
                  key={f.tx}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30"
                >
                  <f.icon className="h-4 w-4 text-gold" /> {f.tx}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
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
  {
    key: "weight_g",
    labelKey: "product.fields.weight",
    icon: Weight,
    accent: "from-amber-400/20 to-amber-600/10",
    format: (v) => (v ? `${v} g` : "—"),
  },
  {
    key: "target_audience",
    labelKey: "product.fields.audience",
    icon: Users,
    accent: "from-emerald-400/20 to-emerald-600/10",
  },
  {
    key: "description",
    labelKey: "product.fields.description",
    icon: FileText,
    accent: "from-sky-400/20 to-sky-600/10",
  },
  {
    key: "composition",
    labelKey: "product.fields.composition",
    icon: FlaskConical,
    accent: "from-violet-400/20 to-violet-600/10",
  },
  {
    key: "benefits",
    labelKey: "product.fields.benefits",
    icon: Sparkles,
    accent: "from-rose-400/20 to-rose-600/10",
  },
  {
    key: "preparation",
    labelKey: "product.fields.preparation",
    icon: ChefHat,
    accent: "from-orange-400/20 to-orange-600/10",
  },
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
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            {t("product.sheetEyebrow")}
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
            {t("product.sheetTitle")}
          </h2>
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
              <div
                className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${item.accent} blur-2xl transition-transform duration-700 group-hover:scale-125`}
              />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold/90 to-gold/60 text-gold-foreground shadow-gold transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-primary">
                    {t(item.labelKey)}
                  </h3>
                  <p className="mt-2 text-justify leading-relaxed text-foreground/80">{value}</p>
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