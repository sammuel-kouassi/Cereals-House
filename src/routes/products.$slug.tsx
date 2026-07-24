import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Star,
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
import { useAuth } from "@/lib/auth-context";
import { ProductCard } from "@/components/product-card";

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
      <RelatedProducts currentProductId={product.id} category={product.category} />
      <ProductReviews productId={product.id} />
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

function RelatedProducts({
  currentProductId,
  category,
}: {
  currentProductId: string;
  category: string | null;
}) {
  const { t } = useTranslation();

  const { data: related = [] } = useQuery({
    queryKey: ["related-products", currentProductId, category],
    queryFn: async () => {
      // On privilégie la même catégorie ; si ça ne donne pas assez de
      // résultats, on complète avec d'autres produits actifs au hasard —
      // mieux vaut montrer 4 produits pertinents que rien du tout.
      let query = supabase
        .from("products")
        .select(
          "id, slug, name, short_description, category, unit, audiences, image_url, stock, product_prices(country_code, price)",
        )
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(4);
      if (category) query = query.eq("category", category);

      const { data } = await query;
      if (data && data.length >= 4) return data;

      // Complète avec des produits d'autres catégories si besoin.
      const { data: fallback } = await supabase
        .from("products")
        .select(
          "id, slug, name, short_description, category, unit, audiences, image_url, stock, product_prices(country_code, price)",
        )
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(4);
      return fallback ?? data ?? [];
    },
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">
          {t("product.relatedEyebrow")}
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
          {t("product.relatedTitle")}
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => (
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
    </section>
  );
}

function StarRating({
  value,
  onChange,
  size = "h-4 w-4",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`${size} ${n <= value ? "fill-gold text-gold" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}

function ProductReviews({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const myReview = reviews.find((r) => r.user_id === user?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;
    setSubmitting(true);
    try {
      const reviewerName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Client";

      const { error } = await supabase.from("product_reviews").upsert(
        {
          product_id: productId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
          reviewer_name: reviewerName,
        },
        { onConflict: "product_id,user_id" },
      );
      if (error) throw error;

      toast.success(t("product.reviewSubmitted"));
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("product.reviewError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gold">
            {t("product.reviewsEyebrow")}
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
            {t("product.reviewsTitle")}
          </h2>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(average)} size="h-5 w-5" />
            <span className="text-sm text-muted-foreground">
              {average.toFixed(1)} · {t("product.reviewsCount", { count: reviews.length })}
            </span>
          </div>
        )}
      </div>

      {user && !myReview && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-primary">
            {t("product.reviewFormTitle")}
          </h3>
          <div className="mt-3">
            <StarRating value={rating} onChange={setRating} size="h-6 w-6" />
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("product.reviewPlaceholder")}
            className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="mt-3 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? t("checkout.submitting") : t("product.reviewSubmit")}
          </button>
        </form>
      )}

      {isLoading ? null : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("product.noReviews")}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-primary">{r.reviewer_name}</div>
                <StarRating value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
