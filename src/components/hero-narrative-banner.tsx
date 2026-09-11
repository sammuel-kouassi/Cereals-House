import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useLanguageNavigation } from "@/lib/i18n-routing";

import heroLuxuryCereals from "@/assets/hero-luxury-cereals.jpg";
import heroNutritionPure from "@/assets/hero-nutrition-pure.jpg";
import heroPackagingNoble from "@/assets/hero-packaging-noble.jpg";
import heroDistributionMap from "@/assets/hero-distribution-map.jpg";
import heroArtisanalTerroir from "@/assets/hero-artisanal-terroir.jpg";

interface SlideData {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export function HeroNarrativeBanner() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const isHoveredRef = useRef(false);

  const slides: SlideData[] = [
    {
      id: "ancestral",
      eyebrow: t("hero.slide1.eyebrow", "Terroirs d'Afrique de l'Ouest"),
      title: `${t("hero.slide1.titleLight", "La Noblesse des")} ${t("hero.slide1.titleGold", "Céréales Ancestrales")}`,
      subtitle: t(
        "hero.slide1.description",
        "Mil perlé doré du Sahel, fonio royal et sorgho récoltés à la main par nos coopératives partenaires. Une pureté nutritionnelle 100% naturelle.",
      ),
      image: heroLuxuryCereals,
      ctaText: t("hero.slide1.cta", "Découvrir la Boutique"),
      ctaLink: "/products",
    },
    {
      id: "nutrition",
      eyebrow: t("hero.slide2.eyebrow", "Nutrition & Éveil Familial"),
      title: `${t("hero.slide2.titleLight", "L'Éveil Savoureux des")} ${t("hero.slide2.titleGold", "Farines & Bouillies Pures")}`,
      subtitle: t(
        "hero.slide2.description",
        "Farines d'éveil enrichies au Moringa bio et Baobab. Précuites à la vapeur douce pour une digestibilité optimale pour les tout-petits et toute la famille.",
      ),
      image: heroNutritionPure,
      ctaText: "Explorer les Farines",
      ctaLink: "/products",
    },
    {
      id: "distribution-map",
      eyebrow: t("hero.slideMap.eyebrow", "Réseau de Vente & Expédition"),
      title: t("hero.slideMap.title", "Nos Terroirs & Pays de Distribution"),
      subtitle: t(
        "hero.slideMap.description",
        "Disponibles et expédiés en Côte d'Ivoire, Sénégal, Mali, Burkina Faso, Togo, Bénin et à l'international. Suivi en direct et expédition express sous 24h à 48h.",
      ),
      image: heroDistributionMap,
      ctaText: t("hero.slideMap.cta", "Commander dans mon pays"),
      ctaLink: "/products",
    },
    {
      id: "packaging",
      eyebrow: t("hero.slide3.eyebrow", "Excellence & Livraison Express"),
      title: `${t("hero.slide3.titleLight", "L'Art de l'Écrin Noble")} ${t("hero.slide3.titleGold", "Chez Vous")}`,
      subtitle: t(
        "hero.slide3.description",
        "Pots protecteurs et sachets hermétiques préservant chaque arôme et vitamine. Paiement instantané et livraison suivie en 24h à 48h.",
      ),
      image: heroPackagingNoble,
      ctaText: "Commander en Ligne",
      ctaLink: "/products",
    },
    {
      id: "artisanal",
      eyebrow: "Savoir-Faire Ancestral",
      title: "L'Héritage Artisanal de nos Terroirs",
      subtitle:
        "Mouture douce sur meule de pierre et tri méticuleux grain par grain. Le respect absolu de la terre africaine et de ses richesses nutritives.",
      image: heroArtisanalTerroir,
      ctaText: "Notre Histoire",
      ctaLink: "/about",
    },
  ];

  const current = slides[activeIdx];
  const DURATION_MS = 6000;

  // Défilement automatique fluide avec indicateur de progression
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

  const nextSlide = () => {
    setActiveIdx((curr) => (curr + 1) % slides.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setActiveIdx((curr) => (curr - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const goToSlide = (idx: number) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  // Calcul pour le cercle de progression SVG
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section
      className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] overflow-hidden bg-stone-950 text-white flex items-center"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
      {/* 1. Arrière-plan panoramique avec 5 images en fondu croisé fluide */}
      {slides.map((slide, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className={`h-full w-full object-cover object-center transition-transform duration-[7000ms] ease-out ${
                isActive ? "scale-105" : "scale-100"
              }`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          </div>
        );
      })}

      {/* 2. Filtres & Dégradés cinématographiques pour faire ressortir la typographie blanche */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 sm:via-black/35 to-transparent z-[1]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 z-[1]"
        aria-hidden="true"
      />

      {/* 3. Contenu Éditorial Inspiré du Design de Référence */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-16 sm:py-24 flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[720px]">
        {/* Contenu textuel sur la gauche */}
        <div className="my-auto max-w-xl sm:max-w-2xl pt-4 sm:pt-8">
          {/* Surtitre discret en or */}
          <div className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-3 sm:mb-4">
            {current.eyebrow}
          </div>

          {/* Titre Principal Haute Typographie Éditoriale */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-4 sm:mb-5 drop-shadow-md">
            {current.title}
          </h1>

          {/* Description épurée (sans puces/arguments) */}
          <p className="text-sm sm:text-base lg:text-lg text-white/85 font-light leading-relaxed max-w-lg mb-8 drop-shadow-sm">
            {current.subtitle}
          </p>

          {/* Boutons sur la section : 100% Transparents avec effet verre dépoli */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to={getLocalizedPath(current.ctaLink)}
              className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-white/80 bg-white/15 backdrop-blur-md px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-white/30 hover:border-white hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              to={getLocalizedPath("/about")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-black/25 backdrop-blur-md px-7 py-3.5 text-sm sm:text-base font-medium text-white/90 transition-all duration-300 hover:bg-white/15 hover:border-white/70 hover:scale-105 cursor-pointer"
            >
              <span>{t("hero.aboutLink", "Notre Histoire")}</span>
            </Link>
          </div>
        </div>

        {/* 4. Barre Inférieure : Indicateurs & Contrôles à droite (comme sur la référence) */}
        <div className="w-full flex items-center justify-between pt-8 border-t border-white/10 mt-auto">
          {/* Puces d'onglets miniatures à gauche */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIdx ? "w-8 bg-[#D4AF37]" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Bloc de contrôle circulaire à droite : Compteur avec anneau + Boutons Flèches */}
          <div className="flex items-center gap-3">
            {/* Anneau de progression circulaire avec numéro de slide */}
            <div className="relative flex items-center justify-center h-11 w-11 select-none">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  className="text-white/20"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={radius}
                  className="text-[#D4AF37] transition-all duration-75"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-white">
                0{activeIdx + 1}
              </span>
            </div>

            {/* Boutons Flèches Circulaires Transparents */}
            <button
              type="button"
              onClick={prevSlide}
              className="h-11 w-11 rounded-full border border-white/40 bg-black/35 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              title="Image précédente"
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="h-11 w-11 rounded-full border border-white/40 bg-black/35 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              title="Image suivante"
              aria-label="Image suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
