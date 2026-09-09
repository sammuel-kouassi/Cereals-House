import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useCountry } from "@/lib/country-context";
import { Flag } from "@/components/flag";
import { useLanguageNavigation } from "@/lib/i18n-routing";

import heroLuxuryCereals from "@/assets/hero-luxury-cereals.jpg";
import heroNutritionPure from "@/assets/hero-nutrition-pure.jpg";
import heroPackagingNoble from "@/assets/hero-packaging-noble.jpg";

interface HeroSlide {
  id: string;
  tabLabel: string;
  eyebrow: string;
  titleLight: string;
  titleGold: string;
  description: string;
  image: string;
  features: string[];
  floatingBadge: string;
  ctaText: string;
  ctaLink: string;
}

export function HeroNarrativeBanner() {
  const { country } = useCountry();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const isHoveredRef = useRef(false);

  const slides: HeroSlide[] = [
    {
      id: "terroirs",
      tabLabel: t("hero.slide1.tab", "Céréales Ancestrales"),
      eyebrow: t("hero.slide1.eyebrow", "Terroirs d'Afrique de l'Ouest"),
      titleLight: t("hero.slide1.titleLight", "La Noblesse des"),
      titleGold: t("hero.slide1.titleGold", "Céréales Ancestrales"),
      description: t(
        "hero.slide1.description",
        "Mil perlé doré du Sahel, fonio royal et sorgho récoltés à la main par nos coopératives partenaires. Une pureté nutritionnelle intacte, 100% naturelle et sans additifs.",
      ),
      image: heroLuxuryCereals,
      features: [
        t("hero.slide1.feat1", "Grains nobles & Meule de pierre"),
        t("hero.slide1.feat2", "100% Naturel & Sans additifs"),
        t("hero.slide1.feat3", "Riche en fibres & minéraux"),
      ],
      floatingBadge: t("hero.slide1.badge", "🌾 Récolte Ancestrale & Pureté 100%"),
      ctaText: t("hero.slide1.cta", "Explorer la Récolte"),
      ctaLink: "/products",
    },
    {
      id: "nutrition",
      tabLabel: t("hero.slide2.tab", "Farines & Bouillies"),
      eyebrow: t("hero.slide2.eyebrow", "Nutrition & Éveil Familial"),
      titleLight: t("hero.slide2.titleLight", "L'Éveil Savoureux des"),
      titleGold: t("hero.slide2.titleGold", "Farines & Bouillies Pures"),
      description: t(
        "hero.slide2.description",
        "Farines d'éveil enrichies au Moringa bio et Baobab. Précuites à la vapeur douce pour une digestibilité optimale, riches en fer, calcium et zinc pour grandir sereinement.",
      ),
      image: heroNutritionPure,
      features: [
        t("hero.slide2.feat1", "Dès 6 mois & Mamans"),
        t("hero.slide2.feat2", "Enrichi Moringa & Baobab Bio"),
        t("hero.slide2.feat3", "Digestibilité douce & Précuite"),
      ],
      floatingBadge: t("hero.slide2.badge", "🥣 Farines d'Éveil · Qualité Nutrition"),
      ctaText: t("hero.slide2.cta", "Découvrir les Farines"),
      ctaLink: "/products",
    },
    {
      id: "ecrins",
      tabLabel: t("hero.slide3.tab", "Écrin & Fraîcheur"),
      eyebrow: t("hero.slide3.eyebrow", "Excellence & Livraison Express"),
      titleLight: t("hero.slide3.titleLight", "L'Art de l'Écrin Noble"),
      titleGold: t("hero.slide3.titleGold", "Chez Vous en 24h à 48h"),
      description: t(
        "hero.slide3.description",
        "Pots protecteurs et sachets hermétiques préservant chaque arôme et vitamine. Paiement instantané et sécurisé par Wave, Orange Money ou Carte bancaire.",
      ),
      image: heroPackagingNoble,
      features: [
        t("hero.slide3.feat1", "Scellage hermétique garanti"),
        t("hero.slide3.feat2", "Wave, Orange Money & CB"),
        t("hero.slide3.feat3", "Livraison suivie en direct"),
      ],
      floatingBadge: t("hero.slide3.badge", "✨ Fraîcheur Scellée & Expédition 24h"),
      ctaText: t("hero.slide3.cta", "Commander en Ligne"),
      ctaLink: "/products",
    },
  ];

  const current = slides[activeIdx];
  const DURATION_MS = 6000;

  useEffect(() => {
    const interval = 50;
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      if (isHoveredRef.current) return;
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIdx((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [slides.length]);

  const selectSlide = (index: number) => {
    setActiveIdx(index);
    setProgress(0);
  };

  return (
    <section
      className="relative overflow-hidden bg-[#120E0B] text-stone-100"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
      {/* Halo d'ambiance doré subtil en arrière-plan */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-gold/15 via-amber-600/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-amber-600/10 via-gold/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* Grille de texture très discrète */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4af37_0.6px,transparent_0.6px)] [background-size:28px_28px] opacity-[0.05]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 lg:pt-14 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* ============================================================ */}
          {/* COLONNE GAUCHE : Typographie & Puissance Éditoriale          */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-6">
            {/* Eyebrow de prestige avec micro-lueur */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-gold shrink-0 animate-pulse" />
              <span>{current.eyebrow}</span>
            </div>

            {/* Titre Principal Haute Typographie */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-[3.6rem] font-bold leading-[1.1] tracking-tight text-white">
              <span className="block drop-shadow-sm">{current.titleLight}</span>
              <span className="block bg-gradient-to-r from-[#FDF0CD] via-[#E5BF5A] to-[#BF9024] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(212,175,55,0.2)]">
                {current.titleGold}
              </span>
            </h1>

            {/* Descriptif fluide et concis */}
            <p className="max-w-xl text-base sm:text-lg text-stone-300 font-light leading-relaxed">
              {current.description}
            </p>

            {/* 3 micro-arguments clés épurés */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {current.features.map((feat) => (
                <div
                  key={feat}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-800 bg-stone-900/70 px-3 py-1 text-xs font-medium text-stone-300 backdrop-blur-sm"
                >
                  <Check className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Boutons d'Action Principaux */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to={getLocalizedPath(current.ctaLink)}
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-400 to-gold px-7 py-3.5 text-sm font-bold text-[#14110F] shadow-[0_10px_30px_-8px_rgba(212,175,55,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(212,175,55,0.85)] cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>{current.ctaText}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                to={getLocalizedPath("/about")}
                className="group inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/50 px-6 py-3.5 text-sm font-semibold text-stone-200 backdrop-blur-md transition-all duration-300 hover:border-gold/50 hover:text-gold hover:bg-stone-800/60"
              >
                <span>{t("hero.aboutLink", "Notre Histoire & Meunerie")}</span>
                <ChevronRight className="h-4 w-4 text-stone-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
              </Link>
            </div>

            {/* Ligne de Réassurance & Preuve Sociale Épurée */}
            <div className="pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <span className="font-medium text-stone-300">
                  <strong className="text-white">4.9/5</strong> · {t("hero.socialProof", "Plus de 1 200 familles comblées")}
                </span>
              </div>

              {country && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-900/90 border border-stone-800 px-3 py-1 text-stone-300 font-medium">
                  <Flag code={country.code} />
                  <span>{t("hero.shippingAvailableIn", "Livraison disponible en")} {country.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE DROITE : Showcase Photographique Aéré & Sans Surcharge*/}
          {/* ============================================================ */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Cadre de l'image principale avec liseré or doux */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-gold/25 bg-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700">
                {/* Images avec fondu croisé propre */}
                {slides.map((s, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <div
                      key={s.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={s.image}
                        alt={s.titleLight + " " + s.titleGold}
                        className={`h-full w-full object-cover object-center transition-transform duration-[7000ms] ease-out ${
                          isActive ? "scale-105" : "scale-100"
                        }`}
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                      {/* Dégradé léger en bas pour la lisibilité de la pastille */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#120E0B]/85 via-transparent to-transparent" />
                    </div>
                  );
                })}

                {/* Une seule pastille d'élégance flottante en bas à gauche */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl shadow-xl">
                  <div className="text-xs font-semibold text-white tracking-wide">
                    {current.floatingBadge}
                  </div>
                  <Link
                    to={getLocalizedPath("/products")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:text-amber-300 transition-colors"
                  >
                    {t("nav.shop", "Boutique")} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Indicateurs de diaporama épurés et fluides sous l'image */}
              <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
                {slides.map((s, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSlide(idx)}
                      className={`group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-gold/15 border border-gold/40 text-gold shadow-sm"
                          : "bg-stone-900/60 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
                      }`}
                    >
                      {/* Point indicateur avec progression */}
                      <span className="relative flex h-2 w-2">
                        {isActive && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                        )}
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${
                            isActive ? "bg-gold" : "bg-stone-600 group-hover:bg-stone-400"
                          }`}
                        />
                      </span>
                      <span>{s.tabLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
