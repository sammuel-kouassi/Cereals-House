import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { useLanguageNavigation } from "@/lib/i18n-routing";

import heroCurvesBoost from "@/assets/hero_curves_boost.jpg";
import heroCerealesMixtesPack from "@/assets/hero_cereales_mixtes_pack.jpg";
import heroGariPremium from "@/assets/hero_gari_premium.jpg";
import heroCerealesMixtesSingle from "@/assets/hero_cereales_mixtes_single.jpg";
import heroMaisonCerealesBoutique from "@/assets/hero_maison_cereales_boutique.jpg";

interface SlideData {
  id: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
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
  const [isPaused, setIsPaused] = useState(false);

  const slides: SlideData[] = [
    {
      id: "curves-boost",
      eyebrow: t("heroNarrative.slide1.eyebrow", "100% Bio & Terroirs Nobles"),
      titleLine1: t("heroNarrative.slide1.titleLine1", "CURVES BOOST"),
      titleLine2: t("heroNarrative.slide1.titleLine2", "ÉNERGIE & RONDEURS"),
      subtitle: t(
        "heroNarrative.slide1.subtitle",
        "Mélange nutritif bio à base de maïs, soja torréfié et flocons d'avoine. Riche en protéines végétales pour soutenir la vitalité quotidienne et les rondeurs harmonieuses.",
      ),
      image: heroCurvesBoost,
      ctaText: t("heroNarrative.slide1.cta", "Commander Curves Boost"),
      ctaLink: "/products",
    },
    {
      id: "cereales-mixtes-pack",
      eyebrow: t("heroNarrative.slide2.eyebrow", "Nutrition Familiale Complète"),
      titleLine1: t("heroNarrative.slide2.titleLine1", "CÉRÉALES MIXTES"),
      titleLine2: t("heroNarrative.slide2.titleLine2", "LE PACK VITALITÉ"),
      subtitle: t(
        "heroNarrative.slide2.subtitle",
        "Farines complètes prêtes en 3 minutes pour bébés dès 6 mois, enfants et adultes. Une onctuosité authentique et parfumée pour bien démarrer chaque journée.",
      ),
      image: heroCerealesMixtesPack,
      ctaText: t("heroNarrative.slide2.cta", "Commander en pack"),
      ctaLink: "/products",
    },
    {
      id: "gari-benin",
      eyebrow: t("heroNarrative.slide3.eyebrow", "Terroir Béninois d'Origine"),
      titleLine1: t("heroNarrative.slide3.titleLine1", "GARI DU BÉNIN"),
      titleLine2: t("heroNarrative.slide3.titleLine2", "CROUSTILLANT & PUR"),
      subtitle: t(
        "heroNarrative.slide3.subtitle",
        "Manioc noble rigoureusement sélectionné et torréfié selon la pure tradition. Délicieux délayé avec du lait frais, un soupçon de sucre et des arachides grillées.",
      ),
      image: heroGariPremium,
      ctaText: t("heroNarrative.slide3.cta", "Découvrir le Gari"),
      ctaLink: "/products",
    },
    {
      id: "cereales-mixtes-single",
      eyebrow: t("heroNarrative.slide4.eyebrow", "Farines Sahéliennes Pures"),
      titleLine1: t("heroNarrative.slide4.titleLine1", "FARINES COMPLÈTES"),
      titleLine2: t("heroNarrative.slide4.titleLine2", "PRÊTES EN 3 MINUTES"),
      subtitle: t(
        "heroNarrative.slide4.subtitle",
        "100% naturel, sans additifs chimiques ni conservateurs. Une mouture douce qui préserve toutes les vitamines, le fer et les minéraux essentiels.",
      ),
      image: heroCerealesMixtesSingle,
      ctaText: t("heroNarrative.slide4.cta", "Voir nos farines"),
      ctaLink: "/products",
    },
    {
      id: "maison-cereales",
      eyebrow: t("heroNarrative.slide5.eyebrow", "Épicerie Meunière & Boutique"),
      titleLine1: t("heroNarrative.slide5.titleLine1", "MAISON CÉRÉALES"),
      titleLine2: t("heroNarrative.slide5.titleLine2", "L'EXCELLENCE BIO"),
      subtitle: t(
        "heroNarrative.slide5.subtitle",
        "Du grain brut sélectionné jusqu'au conditionnement hermétique d'excellence. Visitez notre univers meunier et profitez d'une fraîcheur garantie.",
      ),
      image: heroMaisonCerealesBoutique,
      ctaText: t("heroNarrative.slide5.cta", "Explorer la boutique"),
      ctaLink: "/products",
    },
  ];

