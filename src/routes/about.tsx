import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/reveal";
import storyImage from "@/assets/hero-cereals.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Cereals House" },
      {
        name: "description",
        content:
          "Découvrez Cereals House : notre mission, nos producteurs partenaires et notre engagement pour des céréales africaines d'exception.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  const values = [
    { icon: Leaf, t: t("about.v1t"), d: t("about.v1d") },
    { icon: Heart, t: t("about.v2t"), d: t("about.v2d") },
    { icon: Globe, t: t("about.v3t"), d: t("about.v3d") },
    { icon: Award, t: t("about.v4t"), d: t("about.v4d") },
  ];

  const stats = [
    { value: t("about.stat1Value"), label: t("about.stat1Label") },
    { value: t("about.stat2Value"), label: t("about.stat2Label") },
    { value: t("about.stat3Value"), label: t("about.stat3Label") },
  ];

  const timeline = [
    { icon: Sprout, t: t("about.tl1t"), d: t("about.tl1d") },
    { icon: ShieldCheck, t: t("about.tl2t"), d: t("about.tl2d") },
    { icon: PackageCheck, t: t("about.tl3t"), d: t("about.tl3d") },
    { icon: Truck, t: t("about.tl4t"), d: t("about.tl4d") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
            <span className="h-px w-5 bg-gold" /> {t("about.eyebrow")}{" "}
            <span className="h-px w-5 bg-gold" />
          </span>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-2 font-display text-5xl font-bold text-primary">{t("about.title")}</h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("about.intro")}</p>
        </Reveal>
      </section>

      {/* Histoire + chiffres clés */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="left">
            <div className="group relative overflow-hidden rounded-3xl border border-border shadow-soft">
              <img
                src={storyImage}
                alt="Récolte de céréales en Afrique de l'Ouest"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
            </div>
          </Reveal>

          <Reveal direction="right" delay={100}>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              {t("about.storyEyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
              {t("about.storyTitle")}
            </h2>
            <p className="mt-5 leading-relaxed text-foreground/85">{t("about.storyP1")}</p>
            <p className="mt-4 leading-relaxed text-foreground/85">{t("about.storyP2")}</p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-3xl font-bold text-gold">{s.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Valeurs */}
      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {values.map((v, idx) => (
            <Reveal key={v.t} delay={idx * 100}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-gold">
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-primary transition-colors duration-300 group-hover:text-gold">
                  {v.t}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Parcours : du champ à la table */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              {t("about.timelineEyebrow")}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
              {t("about.timelineTitle")}
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ligne de connexion, visible en desktop uniquement — souligne la continuité du parcours */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block" />
          {timeline.map((step, idx) => (
            <Reveal key={step.t} delay={idx * 100}>
              <div className="group relative flex flex-col items-center text-center">
                <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/30 bg-background text-gold shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold group-hover:bg-gold group-hover:text-gold-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-primary">{step.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("about.ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">{t("about.ctaDesc")}</p>
            <Link
              to="/products"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
            >
              {t("about.ctaBtn")}{" "}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
