import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
  CreditCard,
  Boxes,
  Sparkles,
  PhoneCall,
  Star,
  Quote,
  HeartHandshake,
  Wheat,
  Award,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { listProductsFn } from "@/lib/products/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { useCountry } from "@/lib/country-context";
import { HeroNarrativeBanner } from "@/components/hero-narrative-banner";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { GoldCtaBanner } from "@/components/ui/gold-cta-banner";
import { DynamicHowItWorks } from "@/components/dynamic-how-it-works";

export function HomePage() {
  const { country } = useCountry();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => listProductsFn(),
  });

  const featured = allProducts.filter((p) => p.is_featured);
  const displayedProducts = featured.length > 0 ? featured : allProducts;

  const testimonials = [
    {
      author: t("home.t1Author", "Aminata T."),
      location: t("home.t1Location", "Cocody, Abidjan"),
      quote: t(
        "home.t1Quote",
        "Depuis que j'utilise la farine enrichie pour mon fils de 10 mois, ses bouillies sont tellement douces et lisses. Plus besoin de rajouter du sucre, il termine tout son bol le matin.",
      ),
      dish: t("home.t1Dish", "Bouillie d'éveil au moringa"),
    },
    {
      author: t("home.t2Author", "Cheikh N."),
      location: t("home.t2Location", "Almadies, Dakar"),
      quote: t(
        "home.t2Quote",
        "Le fonio est d'une propreté impeccable, pas un seul grain de sable sous la dent. Dix minutes à la vapeur avec une bonne sauce, c'est un pur bonheur après le travail.",
      ),
      dish: t("home.t2Dish", "Fonio précuit & sauce maison"),
    },
    {
      author: t("home.t3Author", "Awa K."),
      location: t("home.t3Location", "Ouagadougou"),
      quote: t(
        "home.t3Quote",
        "Pour notre service traiteur du week-end, la qualité du mil pour le dêguê et le thiakry fait l'unanimité. Une mouture constante et une saveur authentique de chez nous.",
      ),
      dish: t("home.t3Dish", "Mil pour Dêguê & Thiakry"),
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Nouveau Hero Banner Récit Narratif */}
      <HeroNarrativeBanner />

      {/* 2. Collection Vedette de la Maison */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-900 dark:text-gold mb-3">
                <Wheat className="h-3 w-3" />
                <span>{t("home.harvestBadge", "Sélection Récoltes & Moutures Fraîches")}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-bold text-stone-950 dark:text-stone-100 tracking-tight leading-snug">
                {t("home.familiesFloursTitle", "Les farines & céréales")}{" "}
                <span className="font-editorial text-amber-800 dark:text-gold font-normal">
                  {t("home.familiesFloursItalic", "de nos familles")}
                </span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-lg">
                {t(
                  "home.familiesFloursDesc",
                  "Garanties 100% sans sable, vannées avec amour et prêtes pour vos bouillies, gâteaux et sauces d'exception.",
                )}
              </p>
            </div>

            <Link
              to={getLocalizedPath("/products")}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-gold hover:text-amber-950 dark:hover:text-amber-300 transition-colors group shrink-0"
            >
              <span>{t("home.seeAllGrocery", "Voir toute l'épicerie")}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>

        {/* Grille Produits (4 colonnes sur desktop) */}
        {isLoading ? (
          <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
            {displayedProducts.slice(0, 8).map((p, idx) => (
              <Reveal key={p.id} delay={idx * 40} className="h-full flex flex-col">
                <ProductCard
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
              </Reveal>
            ))}
          </div>
        )}

        {/* Bouton Voir tout le catalogue avec puce imbriquée (Button-in-Button) */}
        <div className="mt-12 sm:mt-16 text-center">
          <Link
            to={getLocalizedPath("/products")}
            className="group inline-flex items-center gap-4 rounded-full border border-gold/40 bg-stone-900 dark:bg-stone-900 text-white pl-7 pr-3.5 py-3 text-xs sm:text-sm font-bold shadow-xl transition-all duration-300 hover:bg-gold hover:text-stone-950 hover:scale-[1.02] cursor-pointer"
          >
            <span>{t("home.exploreFullCatalog", "Explorer l'ensemble de notre catalogue")}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 dark:bg-white/10 group-hover:bg-stone-950 group-hover:text-gold transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Section Terroir & Qualité : Bento Asymétrique d'Atelier Culinaire */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12 border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-900 dark:text-gold mb-3">
                <Leaf className="h-3 w-3" />
                <span>{t("home.craftBadge", "Exigence Artisanale & Terroir")}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-stone-950 dark:text-stone-100 tracking-tight leading-snug">
                {t("home.bentoHeaderTitle", "Ce qui change tout")} <span className="font-editorial text-amber-800 dark:text-gold font-normal">{t("home.bentoHeaderItalic", "dans votre marmite")}</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              {t("home.bentoHeaderDesc", "Le goût originel des céréales d'Afrique de l'Ouest, avec le confort d'un produit prêt à cuisiner sans perte de temps.")}
            </p>
          </div>
        </Reveal>

        {/* Bento Grid Asymétrique 12 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Bento Card 1 (Majeure : 7 colonnes) */}
          <div className="md:col-span-7 flex flex-col justify-between rounded-[2rem] p-6 sm:p-8 bg-gradient-to-br from-[#1C140E] via-[#241912] to-[#18110B] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-125" />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">
                  {t("home.bento1Badge", "Engagement N°1")}
                </span>
                <span className="text-xs font-serif italic text-gold/80">{t("home.bento1Sub", "Pureté certifiée")}</span>
              </div>

              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-stone-100 leading-snug">
                {t("home.bento1Title", "Zéro grain de sable sous la dent.")} <span className="text-gold font-editorial">{t("home.bento1TitleItalic", "Garanti à 100%.")}</span>
              </h3>

              <p className="mt-3 text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl">
                {t("home.bento1Desc", "Oubliez les heures passées à vanner, tamiser et décanter vos céréales au fond d'une bassine. Chez Cereals House, chaque récolte subit un triple lavage à l'eau claire, un séchage doux au soleil et un tri manuel rigoureux. Vous versez directement dans votre casserole.")}
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-stone-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">{t("home.bento1Ready", "Prêt pour bouillies, gâteaux & couscous")}</span>
              </div>
              <span className="font-serif italic text-gold">{t("home.bento1AdditiveFree", "Sans additif ni conservateur")}</span>
            </div>
          </div>

          {/* Bento Card 2 (5 colonnes : Meule de pierre) */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-[2rem] p-6 sm:p-7 bg-[#FAF7F2] dark:bg-[#201711] border border-stone-200/80 dark:border-stone-800/80 shadow-sm relative overflow-hidden group hover:border-gold/50 transition-all duration-300">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-300/80 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700 dark:text-stone-300 mb-4">
                {t("home.bento2Badge", "Mouture Artisanale")}
              </div>

              <h3 className="font-display text-base sm:text-lg md:text-xl font-bold text-stone-950 dark:text-stone-100 leading-snug">
                {t("home.bento2Title", "Mouture douce sur meule de pierre")}
              </h3>

              <p className="mt-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-light">
                {t("home.bento2Desc", "Un écrasement lent qui ne chauffe jamais le grain. La totalité des nutriments (fer, zinc végétal, magnésium et fibres douces) est préservée intacte pour les tout-petits dès 6 mois.")}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 dark:text-gold">{t("home.bento2Digest", "Digestibilité optimale")}</span>
              <span className="text-stone-400 text-[11px]">{t("home.bento2Cold", "Broyage à froid")}</span>
            </div>
          </div>

          {/* Bento Card 3 (Pleine largeur sur mobile, 12 colonnes avec double pilier) */}
          <div className="md:col-span-12 rounded-[2rem] p-5 sm:p-7 bg-[#FAF7F2]/80 dark:bg-[#1C140E]/80 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-gold border border-amber-500/25">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display text-sm sm:text-base font-bold text-stone-950 dark:text-stone-100">
                  {t("home.bento3Title", "Emballage étanche tropicalisé & livraison express")}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {t("home.bento3Desc", "Sachets multicouches hermétiques conservant toute la fraîcheur et les arômes des céréales.")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to={getLocalizedPath("/products")}
                className="inline-flex items-center gap-2 rounded-full bg-[#1C140E] dark:bg-gold text-white dark:text-stone-950 px-4.5 py-2 text-xs font-bold transition-all duration-300 hover:scale-105 shadow-md cursor-pointer"
              >
                <span>{t("home.bento3Cta", "Commander un paquet")}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Processus de Commande Dynamique (Modèle Dribbble) */}
      <DynamicHowItWorks />

      {/* 5. Carnet de Table & Journal de Dégustation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-900 dark:text-gold mb-2.5">
                <Quote className="h-3 w-3" />
                <span>{t("home.tableLogBadge", "Carnet de Table")}</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-stone-950 dark:text-stone-100 tracking-tight leading-snug">
                {t("home.testimonialsTitle", "Les retours de nos")} <span className="font-editorial text-amber-800 dark:text-gold font-normal">{t("home.testimonialsItalic", "familles & cuisiniers")}</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              {t("home.testimonialsDesc", "Témoignages authentiques de mamans et chefs qui cuisinent nos farines au quotidien.")}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <Reveal key={item.author} delay={idx * 80}>
              <div className="flex flex-col justify-between rounded-[2rem] border border-stone-200/80 dark:border-stone-800/80 bg-card p-6 sm:p-7 h-full shadow-xs hover:border-gold/50 hover:shadow-md transition-all duration-400">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/25 px-2.5 py-1 text-[10px] font-bold text-amber-900 dark:text-gold uppercase tracking-wider">
                      {item.dish}
                    </span>
                    <div className="flex items-center gap-0.5 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-gold" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-light italic">
                    « {item.quote} »
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100">{item.author}</div>
                    <div className="text-[11px] text-stone-500 font-light">{item.location}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-300/40">
                    {t("home.verifiedPurchase", "Achat vérifié")}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. Bannière B2B & Vente en Gros */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <GoldCtaBanner
            variant="b2b"
            eyebrow={t("home.bulkEyebrow", "Pour crèches, restaurants & distributeurs")}
            title={t("home.bulkTitle", "Commandes en gros & sacs de 25kg / 50kg")}
            description={t(
              "home.bulkDesc",
              "Vous êtes une crèche, un restaurant ou un revendeur ? Profitez de nos tarifs dégressifs avec un accompagnement direct par WhatsApp ou téléphone.",
            )}
            primaryAction={{
              label: t("home.bulkCta", "Demander un devis grossiste"),
              href: "/contact",
            }}
            secondaryAction={{
              label: t("home.whatsappConsult", "Échanger sur WhatsApp"),
              href: "https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20un%20devis%20grossiste.",
              isExternal: true,
            }}
          />
        </Reveal>
      </section>
    </div>
  );
}
