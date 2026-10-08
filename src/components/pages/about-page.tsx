import { Link } from "@tanstack/react-router";
import {
  Leaf,
  Heart,
  Award,
  Sprout,
  ShieldCheck,
  PackageCheck,
  Truck,
  Sparkles,
  Wheat,
  CheckCircle2,
  Quote,
  Clock,
  Check,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";
import storyImage from "@/assets/hero_cereales_mixtes_pack.jpg";
import founderImage from "@/assets/lucette-dossou-ceo.jpg";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { GoldCtaBanner } from "@/components/ui/gold-cta-banner";
import { SectionHeading } from "@/components/section-heading";

export function AboutPage() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();

  const values = [
    {
      icon: Sprout,
      title: t("about.v1t", "Terroirs Nobles & Durables"),
      desc: t(
        "about.v1d",
        "Partenariats directs avec des coopératives paysannes d'Afrique de l'Ouest, garantissant une juste rémunération et un respect absolu des sols.",
      ),
      tag: t("about.v1tag", "Filière Équitable"),
    },
    {
      icon: Award,
      title: t("about.v2t", "Savoir-Faire & Transformation"),
      desc: t(
        "about.v2d",
        "Une mouture soigneuse qui permet de préserver au mieux les qualités naturelles des céréales. Certaines références sont précuites pour gagner du temps en cuisine.",
      ),
      tag: t("about.v2tag", "Mouture soignée"),
    },
    {
      icon: Heart,
      title: t("about.v3t", "Nutrition & Santé Familiale"),
      desc: t(
        "about.v3d",
        "Des farines d'éveil saines enrichies au Moringa et Baobab bio, sans conservateurs ni sucres raffinés ajoutés, pour les tout-petits et toute la famille.",
      ),
      tag: t("about.v3tag", "100% Sans Additifs"),
    },
    {
      icon: PackageCheck,
      title: t("about.v4t", "Écrin & Fraîcheur Scellée"),
      desc: t(
        "about.v4d",
        "Conditionnement hermétique de pointe protégeant chaque grain de l'humidité et de l'oxydation pour une fraîcheur garantie 24 mois.",
      ),
      tag: t("about.v4tag", "Protection Étanche"),
    },
  ];

  const stats = [
    { value: "100%", label: t("about.stat1Label", "Naturel & Sans Additif"), hint: t("about.stat1Hint", "Zéro produit chimique") },
    { value: "1 200+", label: t("about.stat2Label", "Familles Nourries"), hint: t("about.stat2Hint", "Chaque semaine") },
    { value: "8", label: t("about.stat3Label", "Pays Desservis"), hint: t("about.stat3Hint", "Afrique & Diaspora") },
    { value: "24-48h", label: t("about.stat4Label", "Délai Moyen de Livraison"), hint: t("about.stat4Hint", "Suivi en direct") },
  ];

  const timeline = [
    {
      n: "01",
      icon: Sprout,
      title: t("about.tl1t", "Récolte & Sélection Manuelle"),
      desc: t(
        "about.tl1d",
        "Nos grains de mil doré, fonio royal et sorgho sont cultivés selon les méthodes traditionnelles au cœur des terroirs ouest-africains.",
      ),
      detail: t("about.tl1Detail", "Grains mûris au soleil"),
    },
    {
      n: "02",
      icon: ShieldCheck,
      title: t("about.tl2t", "Tri Rigoureux & Contrôle Qualité"),
      desc: t(
        "about.tl2d",
        "Dépoussiérage, nettoyage et tri minutieux pour des céréales propres, sans sable ni cailloux.",
      ),
      detail: t("about.tl2Detail", "Sans sable ni cailloux"),
    },
    {
      n: "03",
      icon: Wheat,
      title: t("about.tl3t", "Mouture & Préparation Soignées"),
      desc: t(
        "about.tl3d",
        "Une transformation soigneuse pour une texture agréable et des préparations faciles au quotidien.",
      ),
      detail: t("about.tl3Detail", "Prêt en 3 à 5 minutes"),
    },
    {
      n: "04",
      icon: Truck,
      title: t("about.tl4t", "Mise en Écrin & Expédition"),
      desc: t(
        "about.tl4d",
        "Scellage hermétique en sachets barrières protecteurs, puis expédition rapide et suivie jusqu'à votre domicile.",
      ),
      detail: t("about.tl4Detail", "Fraîcheur intacte"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Ouverture */}
      <section className="bg-[#1a110b] text-stone-100">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Reveal>
            <h1 className="font-display text-[2.3rem] font-normal leading-[1.08] tracking-[-0.015em] text-stone-50 sm:text-5xl lg:text-[3.6rem]">
              {t("about.heroTitlePart1", "L'amour du grain,")}{" "}
              <em className="text-gold">{t("about.heroTitlePart2", "l'art du goût authentique")}</em>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg">
              {t(
                "about.heroDesc",
                "Nourrir sainement nos familles avec le meilleur des céréales d'ici, sans sable, sans conservateurs et sans perte de temps en cuisine.",
              )}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-stone-300">
              {[
                t("about.badgeNatural", "100% Naturel & Sans additifs"),
                t("about.badgePrecooked", "Préparation rapide en cuisine"),
                t("about.badgeSandFree", "Zéro sable garanti"),
              ].map((label) => (
                <li key={label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 2. L'histoire de la fondatrice */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <figure>
                <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone-200">
                  <img
                    src={founderImage}
                    alt="DOSSOU Lucette - Fondatrice et CEO de Cereals House"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-b border-stone-200 pb-4 dark:border-stone-800">
                  <span className="font-display text-lg text-stone-950 dark:text-stone-50">DOSSOU Lucette</span>
                  <span className="text-sm italic text-stone-500">{t("about.founderRole", "Fondatrice & CEO")}</span>
                </figcaption>
              </figure>
            </Reveal>
          </div>

          <div className="space-y-6 lg:col-span-7 lg:pt-4">
            <Reveal>
              <p className="text-sm italic text-amber-800 dark:text-gold">
                {t("about.founderEyebrow", "L’histoire de DOSSOU Lucette")}
              </p>
              <h2 className="mt-3 font-display text-[1.9rem] font-normal leading-[1.15] text-stone-950 dark:text-stone-50 sm:text-[2.4rem]">
                {t("about.founderTitle", "Une histoire personnelle : de la quête de confiance à la naissance de Cereals House")}
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="max-w-prose space-y-5 text-base leading-[1.75] text-stone-700 dark:text-stone-300 sm:text-[1.05rem]">
                <p>{t("about.storyP1")}</p>
                <p>{t("about.storyP2")}</p>
                <p>{t("about.storyP3")}</p>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-stone-200 pt-8 dark:border-stone-800 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-sm text-stone-600 dark:text-stone-400">{s.label}</dt>
                    <dd className="mt-1 font-display text-3xl text-stone-950 dark:text-stone-50">{s.value}</dd>
                    <dd className="text-xs italic text-stone-500">{s.hint}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Engagements */}
      <section className="border-y border-stone-200 bg-[#f6f0e6] py-20 dark:border-stone-800 dark:bg-stone-900/40 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              title={t("about.commitmentsTitle", "Ce qui fait la différence Cereals House")}
              description={t(
                "about.commitmentsDesc",
                "Chaque paquet de farine et chaque bocal de céréales répond à un cahier des charges d'excellence sans compromis.",
              )}
            />
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, idx) => (
              <Reveal key={v.title} delay={idx * 80}>
                <div className="flex h-full flex-col">
                  <v.icon className="h-6 w-6 text-amber-800 dark:text-gold" strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-xl text-stone-950 dark:text-stone-50">{v.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{v.desc}</p>
                  <p className="mt-5 border-t border-stone-300/70 pt-3 text-sm italic text-stone-500 dark:border-stone-700">
                    {v.tag}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Le chemin du grain (étapes ordonnées) */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <SectionHeading
            title={t("about.timelineTitle", "L'Itinéraire d'un Grain d'Excellence")}
            description={t(
              "about.timelineSubtitle",
              "Un savoir-faire artisanal combiné à des méthodes modernes de tri et de transformation.",
            )}
          />
        </Reveal>

        <ol className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
          {timeline.map((step, idx) => (
            <Reveal key={step.n} delay={idx * 90}>
              <li className="flex h-full flex-col border-t border-stone-900/80 pt-5 dark:border-stone-300/60">
                <span className="font-display text-sm italic text-amber-800 dark:text-gold">{step.n}</span>
                <h3 className="mt-2 font-display text-xl text-stone-950 dark:text-stone-50">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{step.desc}</p>
                <p className="mt-4 text-sm italic text-stone-500">{step.detail}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 5. Parole de la fondatrice */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <figure className="border-y border-stone-200 py-14 text-center dark:border-stone-800">
            <blockquote className="mx-auto max-w-3xl font-display text-2xl italic leading-snug text-stone-900 dark:text-stone-100 sm:text-[2rem]">
              {t(
                "about.quoteText",
                "« Cereals House est née d’une recette de ma mère qui m’a aidée à me retrouver. Aujourd’hui, je veux à mon tour la partager avec le monde. »",
              )}
            </blockquote>
            <figcaption className="mt-8 flex items-center justify-center gap-3">
              <img
                src={founderImage}
                alt=""
                className="h-11 w-11 rounded-full object-cover object-top"
              />
              <span className="text-left text-sm">
                <span className="block text-stone-950 dark:text-stone-50">{t("about.quoteAuthor", "DOSSOU Lucette")}</span>
                <span className="block italic text-stone-500">
                  {t("about.quoteRole", "Fondatrice & CEO de Cereals House")}
                </span>
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      {/* 6. Appel à l'action */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <Reveal>
          <GoldCtaBanner
            variant="discovery"
            eyebrow={t("about.ctaEyebrow", "Cuisine saine & gourmande")}
            title={t("about.ctaTitle", "Prêt(e) à redécouvrir le goût authentique du bon grain ?")}
            description={t(
              "about.ctaDesc",
              "Explorez notre sélection de farines et céréales du terroir et faites-vous livrer chez vous en toute sérénité.",
            )}
            primaryAction={{
              label: t("about.ctaBtn", "Explorer la Boutique"),
              href: "/products",
            }}
            secondaryAction={{
              label: t("about.ctaContact", "Nous contacter"),
              href: "/contact",
            }}
          />
        </Reveal>
      </section>
    </div>
  );
}
