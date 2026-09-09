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

export function HomePage() {
  const { country } = useCountry();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => listProductsFn(),
  });

  const featured = allProducts.filter((p) => p.is_featured);
  const categories = ["all", ...Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean) as string[]))];

  const displayedProducts = selectedCategory === "all"
    ? featured
    : allProducts.filter((p) => p.category === selectedCategory);

  const steps = [
    { n: "01", t: t("home.step1Title", "Choisissez vos céréales"), d: t("home.step1Desc", "Explorez notre catalogue de farines et céréales authentiques sélectionnées avec soin.") },
    { n: "02", t: t("home.step2Title", "Indiquez votre adresse"), d: t("home.step2Desc", "Renseignez votre ville et numéro pour une livraison directe à domicile ou en point relais.") },
    { n: "03", t: t("home.step3Title", "Paiement Mobile Money / Carte"), d: t("home.step3Desc", "Payez en toute sécurité via Wave, Orange Money, MTN, Moov ou carte bancaire.") },
    { n: "04", t: t("home.step4Title", "Livraison rapide chez vous"), d: t("home.step4Desc", "Suivez votre colis en temps réel et recevez vos céréales sous 24h à 48h.") },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. Nouveau Hero Banner Récit Narratif & Tabs Interactifs */}
      <HeroNarrativeBanner />

      {/* 2. Collection Vedette avec Filtres par Catégorie */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/80">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                {t("home.featuredEyebrow", "Nos Pépites du Terroir")}
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-primary tracking-tight">
                {t("home.featuredTitle", "Céréales & Farines Recommandées")}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                {t("home.featuredDesc", "Sélectionnées et conditionnées avec soin pour une alimentation saine et nutritive.")}
              </p>
            </div>

            {/* Onglets Catégories */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border">
                {categories.map((cat) => {
                  const label = cat === "all" ? t("products.all", "Toutes les catégories") : cat;
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-card text-gold shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* Grille Produits */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedProducts.slice(0, 6).map((p, idx) => (
            <Reveal key={p.id} delay={idx * 60}>
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

      {/* 3. Section Bento Grid : Pourquoi Choisir Cereals House */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> L'Artisanat de Précision
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-primary">
              Pourquoi notre meunerie est incomparable
            </h2>
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
                <h3 className="font-display text-lg font-bold text-primary">Grains 100% Terroirs Ouest-Africains</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Mil perlé, fonio royal, sorgho et riz cultivés sans OGM par nos coopératives partenaires du Sahel et de la vallée du Fouta.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                🌾 Traçabilité certifiée du champ au sachet
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
                <h3 className="font-display text-lg font-bold text-primary">Mouture Douce & Précuisson Vapeur</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Notre procédé préserve l'intégralité des vitamines, fibres et minéraux naturels pour une digestibilité maximale dès 6 mois.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                🥣 Sans sucres raffinés ni conservateurs
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
                <h3 className="font-display text-lg font-bold text-primary">Expédition Express & Fraîcheur Scellée</h3>
                <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Bocaux et sachets hermétiques barrières conservant tous les arômes. Livraison en 24h à 48h avec suivi en direct.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-gold">
                📦 Expédition dans 8 pays & diaspora
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Processus de Commande en 4 Étapes */}
      <section className="border-y border-border/80 bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {t("home.stepsEyebrow", "Simplicité & Rapidité")}
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-primary">
                {t("home.stepsTitle", "Comment commander vos céréales")}
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, idx) => (
              <Reveal key={s.n} delay={idx * 70}>
                <div className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 h-full transition hover:border-gold/40">
                  <div>
                    <span className="font-display text-3xl font-extrabold text-gold/40">{s.n}</span>
                    <h3 className="mt-3 font-display text-base font-bold text-primary">{s.t}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bannière B2B & Vente en Gros */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-[#1A140E] via-[#2A1E14] to-[#120E0B] p-8 sm:p-12 text-white shadow-2xl">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                <Boxes className="h-3.5 w-3.5" />
                {t("home.bulkEyebrow", "Espace Professionnels & Grossistes")}
              </div>
              <h3 className="mt-4 font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {t("home.bulkTitle", "Commandes en Gros & Distribution")}
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
                {t("home.bulkDesc", "Vous êtes une crèche, un restaurant, un distributeur ou une ONG ? Profitez de nos tarifs dégressifs en sacs de 25kg et 50kg.")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={getLocalizedPath("/contact")}
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-xs sm:text-sm font-bold text-gold-foreground shadow-gold transition-all duration-300 hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>{t("home.bulkCta", "Demander un devis B2B")}</span>
                </Link>
                <a
                  href="https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20un%20devis%20grossiste."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  WhatsApp Direct
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
