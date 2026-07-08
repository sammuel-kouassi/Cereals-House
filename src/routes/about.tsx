import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Heart, Globe, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Cereals House" },
      { name: "description", content: "Découvrez Cereals House : notre mission, nos producteurs partenaires et notre engagement pour des céréales africaines d'exception." },
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

  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <span
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold motion-safe:animate-[fade-in_0.6s_ease-out_both]"
        >
          <span className="h-px w-5 bg-gold" /> {t("about.eyebrow")} <span className="h-px w-5 bg-gold" />
        </span>
        <h1
          className="mt-2 font-display text-5xl font-bold text-primary motion-safe:animate-[fade-in_0.7s_ease-out_both]"
          style={{ animationDelay: "100ms" }}
        >
          {t("about.title")}
        </h1>
        <p
          className="mt-6 text-lg leading-relaxed text-muted-foreground motion-safe:animate-[fade-in_0.7s_ease-out_both]"
          style={{ animationDelay: "200ms" }}
        >
          {t("about.intro")}
        </p>
      </section>

      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {values.map((v, idx) => (
            <div
              key={v.t}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-gold motion-safe:animate-[fade-in_0.6s_ease-out_both]"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-primary transition-colors duration-300 group-hover:text-gold">
                {v.t}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}