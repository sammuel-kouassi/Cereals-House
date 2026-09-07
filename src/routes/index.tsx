import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Leaf,
  Truck,
  ShieldCheck,
  CreditCard,
  Boxes,
  Sparkles,
  PhoneCall,
  CheckCircle,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { listProductsFn } from "@/lib/products/products.functions";
import { ProductCard } from "@/components/product-card";
import { Flag } from "@/components/flag";
import { Reveal } from "@/components/reveal";
import { useCountry } from "@/lib/country-context";
import { HeroNarrativeBanner } from "@/components/hero-narrative-banner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cereals House — Céréales africaines premium livrées chez vous" },
      {
        name: "description",
        content:
          "Cereals House : riz parfumé, mil, fonio, farines infantiles, maïs et plus. Commande en ligne, paiement Mobile Money (Wave, Orange, MTN, Moov), livraison rapide.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { country } = useCountry();
  const { t } = useTranslation();
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
    { n: "04", t: t("home.step4Title", "Livraison Rapide"), d: t("home.step4Desc", "Recevez votre colis hermétique sous 24h à 48h et suivez son acheminement en direct.") },
  ];

  const trust = [
    { icon: Leaf, title: t("home.trust.quality", "100% Naturel & Sain"), text: t("home.trust.qualityText", "Sans conservateurs chimiques, cultivé et transformé selon les traditions.") },
    { icon: Truck, title: t("home.trust.delivery", "Livraison Express"), text: t("home.trust.deliveryText", "En Afrique de l'Ouest, en France et à l'international.") },
    { icon: CreditCard, title: t("home.trust.payment", "Mobile Money & Sécurisé"), text: t("home.trust.paymentText", "Paiement instantané via Wave, Orange, MTN, Moov et Visa.") },
    { icon: ShieldCheck, title: t("home.trust.secure", "Qualité Garantie"), text: t("home.trust.secureText", "Satisfaction client garantie ou remplacement immédiat.") },
  ];

  return (
    <div>
      {/* Bannière Narrative Multi-Séquences (Champ -> Meunerie -> Qualité -> Vente) */}
      <HeroNarrativeBanner />

      {/* Trust Badges */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trust.map((f, idx) => (
            <Reveal key={f.title} delay={idx * 80}>
              <div className="group flex items-center gap-4 rounded-xl p-2 transition-all duration-300 hover:-translate-y-0.5 hover:bg-background/60">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-primary">{f.title}</div>
                  <div className="text-sm text-muted-foreground">{f.text}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Grille de Produits & Filtres Rapides */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />

        <Reveal>
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                <span className="h-px w-5 bg-gold" /> {t("home.featuredEyebrow", "Catalogue Sélectionné")}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
                {t("home.featuredTitle", "Nos Céréales & Farines Vedettes")}
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                {t("home.featuredDesc", "Des produits de qualité supérieure, conditionnés avec soin pour préserver toutes leurs saveurs et vertus nutritives.")}
              </p>
            </div>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors duration-300 hover:text-gold/80"
            >
              {t("home.seeAll", "Voir toute la boutique")}{" "}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Filtres de catégories instantanés */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "border border-border bg-card text-foreground/80 hover:border-gold/50"
                }`}
              >
                {cat === "all" ? "Tous les produits" : cat}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-secondary" />
            ))
          ) : displayedProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Aucun produit dans cette catégorie pour le moment.
            </div>
          ) : (
            displayedProducts.map((p, idx) => (
              <Reveal key={p.id} delay={idx * 60} className="h-full">
                <ProductCard
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
              </Reveal>
            ))
          )}
        </div>
      </section>

      {/* Section Vente en Gros B2B / Devis */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-primary via-primary to-primary/90 px-6 py-10 text-primary-foreground sm:px-10 sm:py-12 shadow-2xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-gold/[0.08] blur-3xl" />

            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 sm:max-w-2xl">
                <div className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> {t("home.bulkEyebrow", "Offre Professionnels & Grossistes")}
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                    {t("home.bulkTitle", "Vente en Gros, Sacs de 25kg / 50kg & Devis Express")}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                    {t("home.bulkDesc", "Vous êtes une crèche, maternité, restaurant, supermarché ou distributeur ? Bénéficiez de tarifs préférentiels dégressifs et d'une logistique dédiée.")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
                >
                  {t("home.bulkCta", "Demander un devis B2B")}{" "}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://wa.me/2250700000000?text=Bonjour%20Cereals%20House,%20je%20souhaite%20des%20informations%20pour%20une%20commande%20en%20gros."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:border-gold hover:text-gold"
                >
                  <PhoneCall className="h-4 w-4" /> WhatsApp Direct
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Étapes de commande simples */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                {t("home.stepsEyebrow", "Parcours d'Achat")}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
                {t("home.stepsTitle", "Comment commander vos céréales ?")}
              </h2>
            </div>
          </Reveal>

          <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent lg:block" />
            {steps.map((s, idx) => (
              <Reveal key={s.n} delay={idx * 100}>
                <li className="group relative rounded-2xl border border-primary-foreground/10 bg-background/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-background/10">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/30 font-display text-sm font-bold text-gold transition-colors duration-300 group-hover:border-gold/60 group-hover:bg-gold/10">
                      {s.n}
                    </span>
                    <div className="font-display text-lg font-semibold text-gold">{s.t}</div>
                  </div>
                  <p className="mt-3 text-sm text-primary-foreground/75 leading-relaxed">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}