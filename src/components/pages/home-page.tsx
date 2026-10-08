import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Star, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { listProductsFn } from "@/lib/products/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { HeroNarrativeBanner } from "@/components/hero-narrative-banner";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { GoldCtaBanner } from "@/components/ui/gold-cta-banner";
import { DynamicHowItWorks } from "@/components/dynamic-how-it-works";
import { SectionHeading, TextLink } from "@/components/section-heading";

const PRODUCT_TRACK =
  "mt-10 -mx-4 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4";

export function HomePage() {
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
    <div className="space-y-20 sm:space-y-28">
      <HeroNarrativeBanner />

      {/* Sélection de produits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title={t("home.familiesFloursTitle", "Les céréales et produits")}
            italic={t("home.familiesFloursItalic", "de nos terroirs")}
            description={t(
              "home.familiesFloursDesc",
              "Garanties 100% sans sable, vannées avec amour et prêtes pour vos bouillies, gâteaux et sauces d'exception.",
            )}
            action={
              <Link to={getLocalizedPath("/products")}>
                <TextLink>{t("home.seeAllGrocery", "Voir toute l'épicerie")}</TextLink>
              </Link>
            }
          />
        </Reveal>

        {isLoading ? (
          <div className={PRODUCT_TRACK}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className={PRODUCT_TRACK}>
            {displayedProducts.slice(0, 8).map((p, idx) => (
              <Reveal
                key={p.id}
                delay={idx * 40}
                className="flex h-full w-[80%] shrink-0 snap-start flex-col sm:w-auto"
              >
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

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs italic text-stone-500 sm:hidden">
          {t("home.swipeHint", "Faites glisser pour voir plus")}
          <ArrowRight className="h-3 w-3" />
        </p>

        <div className="mt-10 text-center sm:mt-14">
          <Link
            to={getLocalizedPath("/products")}
            className="inline-flex items-center gap-3 rounded-full bg-[#2c1b11] px-7 py-3.5 text-sm text-stone-50 transition-colors duration-300 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950 dark:hover:bg-gold/90"
          >
            {t("home.exploreFullCatalog", "Explorer l'ensemble de notre catalogue")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Engagements qualité */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title={t("home.bentoHeaderTitle", "Ce qui change tout")}
            italic={t("home.bentoHeaderItalic", "dans votre marmite")}
            description={t(
              "home.bentoHeaderDesc",
              "Le goût originel des céréales d'Afrique de l'Ouest, avec le confort d'un produit prêt à cuisiner sans perte de temps.",
            )}
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Engagement principal */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#2c1b11] p-7 text-stone-100 sm:p-10 md:col-span-7">
            <div>
              <p className="text-sm italic text-gold">
                {t("home.bento1Badge", "Engagement N°1")} — {t("home.bento1Sub", "Qualité & Propreté")}
              </p>
              <h3 className="mt-4 font-display text-2xl font-normal leading-snug text-stone-50 sm:text-3xl">
                {t("home.bento1Title", "Des céréales soigneusement nettoyées")}{" "}
                <em className="text-gold">{t("home.bento1TitleItalic", "et préparées.")}</em>
              </h3>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-300 sm:text-[0.95rem]">
                {t("home.bento1Desc")}
              </p>
            </div>

            <ul className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm text-stone-300 sm:flex-row sm:gap-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gold" />
                {t("home.bento1Ready", "Prêt pour bouillies, gâteaux & couscous")}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-gold" />
                {t("home.bento1AdditiveFree", "Sans additif ni conservateur")}
              </li>
            </ul>
          </div>

          {/* Mouture */}
          <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-[#f6f0e6] p-7 dark:border-stone-800 dark:bg-[#201711] sm:p-8 md:col-span-5">
            <div>
              <p className="text-sm italic text-amber-800 dark:text-gold">
                {t("home.bento2Badge", "Mouture Artisanale")}
              </p>
              <h3 className="mt-4 font-display text-xl font-normal leading-snug text-stone-950 dark:text-stone-50 sm:text-2xl">
                {t("home.bento2Title", "Mouture soigneuse des céréales")}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {t("home.bento2Desc")}
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-stone-300/70 pt-4 text-sm dark:border-stone-800">
              <span className="text-stone-900 dark:text-stone-100">{t("home.bento2Digest", "Digestibilité optimale")}</span>
              <span className="text-right italic text-stone-500">{t("home.bento2Cold")}</span>
            </div>
          </div>

          {/* Emballage & livraison */}
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-stone-200 p-6 dark:border-stone-800 sm:flex-row sm:items-center sm:p-7 md:col-span-12">
            <div className="flex items-start gap-4">
              <Truck className="mt-1 h-5 w-5 shrink-0 text-amber-800 dark:text-gold" strokeWidth={1.5} />
              <div>
                <h3 className="font-display text-lg text-stone-950 dark:text-stone-50">
                  {t("home.bento3Title", "Emballage hermétique & livraison")}
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {t("home.bento3Desc", "Sachets multicouches hermétiques conservant toute la fraîcheur et les arômes des céréales.")}
                </p>
              </div>
            </div>
            <Link to={getLocalizedPath("/products")} className="shrink-0">
              <TextLink>{t("home.bento3Cta", "Commander un paquet")}</TextLink>
            </Link>
          </div>
        </div>
      </section>

      <DynamicHowItWorks />

      {/* Témoignages */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title={t("home.testimonialsTitle", "Les retours de")}
            italic={t("home.testimonialsItalic", "nos clients")}
            description={t("home.testimonialsDesc", "Témoignages de clients qui apprécient nos céréales et produits au quotidien.")}
          />
        </Reveal>

        <div className="mt-10 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {testimonials.map((item, idx) => (
            <Reveal key={item.author} delay={idx * 80}>
              <figure className="flex h-full flex-col">
                <div className="flex items-center gap-0.5 text-gold" aria-label="5/5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 font-display text-lg leading-relaxed text-stone-800 dark:text-stone-200">
                  « {item.quote} »
                </blockquote>
                <figcaption className="mt-6 border-t border-stone-200 pt-4 text-sm dark:border-stone-800">
                  <span className="text-stone-950 dark:text-stone-100">{item.author}</span>
                  <span className="text-stone-500"> · {item.location}</span>
                  <span className="mt-0.5 block italic text-stone-500">
                    {item.dish} — {t("home.verifiedPurchase", "Achat vérifié")}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Professionnels */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <GoldCtaBanner
            variant="b2b"
            eyebrow={t("home.bulkEyebrow", "Pour crèches, restaurants & distributeurs")}
            title={t("home.bulkTitle", "Vente en gros & tarifs professionnels")}
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
