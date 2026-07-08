import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Leaf, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { Flag } from "@/components/flag";
import { useCountry } from "@/lib/country-context";
import heroVideo from "@/assets/ch.mp4";
import heroImage from "@/assets/hero-millet.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cereals House — Céréales africaines premium livrées chez vous" },
      {
        name: "description",
        content:
          "Cereals House : riz parfumé, mil, fonio, maïs et plus. Commande en ligne, paiement Mobile Money/Visa, livraison rapide en Afrique de l'Ouest, France et USA.",
      },
    ],
  }),
  component: HomePage,
});

/** Anime son contenu en fondu/translation dès qu'il entre dans le viewport (une seule fois). Purement décoratif. */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function HomePage() {
  const { country } = useCountry();
  const { t } = useTranslation();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, short_description, category, unit, is_featured, audiences, product_prices(country_code, price)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("name");
      return data ?? [];
    },
  });

  const steps = [
    { n: "01", t: t("home.step1Title"), d: t("home.step1Desc") },
    { n: "02", t: t("home.step2Title"), d: t("home.step2Desc") },
    { n: "03", t: t("home.step3Title"), d: t("home.step3Desc") },
    { n: "04", t: t("home.step4Title"), d: t("home.step4Desc") },
  ];

  const trust = [
    { icon: Leaf, title: t("home.trust.quality"), text: t("home.trust.qualityText") },
    { icon: Truck, title: t("home.trust.delivery"), text: t("home.trust.deliveryText") },
    { icon: CreditCard, title: t("home.trust.payment"), text: t("home.trust.paymentText") },
    { icon: ShieldCheck, title: t("home.trust.secure"), text: t("home.trust.secureText") },
  ];

  return (
    <div>
      {/* Animations décoratives : zoom lent du fond vidéo + rebond de l'indicateur de scroll */}
      <style>{`
        @keyframes hero-kenburns {
          0%   { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes hero-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50%      { transform: translateY(6px); opacity: 1; }
        }
      `}</style>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <video
            src={heroVideo}
            poster={heroImage}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover motion-safe:[animation:hero-kenburns_22s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
          {/* Vignette subtile pour un rendu plus cinématographique */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8 lg:py-40">
          <div className="text-primary-foreground">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold backdrop-blur motion-safe:animate-[fade-in_0.7s_ease-out_both]"
              style={{ animationDelay: "0ms" }}
            >
              <Leaf className="h-3.5 w-3.5" /> {t("home.badge")}
            </span>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              <span
                className="block motion-safe:animate-[fade-in_0.8s_ease-out_both]"
                style={{ animationDelay: "120ms" }}
              >
                {t("home.heroTitle1")}
              </span>
              <span
                className="block motion-safe:animate-[fade-in_0.8s_ease-out_both]"
                style={{ animationDelay: "240ms" }}
              >
                {t("home.heroTitle2")}{" "}
                <span className="text-gradient-gold [text-shadow:0_0_36px_rgba(212,175,55,0.35)]">
                  {t("home.heroTitle3")}
                </span>
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl text-lg text-primary-foreground/85 motion-safe:animate-[fade-in_0.8s_ease-out_both]"
              style={{ animationDelay: "360ms" }}
            >
              {t("home.heroDescStart")}{" "}
              {country ? (
                <span className="inline-flex items-center gap-1.5 align-middle">
                  (<Flag code={country.code} /> {country.name})
                </span>
              ) : null}{" "}
              {t("home.heroDescEnd")}
            </p>

            <div
              className="mt-9 flex flex-wrap gap-3 motion-safe:animate-[fade-in_0.8s_ease-out_both]"
              style={{ animationDelay: "480ms" }}
            >
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
              >
                {t("home.ctaShop")} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary-foreground/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:border-gold hover:text-gold"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gold/10 transition-transform duration-500 ease-out group-hover:translate-x-0" />
                <span className="relative">{t("home.ctaStory")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Indicateur de défilement, décoratif */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center sm:flex">
          <ChevronDown className="h-6 w-6 text-primary-foreground/70 motion-safe:[animation:hero-bounce_2s_ease-in-out_infinite]" />
        </div>
      </section>

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

      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        {/* Halo doré décoratif en fond, très discret */}
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />

        <Reveal>
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                <span className="h-px w-5 bg-gold" /> {t("home.featuredEyebrow")}
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">{t("home.featuredTitle")}</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">{t("home.featuredDesc")}</p>
            </div>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors duration-300 hover:text-gold/80"
            >
              {t("home.seeAll")}{" "}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="relative mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, idx) => (
            <Reveal key={p.id} delay={idx * 80} className="h-full">
              <div className="h-full transition-transform duration-300 hover:-translate-y-1">
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  shortDescription={p.short_description}
                  category={p.category}
                  unit={p.unit}
                  audiences={(p as unknown as { audiences?: string[] | null }).audiences}
                  prices={p.product_prices ?? []}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">{t("home.stepsEyebrow")}</span>
              <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("home.stepsTitle")}</h2>
            </div>
          </Reveal>

          <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Ligne de connexion entre les étapes, visible en desktop uniquement — souligne l'ordre du parcours */}
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
                  <p className="mt-3 text-sm text-primary-foreground/75">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}