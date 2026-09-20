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
import { ProductCard } from "@/components/product-card";
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
      author: "Aminata T.",
      location: "Cocody, Abidjan",
      quote: "Depuis que j'utilise la farine enrichie pour mon fils de 10 mois, ses bouillies sont tellement douces et lisses. Plus besoin de rajouter du sucre, il termine tout son bol le matin.",
      dish: "Bouillie d'éveil au moringa",
    },
    {
      author: "Cheikh N.",
      location: "Almadies, Dakar",
      quote: "Le fonio est d'une propreté impeccable, pas un seul grain de sable sous la dent. Dix minutes à la vapeur avec une bonne sauce, c'est un pur bonheur après le travail.",
      dish: "Fonio précuit & sauce maison",
    },
    {
      author: "Awa K.",
      location: "Ouagadougou",
      quote: "Pour notre service traiteur du week-end, la qualité du mil pour le dêguê et le thiakry fait l'unanimité. Une mouture constante et une saveur authentique de chez nous.",
      dish: "Mil pour Dêguê & Thiakry",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Nouveau Hero Banner Récit Narratif */}
      <HeroNarrativeBanner />

      {/* 2. Collection Vedette avec Filtres par Catégorie */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="space-y-4 pb-6 border-b border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight">
                  {t("home.featuredTitle", "Les farines & céréales de nos familles")}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                  {t("home.featuredDesc", "Garanties sans sable, triées avec soin et prêtes pour vos recettes du quotidien.")}
                </p>
              </div>

              <Link
                to={getLocalizedPath("/products")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold/80 transition-colors shrink-0"
              >
                <span>{t("home.seeAll", "Voir toute la boutique")}</span>
                <span className="text-sm">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Grille Produits (4 colonnes sur desktop) */}
        <div className="mt-8 grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
          {displayedProducts.slice(0, 8).map((p, idx) => (
            <Reveal key={p.id} delay={idx * 50} className="h-full flex flex-col">
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

        {/* Bouton Voir tout le catalogue */}
        <div className="mt-12 text-center">
          <Link
            to={getLocalizedPath("/products")}
            className="inline-flex items-center gap-2 rounded-full border-2 border-gold/40 bg-gold/5 px-8 py-3.5 text-sm font-bold text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-gold-foreground hover:shadow-gold hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{t("home.seeAll", "Découvrir tout le catalogue")}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 3. Section Terroir & Qualité : Ce qui change tout dans votre marmite */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-primary">
              Ce qui fait la différence dans votre cuisine
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Le respect de la tradition agricole sans les contraintes de préparation.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Carte 1 */}
          <Reveal delay={50}>
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg h-full">
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/25 mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Wheat className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-primary">Zéro sable, zéro cailloux</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Fini les heures passées à tamiser et rincer le mil au fond d'une bassine. Nos céréales sont lavées, vannées et triées avec une exigence absolue avant mise en sachet.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                Prêt à cuire directement dans votre marmite
              </div>
            </div>
          </Reveal>

          {/* Carte 2 */}
          <Reveal delay={100}>
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg h-full">
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/25 mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-primary">Mouture douce sur meule de pierre</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Un broyage lent qui respecte le grain sans échauffement. Les fibres, le fer, le zinc et les vitamines naturelles sont préservés pour une digestibilité parfaite dès 6 mois.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                100% naturel, sans additifs ni sucres raffinés
              </div>
            </div>
          </Reveal>

          {/* Carte 3 */}
          <Reveal delay={150}>
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg h-full">
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/25 mb-5 transition-transform duration-300 group-hover:scale-110">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-primary">Emballage étanche & livraison soignée</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Nos bocaux et sachets barrières protègent les céréales de la chaleur et de l'humidité tropicale. Vos commandes arrivent fraîches chez vous sous 24h à 48h.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                Livraison suivie par SMS et WhatsApp
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Processus de Commande Dynamique (Modèle Dribbble) */}
      <DynamicHowItWorks />

      {/* 5. Vrais Avis de Nos Familles & Cuisiniers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-primary">
              Les retours de nos familles & cuisiniers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Des mamans, des restaurateurs et des amateurs de cuisine traditionnelle qui nous font confiance chaque semaine.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <Reveal key={item.author} delay={idx * 80}>
              <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 h-full shadow-xs hover:border-gold/30 transition">
                <div>
                  <div className="flex items-center gap-1 text-gold mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed italic">
                    "{item.quote}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-primary">{item.author}</div>
                    <div className="text-[11px] text-muted-foreground">{item.location}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full">
                    {item.dish}
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
              label: "Échanger sur WhatsApp",
              href: "https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20un%20devis%20grossiste.",
              isExternal: true,
            }}
          />
        </Reveal>
      </section>
    </div>
  );
}
