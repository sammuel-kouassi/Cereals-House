import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [{ title: "Fiche Produit — Cereals House" }],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { country } = useCountry();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
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
      toast.success("Votre avis a été publié avec succès !");
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
          to="/products"
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
    toast.success(`${qty}x ${product.name} ajouté(s) au panier !`);
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-gold transition">Accueil</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-gold transition">Boutique</Link>
        <span>/</span>
        {product.category && (
          <>
            <span>{product.category}</span>
            <span>/</span>
          </>
        )}
        <span className="font-semibold text-primary">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
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
                Coup de Cœur
              </span>
            )}
          </div>

          {/* Garanties visuelles sous l'image */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/60 p-4 text-center">
            <div className="flex flex-col items-center gap-1 text-xs">
              <Leaf className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">100% Naturel</span>
              <span className="text-[10px] text-muted-foreground">Sans additifs</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs border-x border-border px-2">
              <Truck className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">Livraison 24-48h</span>
              <span className="text-[10px] text-muted-foreground">Suivi en direct</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-xs">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <span className="font-semibold text-primary">Paiement Mobile</span>
              <span className="text-[10px] text-muted-foreground">Wave, Orange, MTN</span>
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

            {/* Note moyenne fictive/réelle */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviews.length > 0 ? `${reviews.length} avis vérifiés` : "5.0 / 5 — Note excellente"})
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
                En stock ({product.stock} disponibles) — Expédié aujourd'hui
              </span>
            </div>

            {/* Sélecteur de Quantité & Bouton d'Achat */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-primary">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 rounded-full py-4 text-sm font-semibold transition-all duration-300 shadow-gold cursor-pointer ${
                  addedAnimation
                    ? "bg-green-600 text-white scale-102"
                    : "bg-gold text-gold-foreground hover:bg-gold/90 hover:-translate-y-0.5"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="h-5 w-5" /> Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" /> Ajouter au panier • {formatPrice(totalPrice, currencySymbol)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets dynamiques d'informations détaillées */}
      <div className="mt-20">
        <div className="flex border-b border-border overflow-x-auto gap-2">
          {[
            { key: "description", label: "Description & Histoire" },
            { key: "nutrition", label: "Composition & Nutrition" },
            { key: "benefits", label: "Bienfaits & Santé" },
            { key: "recipes", label: "Préparation & Recettes" },
            { key: "reviews", label: `Avis Clients (${reviews.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              className={`whitespace-nowrap px-6 py-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2 -mb-px ${
                activeTab === t.key
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {activeTab === "description" && (
            <div className="max-w-3xl space-y-4 text-sm sm:text-base text-foreground/80 leading-relaxed">
              <p>{product.description || product.short_description}</p>
              <p>
                Nos céréales proviennent des meilleurs terroirs d'Afrique de l'Ouest, récoltées à maturité et nettoyées par des coopératives partenaires engagées pour une agriculture saine et équitable.
              </p>
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="max-w-3xl space-y-4">
              <p className="text-sm text-foreground/80">
                {product.composition || "100% céréales complètes pures, sans sel ajouté, sans sucre raffiné, sans conservateur chimique."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Protéines</span>
                  <div className="mt-1 font-display text-xl font-bold text-primary">Élevées</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Fibres</span>
                  <div className="mt-1 font-display text-xl font-bold text-primary">Excellentes</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Indice Glycémique</span>
                  <div className="mt-1 font-display text-xl font-bold text-primary">Bas / Moyen</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Minéraux</span>
                  <div className="mt-1 font-display text-xl font-bold text-primary">Fer & Zinc</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "benefits" && (
            <div className="max-w-3xl space-y-3 text-sm sm:text-base text-foreground/80 leading-relaxed">
              <p>{product.benefits || "Favorise une digestion légère, apporte une énergie durable et contribue au développement harmonieux des enfants et à la vitalité des adultes."}</p>
              <ul className="list-disc list-inside space-y-2 mt-4 text-sm text-muted-foreground">
                <li>Facile à digérer, ne provoque pas de ballonnements.</li>
                <li>Riche en antioxydants naturels et oligo-éléments protecteurs.</li>
                <li>Idéal pour les repas du matin ou du soir pour toute la famille.</li>
              </ul>
            </div>
          )}

          {activeTab === "recipes" && (
            <div className="max-w-3xl space-y-4 text-sm sm:text-base text-foreground/80 leading-relaxed">
              <div className="flex items-center gap-2 font-display text-lg font-bold text-primary">
                <ChefHat className="h-5 w-5 text-gold" /> Conseils de préparation
              </div>
              <p>{product.preparation || "Mélanger dans un peu d'eau tiède puis porter à ébullition à feu doux pendant 5 à 10 minutes en remuant régulièrement. Servir avec du lait végétal, du miel ou du yaourt."}</p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-3xl space-y-8">
              {/* Formulaire pour laisser un avis */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gold" /> Donner votre avis sur ce produit
                </h3>
                <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Votre Nom</label>
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        required
                        placeholder="Ex: Awa K."
                        className="mt-1 w-full rounded-xl border border-input bg-background py-2 px-3 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Note</label>
                      <div className="mt-1 flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-gold transition hover:scale-110 cursor-pointer"
                          >
                            <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-gold" : "text-border"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Votre Commentaire</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Partagez votre retour d'expérience sur le goût, la texture ou les bienfaits..."
                      className="mt-1 w-full rounded-xl border border-input bg-background py-2 px-3 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reviewMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Publier mon avis
                  </button>
                </form>
              </div>

              {/* Liste des avis existants */}
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Soyez le premier à donner votre avis sur cette céréale !
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-primary">{rev.author_name}</span>
                        <div className="flex text-gold">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-gold" />
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="mt-2 text-sm text-foreground/80">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommandations de produits */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-primary">
              Vous aimerez aussi
            </h2>
            <Link to="/products" className="text-xs font-semibold text-gold hover:underline">
              Voir tout →
            </Link>
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
                audiences={p.audiences}
                imageUrl={p.image_url}
                stock={p.stock}
                prices={p.product_prices ?? []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
