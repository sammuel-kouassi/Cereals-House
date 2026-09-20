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
import { CerealMotifBackground } from "@/components/ui/cereal-motif-background";

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
      tag: "Filière Équitable",
    },
    {
      icon: Award,
      title: t("about.v2t", "Meunerie Traditionnelle"),
      desc: t(
        "about.v2d",
        "Mouture douce sur meule de pierre et précuisson à la vapeur pour préserver la totalité des micronutriments, fibres et vitamines naturelles.",
      ),
      tag: "Meule de Pierre",
    },
    {
      icon: Heart,
      title: t("about.v3t", "Nutrition & Santé Familiale"),
      desc: t(
        "about.v3d",
        "Des farines d'éveil saines enrichies au Moringa et Baobab bio, sans conservateurs ni sucres raffinés ajoutés, pour les tout-petits et toute la famille.",
      ),
      tag: "100% Sans Additifs",
    },
    {
      icon: PackageCheck,
      title: t("about.v4t", "Écrin & Fraîcheur Scellée"),
      desc: t(
        "about.v4d",
        "Conditionnement hermétique de pointe protégeant chaque grain de l'humidité et de l'oxydation pour une fraîcheur garantie 24 mois.",
      ),
      tag: "Protection Étanche",
    },
  ];

  const stats = [
    { value: "100%", label: t("about.stat1Label", "Naturel & Sans Additif"), hint: "Zéro produit chimique" },
    { value: "1 200+", label: t("about.stat2Label", "Familles Nourries"), hint: "Chaque semaine" },
    { value: "8", label: t("about.stat3Label", "Pays Desservis en Express"), hint: "Afrique & Diaspora" },
    { value: "24-48h", label: t("about.stat4Label", "Délai Moyen de Livraison"), hint: "Suivi en direct" },
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
      detail: "Grains mûris au soleil",
    },
    {
      n: "02",
      icon: ShieldCheck,
      title: t("about.tl2t", "Tri Rigoureux & Contrôle Pureté"),
      desc: t(
        "about.tl2d",
        "Dépoussiérage, lavage à l'eau claire et vannage minutieux pour garantir une pureté totale sans le moindre résidu de sable ni cailloux.",
      ),
      detail: "Zéro impureté garanti",
    },
    {
      n: "03",
      icon: Wheat,
      title: t("about.tl3t", "Mouture Meule & Cuisson Douce"),
      desc: t(
        "about.tl3d",
        "Transformation lente sur meule et cuisson vapeur artisanale pour une texture veloutée, digeste et un goût préservé.",
      ),
      detail: "Prêt en 3 à 5 minutes",
    },
    {
      n: "04",
      icon: Truck,
      title: t("about.tl4t", "Mise en Écrin & Expédition"),
      desc: t(
        "about.tl4d",
        "Scellage hermétique en sachets barrières protecteurs, puis expédition rapide et suivie jusqu'à votre domicile.",
      ),
      detail: "Fraîcheur intacte",
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* ============================================================ */}
      {/* 1. HERO ÉDITORIAL & TERROIR AFRICAIN                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1C120C] via-[#2A1A11] to-[#120A06] text-stone-100 py-20 sm:py-28 border-b border-gold/30">
        <CerealMotifBackground variant="hero" showLargeSheaf={true} className="opacity-20" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge Chapeau */}
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>{t("about.eyebrow", "Notre Histoire & Nos Terroirs")}</span>
            </div>
          </Reveal>

          {/* Grand Titre */}
          <Reveal delay={120}>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
              L'amour du grain,{" "}
              <span className="bg-gradient-to-r from-[#FDF0CD] via-[#E5BF5A] to-[#BF9024] bg-clip-text text-transparent">
                l'art du goût authentique
              </span>
            </h1>
          </Reveal>

          {/* Sous-titre descriptif */}
          <Reveal delay={240}>
            <p className="mt-5 text-base sm:text-lg text-stone-300 font-light leading-relaxed max-w-3xl mx-auto">
              {t(
                "about.heroDesc",
                "Nourrir sainement nos familles avec le meilleur des céréales d'ici, sans sable, sans conservateurs et sans perte de temps en cuisine.",
              )}
            </p>
          </Reveal>

          {/* 3 Garanties clés en pilules transparentes */}
          <Reveal delay={360}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-stone-200">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-4 py-2 shadow-xs">
                <Leaf className="h-4 w-4 text-gold" />
                <span>100% Naturel & Sans additifs</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-4 py-2 shadow-xs">
                <Clock className="h-4 w-4 text-gold" />
                <span>Précuit : prêt en 3 minutes</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-4 py-2 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span>Zéro sable garanti</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. AUX ORIGINES DU PROJET : NOUVELLE IMAGE & TEXTES ANIMÉS  */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Colonne Image Fondatrice avec effet vitrine de prestige */}
          <div className="lg:col-span-6">
            <Reveal direction="left" delay={50}>
              <div className="group relative overflow-hidden rounded-3xl border border-gold/35 bg-card shadow-2xl transition-all duration-500 hover:border-gold/60">
                <div className="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full overflow-hidden bg-stone-900">
                  <img
                    src={founderImage}
                    alt="DOSSOU Lucette - Fondatrice et CEO de Cereals House"
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Voile dégradé doux pour le badge inférieur */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                {/* Badge flottant en haut à droite */}
                <div className="absolute top-4 right-4 rounded-full border border-gold/40 bg-black/75 px-3.5 py-1 text-xs font-semibold text-gold backdrop-blur-md shadow-md">
                  Fondatrice & CEO
                </div>

                {/* Encart descriptif inférieur translucide */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/15 bg-black/70 p-4 backdrop-blur-md shadow-lg">
                  <div className="space-y-0.5">
                    <div className="text-sm text-white font-bold tracking-tight">
                      DOSSOU Lucette
                    </div>
                    <div className="text-xs text-stone-300 font-light">
                      Vision, Discipline & Goût du Terroir
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-bold text-gold uppercase tracking-wider">
                    Cereals House
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Colonne Textes avec apparitions échelonnées au scroll */}
          <div className="lg:col-span-6 space-y-6">
            {/* Ligne 1 : Chapeau */}
            <Reveal direction="right" delay={0}>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-2">
                <span className="h-px w-6 bg-gold" />
                L’histoire de DOSSOU Lucette
              </span>
            </Reveal>

            {/* Ligne 2 : Grand Titre */}
            <Reveal direction="right" delay={120}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary leading-tight">
                Une histoire personnelle : de la quête de confiance à la naissance de Cereal House
              </h2>
            </Reveal>

            {/* Ligne 3 : Premier paragraphe - Déclic personnel */}
            <Reveal direction="right" delay={220}>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                Je m’appelle <strong>DOSSOU Lucette</strong>, fondatrice de Cereal House. L’histoire de Cereal House est avant tout une histoire personnelle. À l’université, une période de stress m’a fait perdre énormément de poids. Malgré mes efforts, je n’arrivais pas à retrouver les kilogrammes perdus. C’est alors que ma mère m’a transmis une recette de céréales qui m’a permis de reprendre rapidement du poids et, surtout, de retrouver progressivement confiance en moi.
              </p>
            </Reveal>

            {/* Ligne 4 : Deuxième paragraphe - Lancement du projet */}
            <Reveal direction="right" delay={320}>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                Cette expérience a été le déclic. Je me suis demandé : <em>si cette recette a pu m’aider, pourquoi ne pourrait-elle pas aider d’autres personnes ?</em> C’est ainsi que j’ai commencé à développer Cereal House, avec l’envie d’accompagner celles et ceux qui souhaitent reprendre du poids après une période difficile, tout en valorisant la simplicité et l’authenticité de nos céréales.
              </p>
            </Reveal>

            {/* Ligne 4bis : Ambition & Diaspora */}
            <Reveal direction="right" delay={400}>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                Aujourd’hui, mon ambition va plus loin : faire découvrir et voyager nos céréales africaines, jusqu’à la diaspora, sans leur faire perdre leur âme.
              </p>
            </Reveal>

            {/* Ligne 5 : Chiffres Clés animés */}
            <Reveal direction="right" delay={480}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-border/80">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 text-center shadow-xs transition hover:border-gold/40"
                  >
                    <div className="font-display text-2xl sm:text-3xl font-bold text-gold">{s.value}</div>
                    <div className="mt-1 text-[11px] font-semibold text-primary">
                      {s.label}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{s.hint}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. NOS 4 ENGAGEMENTS QUALITÉ : CARTES INTERACTIVES ÉLÉGANTES  */}
      {/* ============================================================ */}
      <section className="border-y border-border/80 bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* En-tête de section */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Reveal delay={0}>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-2">
                <span className="h-px w-4 bg-gold" />
                {t("about.commitmentsEyebrow", "Nos Engagements Inaltérables")}
                <span className="h-px w-4 bg-gold" />
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
                {t("about.commitmentsTitle", "Ce qui fait la différence Cereals House")}
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  "about.commitmentsDesc",
                  "Chaque paquet de farine et chaque bocal de céréales répond à un cahier des charges d'excellence sans compromis.",
                )}
              </p>
            </Reveal>
          </div>

          {/* Grille de 4 cartes animées */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, idx) => (
              <Reveal key={v.title} delay={idx * 90}>
                <div className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/25 transition-transform duration-300 group-hover:scale-110">
                        <v.icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                        {v.tag}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-primary transition-colors duration-200 group-hover:text-gold">
                      {v.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                    <span>Contrôle qualité certifié</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. LE CHEMIN DU GRAIN : 4 ÉTAPES NUMÉROTÉES                   */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Reveal delay={0}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold inline-flex items-center gap-2">
              <span className="h-px w-4 bg-gold" />
              {t("about.timelineEyebrow", "De la Terre à l'Assiette")}
              <span className="h-px w-4 bg-gold" />
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
              {t("about.timelineTitle", "L'Itinéraire d'un Grain d'Excellence")}
            </h2>
          </Reveal>
          <Reveal delay={180}>
            <p className="mt-3 text-sm text-muted-foreground">
              Un savoir-faire artisanal combiné à des technologies modernes de nettoyage et de mouture.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {timeline.map((step, idx) => (
            <Reveal key={step.n} delay={idx * 100}>
              <div className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:border-gold/50 hover:shadow-lg h-full group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 font-display text-lg font-bold text-gold border border-gold/30">
                      {step.n}
                    </span>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/80 text-primary border border-border/80">
                      <step.icon className="h-5 w-5 text-gold" />
                    </div>
                  </div>
                  <h3 className="font-display text-base font-bold text-primary group-hover:text-gold transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-medium text-gold">{step.detail}</span>
                  <Check className="h-3.5 w-3.5 text-gold" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. MANIFESTE & PAROLE DE LA FONDATRICE                        */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal delay={100}>
          <div className="relative overflow-hidden rounded-3xl border border-gold/35 bg-card/60 backdrop-blur-md p-8 sm:p-12 shadow-xl">
            <Quote className="h-12 w-12 text-gold/25 absolute -top-2 -left-2" />
            <div className="relative z-10 text-center max-w-3xl mx-auto space-y-5">
              <div className="mx-auto h-20 w-20 rounded-full border-2 border-gold/50 p-1 shadow-lg shadow-gold/10">
                <img
                  src={founderImage}
                  alt="DOSSOU Lucette"
                  className="h-full w-full rounded-full object-cover object-top"
                />
              </div>
              <p className="font-display text-lg sm:text-xl md:text-2xl text-primary font-medium italic leading-relaxed">
                « Cereal House est née d’une recette de ma mère qui m’a aidée à me retrouver. Aujourd’hui, je veux à mon tour la partager avec le monde. »
              </p>
              <div className="pt-4 border-t border-border/60">
                <div className="font-display text-lg font-bold text-gold">DOSSOU Lucette</div>
                <div className="text-xs text-muted-foreground">Fondatrice & CEO de Cereal House</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============================================================ */}
      {/* 6. CALL TO ACTION FINAL B2B & BOUTIQUE                       */}
      {/* ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <GoldCtaBanner
            eyebrow="Cuisine saine & gourmande"
            title={t("about.ctaTitle", "Prêt(e) à redécouvrir le goût authentique du bon grain ?")}
            description={t(
              "about.ctaDesc",
              "Explorez notre sélection de farines et céréales du terroir et faites-vous livrer chez vous sous 24h à 48h.",
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
