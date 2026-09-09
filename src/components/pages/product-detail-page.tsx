import { Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  Leaf,
  Truck,
  ShieldCheck,
  Users,
  Sparkles,
  ChefHat,
  Flame,
  Star,
  Check,
  MessageSquare,
  Send,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getProductBySlugFn, submitProductReviewFn, listProductsFn } from "@/lib/products/products.functions";
import { imageFor } from "@/lib/products-meta";
import { useCountry } from "@/lib/country-context";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { PageLoader } from "@/components/page-loader";
import { useAuth } from "@/lib/auth-context";
import { ProductCard } from "@/components/product-card";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function ProductDetailPage({ slug }: { slug: string }) {
  const { country } = useCountry();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const queryClient = useQueryClient();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "nutrition" | "benefits" | "recipes" | "reviews">("description");
  const [reviewAuthor, setReviewAuthor] = useState(user?.full_name || "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Requête du produit
  const { data, isLoading } = useQuery({
    queryKey: ["product-detail", slug],
    queryFn: () => getProductBySlugFn({ data: { slug } }),
  });

  // Requête des autres produits (pour les recommandations)
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: () => listProductsFn(),
  });

  const product = data?.product;
  const reviews = data?.reviews ?? [];

  // Mutation pour l'avis client
  const reviewMutation = useMutation({
    mutationFn: (newReview: { productId: string; authorName: string; rating: number; comment?: string }) =>
      submitProductReviewFn({ data: newReview }),
    onSuccess: () => {
      toast.success(t("product.reviewSubmitted", "Votre avis a été publié avec succès !"));
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["product-detail", slug] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la publication de l'avis.");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <PageLoader />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("product.notFound", "Céréale introuvable")}
        </h1>
        <p className="mt-2 text-muted-foreground">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link
          to={getLocalizedPath("/products")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold"
        >
          {t("product.backToShop", "Retourner à la boutique")}
        </Link>
      </div>
    );
  }

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";
  const priceObj = product.product_prices?.find((p) => p.country_code === currentCountryCode);
  const basePriceXof = product.product_prices?.find((p) => p.country_code === "CI")?.price ?? product.product_prices?.[0]?.price ?? 0;
  const unitPrice = priceObj?.price ?? basePriceXof;
  const totalPrice = unitPrice * qty;

  const handleAddToCart = () => {
    addToCart({
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      imageUrl: product.image_url || imageFor(product.slug),
      prices: product.product_prices ?? [],
      quantity: qty,
    });

    setAddedAnimation(true);
    toast.success(`${qty}x ${product.name} ${t("product.addedToast", "ajouté(s) au panier !")}`);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.id) return;
    reviewMutation.mutate({
      productId: product.id,
      authorName: reviewAuthor.trim() || (user?.full_name ?? "Client"),
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
  };

  const relatedProducts = allProducts.filter((p) => p.slug !== product.slug && (p.category === product.category || p.is_featured)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to={getLocalizedPath("/")} className="hover:text-gold transition">
          {t("product.breadcrumbHome", "Accueil")}
        </Link>
        <span>/</span>
        <Link to={getLocalizedPath("/products")} className="hover:text-gold transition">
          {t("product.breadcrumbShop", "Boutique")}
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <span>{product.category}</span>
            <span>/</span>
          </>
        )}
        <span className="font-semibold text-primary">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2 items-start">
        {/* Colonne Galerie & Image */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-secondary shadow-xl">
            <img
              src={product.image_url || imageFor(product.slug)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            {product.is_featured && (
              <span className="absolute left-4 top-4 rounded-full bg-gold px-3.5 py-1 text-xs font-bold text-gold-foreground shadow-gold">
                {t("product.featuredBadge", "Coup de Cœur")}
              </span>
            )}
          </div>

          {/* Garanties visuelles sous l'image */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/60 p-4 text-center">
            <div className="flex flex-col items-center gap-1 text-xs">
              <Leaf className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">{t("product.natural", "100% Naturel")}</span>
              <span className="text-[10px] text-muted-foreground">{t("product.naturalSub", "Sans additifs")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs border-x border-border px-2">
              <Truck className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">{t("product.fastDelivery", "Livraison 24-48h")}</span>
              <span className="text-[10px] text-muted-foreground">{t("product.fastDeliverySub", "Suivi en direct")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">{t("product.securePayment", "Paiement Mobile")}</span>
              <span className="text-[10px] text-muted-foreground">{t("product.securePaymentSub", "Wave, Orange, MTN")}</span>
            </div>
          </div>
        </div>

        {/* Colonne Détails & Achat */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                {product.category}
              </span>
            )}
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary leading-tight">
              {product.name}
            </h1>

            {/* Note moyenne */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviews.length > 0 ? t("product.reviewsVerified", { count: reviews.length }) : t("product.reviewsExcellent", "5.0 / 5 — Note excellente")})
              </span>
            </div>

            {/* Prix */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-bold text-gold">
                {formatPrice(unitPrice, currencySymbol)}
              </span>
              <span className="text-sm uppercase tracking-wider text-muted-foreground">
                / {product.unit}
              </span>
            </div>

            {product.short_description && (
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* État du stock */}
            <div className="mt-6 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-primary">
                {t("product.inStockShippingToday", { count: product.stock, defaultValue: `En stock (${product.stock} disponibles) — Expédié aujourd'hui` })}
              </span>
            </div>

            {/* Sélecteur de Quantité & Bouton d'Achat */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 hover:bg-secondary hover:text-gold transition cursor-pointer"
                  aria-label="Diminuer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-9 w-9 place-items-center rounded-full text-foreground/80 hover:bg-secondary hover:text-gold transition cursor-pointer"
                  aria-label="Augmenter"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-8 text-sm font-bold shadow-gold transition-all duration-300 cursor-pointer ${
                  addedAnimation
                    ? "bg-green-600 text-white scale-102"
                    : "bg-gold text-gold-foreground hover:bg-gold/90 hover:-translate-y-0.5"
                }`}
              >
                {addedAnimation ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                <span>
                  {addedAnimation
                    ? t("product.addedToast", "Ajouté !")
                    : `${t("product.addToCart", "Ajouter au panier")} • ${formatPrice(totalPrice, currencySymbol)}`}
                </span>
              </button>
            </div>
          </div>

          {/* Onglets Détaillés Fiche Produit */}
          <div className="pt-6 border-t border-border/80">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              {[
                { id: "description", label: t("product.detailsTab", "Description & Histoire") },
                { id: "nutrition", label: t("product.nutritionTab", "Composition & Valeurs") },
                { id: "benefits", label: t("product.benefitsTab", "Bienfaits & Santé") },
                { id: "recipes", label: t("product.recipesTab", "Idées Recettes & Préparation") },
                { id: "reviews", label: `${t("product.reviewsTab", "Avis Clients")} (${reviews.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed min-h-[140px]">
              {activeTab === "description" && (
                <p>{product.description || product.short_description || "Céréale ancestrale récoltée et conditionnée selon les plus hauts standards de pureté."}</p>
              )}
              {activeTab === "nutrition" && (
                <p>{product.composition || "100% céréales locales pures sans conservateurs chimiques, riche en fibres solubles, glucides lents et micronutriments essentiels."}</p>
              )}
              {activeTab === "benefits" && (
                <p>{product.benefits || "Idéal pour l'équilibre glycémique, la vitalité quotidienne et la digestion douce chez les enfants comme chez les adultes."}</p>
              )}
              {activeTab === "recipes" && (
                <p>{product.preparation || "Cuisson rapide à la vapeur (5 min) ou en bouillie veloutée avec du lait frais, un filet de miel pur et quelques épices douces."}</p>
              )}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="italic text-muted-foreground/80">{t("product.noReviews", "Soyez le premier client à laisser un avis sur cette céréale d'exception.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((r, i) => (
                        <div key={i} className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-primary">{r.author_name}</span>
                            <div className="flex text-gold">
                              {Array.from({ length: r.rating }).map((_, j) => (
                                <Star key={j} className="h-3 w-3 fill-gold" />
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-xs text-foreground/80">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulaire simple d'avis */}
                  <form onSubmit={handleReviewSubmit} className="pt-3 border-t border-border/60 space-y-2.5">
                    <span className="text-xs font-bold text-primary">{t("product.reviewFormTitle", "Partager votre expérience")}</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder={t("product.reviewAuthorPlaceholder", "Votre nom ou prénom")}
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60"
                      />
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground"
                      >
                        <option value={5}>★★★★★ (5/5) — Exceptionnel</option>
                        <option value={4}>★★★★☆ (4/5) — Très bon</option>
                        <option value={3}>★★★☆☆ (3/5) — Correct</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={t("product.reviewPlaceholder", "Partagez votre retour...")}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>{t("product.reviewSubmit", "Publier mon avis")}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Céréales recommandées */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-border/80">
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">{t("product.relatedEyebrow", "Dans la même collection")}</span>
            <h2 className="mt-1 font-display text-2xl font-bold text-primary">{t("product.relatedTitle", "Céréales complémentaires recommandées")}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                shortDescription={p.short_description}
                category={p.category}
                unit={p.unit}
                prices={p.product_prices}
                audiences={p.audiences}
                imageUrl={p.image_url}
                stock={p.stock}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