  const current = slides[activeIdx];
  const DURATION_MS = 6000;

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIdx((curr) => (curr + 1) % slides.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

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

  return (
    <section
      className="relative w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[590px] overflow-hidden bg-gradient-to-b from-[#18110B] via-[#1E150E] to-[#160F0A] text-white flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. VISUEL HERO À DROITE SANS AUCUNE FRONTIÈRE NI BORDURE */}
      {slides.map((slide, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
              isActive ? "opacity-100 z-0" : "opacity-0 z-[-1]"
            }`}
          >
            {/* Lueur chaude dorée et réconfortante derrière le produit */}
            <div className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[300px] sm:w-[440px] h-[300px] sm:h-[440px] rounded-full bg-gradient-to-tr from-[#D97706]/20 via-[#F59E0B]/15 to-transparent blur-[90px] pointer-events-none" />

            {/* Image nette intégrée sans cadre ni bordure */}
            <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/5 lg:w-3/5 h-full flex items-center justify-end overflow-hidden">
              <img
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                className={`h-full w-full object-cover object-center lg:object-right transition-transform duration-[7000ms] ease-out select-none ${
                  isActive ? "scale-105" : "scale-100"
                }`}
                style={{
                  maskImage:
                    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.85) 45%, black 75%)",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.85) 45%, black 75%)",
                }}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          </div>
        );
      })}

      {/* 2. DÉGRADÉS DE TRANSITION CHAUDS TERROIR & CACAO NOBLE */}
      {/* Fondu latéral gauche chaud et gourmand */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-3/4 lg:w-3/5 bg-gradient-to-r from-[#18110B] via-[#18110B]/90 to-transparent z-[1]"
        aria-hidden="true"
      />
      {/* Fondu vertical haut et bas */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20 sm:h-28 bg-gradient-to-b from-[#18110B] to-transparent z-[1]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-[#18110B] via-[#18110B]/85 to-transparent z-[1]"
        aria-hidden="true"
      />

      {/* 3. CONTENU PRINCIPAL & TYPOGRAPHIE ÉLÉGANTE */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-5 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 flex flex-col justify-between min-h-[460px] sm:min-h-[510px] lg:min-h-[560px] pointer-events-none">
        {/* Colonne Gauche : Surtitre, Titre, Description, Actions */}
        <div className="my-auto max-w-xl lg:max-w-xl pointer-events-auto">
          {/* Surtitre accentué en or ambré chaud */}
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#F59E0B] font-bold mb-2 sm:mb-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
            <span>{current.eyebrow}</span>
          </div>

          {/* Titre Principal proportionné et net */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-black uppercase tracking-tight text-white leading-[1.08] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
            <span className="block">{current.titleLine1}</span>
            <span className="block text-amber-100/95 mt-1">{current.titleLine2}</span>
          </h1>

          {/* Description claire et chaleureuse */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-stone-200/90 font-normal leading-relaxed max-w-md drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
            {current.subtitle}
          </p>

          {/* Boutons d'action compacts & équilibrés */}
          <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-5">
            <Link
              to={getLocalizedPath(current.ctaLink)}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(217,119,6,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              to={getLocalizedPath("/products")}
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-300 hover:text-amber-200 transition-colors duration-200 cursor-pointer py-2.5 px-2 hover:translate-x-1"
            >
              <span>{t("heroNarrative.viewShop", "Voir la boutique")}</span>
              <span className="text-xs">→</span>
            </Link>
          </div>

          {/* 4. RANGÉE DE VIGNETTES PRODUITS COMPACTES ET ÉLÉGANTES */}
          <div className="mt-6 sm:mt-8 pt-1">
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {slides.map((slide, idx) => {
                const isThumbActive = idx === activeIdx;
                return (
                  <div key={slide.id} className="relative flex flex-col items-center shrink-0">
                    {/* Indicateur triangulaire fin */}
                    <div
                      className={`w-0 h-0 border-x-[4px] border-x-transparent border-t-[5px] border-t-[#F59E0B] mb-1 transition-all duration-300 ${
                        isThumbActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
                      }`}
                    />

                    {/* Miniature compacte & chic */}
                    <button
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`relative h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 focus:outline-none ${
                        isThumbActive
                          ? "border-2 border-[#F59E0B] ring-2 ring-[#F59E0B]/30 scale-105 shadow-lg"
                          : "border border-amber-200/20 opacity-60 hover:opacity-95 hover:border-amber-400/50 hover:scale-102"
                      }`}
                      title={`${slide.titleLine1} - ${slide.titleLine2}`}
                      aria-label={`Afficher ${slide.titleLine1}`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.titleLine1}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#160F0A]/60 to-transparent" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. CONTRÔLES DISCRETS EN BAS À DROITE (Flèches & Pause) */}
        <div className="hidden sm:flex items-center justify-end gap-2.5 mt-auto pt-4 pointer-events-auto">
          <button
            type="button"
            onClick={prevSlide}
            className="h-10 w-10 rounded-full border border-amber-500/30 bg-[#251810]/70 backdrop-blur-md text-amber-100 flex items-center justify-center transition-all duration-200 hover:bg-[#F59E0B] hover:text-stone-950 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Précédent"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="h-10 w-10 rounded-full border border-amber-500/30 bg-[#251810]/70 backdrop-blur-md text-amber-100 flex items-center justify-center transition-all duration-200 hover:bg-[#F59E0B] hover:text-stone-950 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Suivant"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {isPaused && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#251810]/80 border border-amber-500/30 text-[11px] text-amber-300 backdrop-blur-md">
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

