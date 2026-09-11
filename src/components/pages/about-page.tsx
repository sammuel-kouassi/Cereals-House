import { Link } from "@tanstack/react-router";
import {
  Leaf,
  Heart,
  Globe,
  Award,
  Sprout,
  ShieldCheck,
  PackageCheck,
  Truck,
  ArrowRight,
  Sparkles,
  Wheat,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";
import storyImage from "@/assets/hero-cereals.jpg";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { GoldCtaBanner } from "@/components/ui/gold-cta-banner";

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
    },
    {
      icon: Award,
      title: t("about.v2t", "Meunerie Traditionnelle"),
      desc: t(
        "about.v2d",
        "Mouture douce sur meule de pierre et précuisson à la vapeur pour préserver la totalité des micronutriments, fibres et vitamines naturelles.",
      ),
    },
    {
      icon: Heart,
      title: t("about.v3t", "Nutrition & Santé Familiale"),
      desc: t(
        "about.v3d",
        "Des farines d'éveil saines enrichies au Moringa et Baobab bio, sans conservateurs ni sucres raffinés ajoutés, pour les tout-petits et toute la famille.",
      ),
    },
    {
      icon: PackageCheck,
      title: t("about.v4t", "Écrin & Fraîcheur Scellée"),
      desc: t(
        "about.v4d",
        "Conditionnement hermétique de pointe protégeant chaque grain de l'humidité et de l'oxydation pour une fraîcheur garantie 24 mois.",
      ),
    },
  ];

  const stats = [
    { value: "100%", label: t("about.stat1Label", "Naturel & Sans Additif") },
    { value: "1 200+", label: t("about.stat2Label", "Familles Nourries") },
    { value: "8", label: t("about.stat3Label", "Pays Desservis en Express") },
    { value: "48h", label: t("about.stat4Label", "Délai Moyen de Livraison") },
  ];

  const timeline = [
    {
      n: "01",
      icon: Sprout,
      title: t("about.tl1t", "Récolte & Sélection Manuelle"),
      desc: t(
        "about.tl1d",
        "Nos grains de mil doré, fonio royal et sorgho sont cultivés selon les méthodes traditionnelles au cœur des savanes ouest-africaines.",
      ),
    },
    {
      n: "02",
      icon: ShieldCheck,
      title: t("about.tl2t", "Tri Rigoureux & Contrôle Pureté"),
      desc: t(
        "about.tl2d",
        "Dépoussiérage, lavage et tri minutieux pour garantir une pureté totale sans impuretés ni résidus.",
      ),
    },
    {
      n: "03",
      icon: Wheat,
      title: t("about.tl3t", "Mouture Meule & Cuisson Douce"),
      desc: t(
        "about.tl3d",
        "Transformation lente sur meule et cuisson vapeur pour une texture veloutée et une digestibilité optimale.",
      ),
    },
    {
      n: "04",
      icon: Truck,
      title: t("about.tl4t", "Mise en Écrin & Expédition"),
      desc: t(
        "about.tl4d",
        "Scellage hermétique en bocaux et sachets barrières, puis expédition soignée à votre domicile ou point relais.",
      ),
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* 1. Hero Sombre & Majestueux */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2D1A0E] via-[#3F2513] to-[#22130A] text-stone-100 py-16 sm:py-24 border-b border-gold/40">

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span>{t("about.eyebrow", "Notre Histoire & Nos Terroirs")}</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              {t("about.heroTitle", "L'Âme de")}{" "}
              <span className="bg-gradient-to-r from-[#FDF0CD] via-[#E5BF5A] to-[#BF9024] bg-clip-text text-transparent">
                Cereals House
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 text-base sm:text-lg text-stone-300 font-light leading-relaxed max-w-2xl mx-auto">
              {t("about.heroDesc", "Redonner aux céréales ancestrales d'Afrique de l'Ouest leurs lettres de noblesse, du terroir sahélien jusqu'à votre table de dégustation.")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Histoire Éditoriale & Métriques d'Impact */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal direction="left">
              <div className="group relative overflow-hidden rounded-3xl border border-gold/30 bg-stone-900 shadow-2xl">
                <img
                  src={storyImage}
                  alt="Récolte de céréales en Afrique de l'Ouest"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120E0B]/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
                  <div className="text-xs text-white font-medium">
                    {t("about.terroirBadge", "🌾 Terroirs durables du Sahel & Fouta")}
                  </div>
                  <span className="text-xs font-bold text-gold">{t("about.artisanalBadge", "100% Artisanal")}</span>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Reveal direction="right">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-2">
                <span className="h-px w-5 bg-gold" /> {t("about.storyEyebrow", "Notre Vocation")}
              </span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
                {t("about.storyTitle", "Une passion enracinée dans la richesse de nos terres")}
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("about.storyP1", "Cereals House est née d'une conviction profonde : nos céréales d'Afrique — le mil doré, le fonio royal, le sorgho rouge et nos farines enrichies — possèdent des vertus nutritionnelles et gustatives exceptionnelles que le monde moderne a trop longtemps oubliées.")}
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("about.storyP2", "En travaillant main dans la main avec des coopératives agricoles féminines et des maîtres meuniers traditionnels, nous garantissons une transformation respectueuse, sans additifs chimiques, précuite à la vapeur douce pour préserver chaque bienfait.")}
              </p>

              {/* Chiffres Clés */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-6">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-center">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-gold">{s.value}</div>
                    <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Piliers d'Excellence (Bento 4 Colonnes) */}
      <section className="border-y border-border/80 bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {t("about.commitmentsEyebrow", "Nos Engagements Inaltérables")}
              </span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
                {t("about.commitmentsTitle", "Ce qui fait la différence Cereals House")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("about.commitmentsDesc", "Chaque paquet de farine et chaque bocal de céréales répond à un cahier des charges d'excellence sans compromis.")}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, idx) => (
              <Reveal key={v.title} delay={idx * 80}>
                <div className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg h-full">
                  <div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold mb-4 border border-gold/20 transition-transform duration-300 group-hover:scale-110">
                      <v.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-primary transition-colors duration-200 group-hover:text-gold">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-[11px] font-semibold text-gold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Norme Certifiée
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Timeline du Processus Meunier */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {t("about.timelineEyebrow", "De la Terre à l'Assiette")}
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
              {t("about.timelineTitle", "L'Itinéraire d'un Grain d'Excellence")}
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 relative">
          {timeline.map((step, idx) => (
            <Reveal key={step.n} delay={idx * 90}>
              <div className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:border-gold/50 hover:shadow-md h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-3xl font-extrabold text-gold">{step.n}</span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                      <step.icon className="h-5 w-5 text-gold" />
                    </div>
                  </div>
                  <h3 className="font-display text-base font-bold text-primary">{step.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Call To Action Final (Style Concentrique Or) */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <GoldCtaBanner
            eyebrow="L'Afrique Gourmande & Saine"
            title={t("about.ctaTitle", "Prêt(e) à redécouvrir le goût authentique du terroir ?")}
            description={t(
              "about.ctaDesc",
              "Explorez notre sélection de céréales nobles et faites-vous livrer chez vous en toute sérénité sous 24h à 48h.",
            )}
            primaryAction={{
              label: t("about.ctaBtn", "Explorer la Boutique"),
              href: "/products",
            }}
            secondaryAction={{
              label: t("about.ctaContact", "Nous Contacter"),
              href: "/contact",
            }}
          />
        </Reveal>
      </section>
    </div>
  );
}
