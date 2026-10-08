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
        {/* Colonne Galerie & Image avec Architecture Double-Bezel */}
        <div className="space-y-5">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900">
              <img
                src={product.image_url || imageFor(product.slug)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.is_featured && (
                <span className="absolute left-4 top-4 rounded-full bg-[#fbf8f3] px-3 py-1 text-xs italic text-stone-800">
                  {t("product.featuredBadge", "Coup de Cœur de l'Atelier")}
                </span>
              )}
            </div>
          </div>

          {/* Garanties visuelles sous l'image en 3 dalles tactiles */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 border-t border-stone-200 pt-4 text-center dark:border-stone-800">
              <Leaf className="h-5 w-5 text-amber-800 dark:text-gold" strokeWidth={1.5} />
              <span className="text-sm text-stone-900 dark:text-stone-100">{t("product.natural", "100% Naturel")}</span>
              <span className="text-xs italic text-stone-500">{t("product.naturalSub", "Sans aucun additif")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-t border-stone-200 pt-4 text-center dark:border-stone-800">
              <Truck className="h-5 w-5 text-amber-800 dark:text-gold" strokeWidth={1.5} />
              <span className="text-sm text-stone-900 dark:text-stone-100">{t("product.fastDelivery", "Livraison suivie")}</span>
              <span className="text-xs italic text-stone-500">{t("product.fastDeliverySub", "Suivi WhatsApp")}</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-t border-stone-200 pt-4 text-center dark:border-stone-800">
              <ShieldCheck className="h-5 w-5 text-amber-800 dark:text-gold" strokeWidth={1.5} />
              <span className="text-sm text-stone-900 dark:text-stone-100">{t("product.securePayment", "Règlement Sécurisé")}</span>
              <span className="text-xs italic text-stone-500">{t("product.securePaymentSub", "Wave, OM, MoMo, CB")}</span>
            </div>
          </div>
        </div>

        {/* Colonne Détails & Achat */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            {product.category && (
              <p className="text-sm italic text-amber-800 dark:text-gold">{product.category}</p>
            )}
            <h1 className="mt-2 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.015em] text-stone-950 dark:text-stone-50 sm:text-[2.6rem]">
              {product.name}
            </h1>

            {/* Note moyenne : uniquement à partir des avis réels */}
            {reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      strokeWidth={0}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length)
                          ? "fill-current"
                          : "fill-stone-300 dark:fill-stone-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-stone-500">{t("product.reviewsVerified", { count: reviews.length })}</span>
              </div>
            )}

            {/* Prix */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-3xl text-stone-950 dark:text-stone-50">
                {formatPrice(unitPrice, currencySymbol)}
              </span>
              <span className="text-sm text-stone-500">
                / {product.unit}
              </span>
            </div>

            {product.short_description && (
              <p className="mt-4 max-w-prose text-[0.95rem] leading-relaxed text-stone-600 dark:text-stone-400">
                {product.short_description}
              </p>
            )}

            {/* État du stock */}
            <div className="mt-6 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="text-sm text-stone-700 dark:text-stone-300">
                {t("product.inStockShippingToday", { count: product.stock, defaultValue: `En stock (${product.stock} sachets) : préparation immédiate` })}
              </span>
            </div>

            {/* Sélecteur de Quantité & Bouton d'Achat Tactile */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-stone-300 p-1 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  aria-label={t("common.decrease", "Diminuer")}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-base tabular-nums text-stone-950 dark:text-stone-100">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-10 w-10 place-items-center rounded-full text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  aria-label={t("common.increase", "Augmenter")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`inline-flex min-h-12 flex-1 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm transition-colors duration-300 cursor-pointer ${
                  addedAnimation
                    ? "bg-emerald-700 text-white"
                    : "bg-[#2c1b11] text-stone-50 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
                }`}
              >
                <span>
                  {addedAnimation
                    ? t("product.addedToast", "Ajouté au panier !")
                    : `${t("product.addToCart", "Ajouter au panier")} • ${formatPrice(totalPrice, currencySymbol)}`}
                </span>
                {addedAnimation ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />}
              </button>
            </div>

            {/* Réassurance sous le bouton d'achat */}
            <div className="mt-8 space-y-2.5 border-t border-stone-200 pt-6 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-amber-800 dark:text-gold" />
                <span>{t("product.reassurance1", "Sélection rigoureuse auprès de coopératives et petits producteurs locaux")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-amber-800 dark:text-gold" />
                <span>{t("product.reassurance2", "Emballage hermétique de haute qualité préservant saveur et fraîcheur")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="h-4 w-4 shrink-0 text-amber-800 dark:text-gold" />
                <span>{t("product.reassurance3", "Service client et assistance commande joignables 7j/7 sur WhatsApp")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caractéristiques & Onglets Détaillés - Pleine largeur sous les blocs garanties */}
      <section className="border-t border-stone-200 pt-10 dark:border-stone-800">
        <div className="mb-6">
          <h2 className="font-display text-[1.7rem] font-normal leading-tight text-stone-950 dark:text-stone-50 sm:text-[2.1rem]">
            {t("product.detailsSectionTitle", "Caractéristiques & Conseils d'Utilisation")}
          </h2>
        </div>

        {/* Boutons de navigation segmentés style pilule (comme l'image de référence) */}
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
          <div className="flex min-w-max items-center gap-6 border-b border-stone-200 dark:border-stone-800">
            {[
              { id: "description", label: t("product.detailsTab", "Description & Histoire") },
              { id: "nutrition", label: t("product.nutritionTab", "Composition & Valeurs") },
              { id: "benefits", label: t("product.benefitsTab", "Bienfaits & Santé") },
              { id: "recipes", label: t("product.recipesTab", "Idées Recettes & Préparation") },
              { id: "reviews", label: `${t("product.reviewsTab", "Avis Clients")} (${reviews.length})` },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`-mb-px border-b-2 py-3 text-[0.95rem] transition-colors cursor-pointer ${
                    active
                      ? "border-gold text-stone-950 dark:text-stone-50"
                      : "border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets ultra-soigné et spacieux */}
        <div className="mt-8 min-h-[160px]">
          {/* TAB 1 : Description & Histoire */}
          {activeTab === "description" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 p-5 sm:p-6 dark:border-stone-800">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
                  {product.description || product.short_description || t("product.africanTerroirDesc", "Céréale saine récoltée par nos coopératives partenaires, triée sans sable ni cailloux.")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t("product.africanTerroir", "Terroir Africain")}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t("product.africanTerroirDesc", "Culture raisonnée issue de producteurs partenaires d'Afrique de l'Ouest.")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t("product.zeroSandGrit", "Zéro Sable ni Cailloux")}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t("product.zeroSandGritDesc", "Triple nettoyage mécanique et vannage artisanal garanti sans impuretés.")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 sm:p-5 flex items-start gap-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t("product.allPureNatural", "100% Pur & Naturel")}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t("product.allPureNaturalDesc", "Sans additif de synthèse, sans colorant et sans arôme artificiel.")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 : Composition & Valeurs */}
          {activeTab === "nutrition" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 p-5 sm:p-6 dark:border-stone-800">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm italic text-amber-800 dark:text-gold">{t("product.ingredientsFormula", "Ingrédients & Formule")}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  {product.composition || t("product.defaultComposition", "100% céréales locales pures sans conservateurs chimiques, riche en fibres solubles, glucides lents et minéraux essentiels.")}
                </p>
              </div>

              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 text-center">
                  <span className="text-xs italic text-stone-500 block">{t("product.slowCarbs", "Glucides lents")}</span>
                  <span className="text-base sm:text-lg font-bold text-primary mt-1 block">{t("product.diffuseEnergy", "Énergie diffuse")}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{t("product.lastingSatiety", "Satiété durable")}</span>
                </div>
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 text-center">
                  <span className="text-xs italic text-stone-500 block">{t("product.plantFibers", "Fibres végétales")}</span>
                  <span className="text-base sm:text-lg font-bold text-primary mt-1 block">{t("product.gentleComfort", "Douceur")}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{t("product.peacefulDigestion", "Digestion sereine")}</span>
                </div>
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 text-center">
                  <span className="text-xs italic text-stone-500 block">{t("product.micronutrients", "Micronutriments")}</span>
                  <span className="text-base sm:text-lg font-bold text-primary mt-1 block">{t("product.ironZinc", "Fer & Zinc")}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{t("product.essentialMinerals", "Minéraux essentiels")}</span>
                </div>
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4 text-center">
                  <span className="text-xs italic text-stone-500 block">{t("product.qualityLabel", "Qualité")}</span>
                  <span className="text-base sm:text-lg font-bold text-gold mt-1 block">{t("product.pureNaturalLabel", "100% Naturel")}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{t("product.noPreservatives", "Sans conservateurs")}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3 : Bienfaits & Santé */}
          {activeTab === "benefits" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 p-5 sm:p-6 dark:border-stone-800">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
                  {product.benefits || t("product.defaultBenefits", "Idéal pour l'énergie quotidienne, la vitalité du foyer et la digestion douce chez les enfants comme chez les adultes.")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-5 flex items-start gap-3.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t("product.growthVitality", "Croissance & Vitalité Harmonique")}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{t("product.growthVitalityDesc", "Apport nutritionnel adapté pour soutenir les journées intenses et le développement sain.")}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-5 flex items-start gap-3.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-500/15 text-green-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{t("product.gutComfort", "Confort Intestinal & Légèreté")}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{t("product.gutComfortDesc", "Farines fines et douces, adaptées aux estomacs sensibles.")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 : Idées Recettes & Préparation */}
          {activeTab === "recipes" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-stone-200 p-5 sm:p-6 dark:border-stone-800">
                <div className="flex items-center gap-2 mb-2">
                  <ChefHat className="h-4 w-4 text-gold" />
                  <span className="text-sm italic text-amber-800 dark:text-gold">{t("product.prepTip", "Conseil de Préparation")}</span>
                </div>
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed">
                  {product.preparation || t("product.defaultPreparation", "Cuisson rapide à la vapeur (5 min) ou en bouillie onctueuse avec un peu de lait frais, une touche de miel et une pincée de muscade.")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-5 relative overflow-hidden">
                  <span className="absolute top-2 right-3 font-display text-3xl font-bold text-border/70 select-none">01</span>
                  <span className="text-xs italic text-amber-800 dark:text-gold block">{t("product.step1Tag", "Étape 1")}</span>
                  <h4 className="text-sm font-bold text-primary mt-1">{t("product.step1Title", "Délayer à froid")}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t("product.step1Desc", "Mélanger la dose souhaitée avec un peu d'eau ou de lait tiède jusqu'à consistance lisse.")}</p>
                </div>

                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-5 relative overflow-hidden">
                  <span className="absolute top-2 right-3 font-display text-3xl font-bold text-border/70 select-none">02</span>
                  <span className="text-xs italic text-amber-800 dark:text-gold block">{t("product.step2Tag", "Étape 2")}</span>
                  <h4 className="text-sm font-bold text-primary mt-1">{t("product.step2Title", "Cuisson à feu doux")}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t("product.step2Desc", "Verser dans de l'eau frémissante et remuer continuellement pendant 5 à 8 minutes.")}</p>
                </div>

                <div className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-5 relative overflow-hidden">
                  <span className="absolute top-2 right-3 font-display text-3xl font-bold text-border/70 select-none">03</span>
                  <span className="text-xs italic text-amber-800 dark:text-gold block">{t("product.step3Tag", "Étape 3")}</span>
                  <h4 className="text-sm font-bold text-primary mt-1">{t("product.step3Title", "Sublimer & Déguster")}</h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{t("product.step3Desc", "Agrémenter selon vos envies : une cuillère de miel pur, cannelle ou lait végétal frais.")}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5 : Avis Clients */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
                  <p className="italic text-sm text-muted-foreground/80">{t("product.noReviews", "Soyez le premier client à donner votre avis sur cette céréale.")}</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {reviews.map((r, i) => (
                    <div key={i} className="rounded-xl bg-[#f6f0e6] dark:bg-stone-900/50 p-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-primary">{r.author_name}</span>
                        <div className="flex text-gold">
                          {Array.from({ length: r.rating }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 fill-gold" />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-foreground/80 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire simple d'avis */}
              <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-border/60 space-y-3">
                <span className="text-sm font-bold text-primary block">{t("product.reviewFormTitle", "Partager votre expérience")}</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder={t("product.reviewAuthorPlaceholder", "Votre prénom ou ville")}
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60"
                  />
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground"
                  >
                    <option value={5}>★★★★★ (5/5) : {t("product.ratingDelicious", "Délicieux")}</option>
                    <option value={4}>★★★★☆ (4/5) : {t("product.ratingVeryGood", "Très bon")}</option>
                    <option value={3}>★★★☆☆ (3/5) : {t("product.ratingGood", "Bon")}</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  placeholder={t("product.reviewPlaceholder", "Partagez votre retour...")}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{t("product.reviewSubmit", "Publier mon avis")}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Céréales recommandées */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-border/80">
          <div className="mb-6">

            <h2 className="font-display text-[1.7rem] font-normal leading-tight text-stone-950 dark:text-stone-50 sm:text-[2.1rem]">{t("product.relatedTitle", "Céréales complémentaires recommandées")}</h2>
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
