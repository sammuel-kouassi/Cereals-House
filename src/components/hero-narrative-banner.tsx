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
        "Farines complètes prêtes en quelques minutes pour toute la famille (âge et utilisation précisés sur chaque produit). Une onctuosité authentique pour bien démarrer la journée.",
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
        "100% naturel, sans additifs chimiques ni conservateurs. Une mouture soigneuse qui préserve au mieux les qualités naturelles des céréales.",
      ),
      image: heroCerealesMixtesSingle,
      ctaText: t("heroNarrative.slide4.cta", "Voir nos farines"),
      ctaLink: "/products",
    },
    {
      id: "maison-cereales",
      eyebrow: t("heroNarrative.slide5.eyebrow", "Épicerie Fine & Boutique"),
      titleLine1: t("heroNarrative.slide5.titleLine1", "MAISON CÉRÉALES"),
      titleLine2: t("heroNarrative.slide5.titleLine2", "L'EXCELLENCE BIO"),
      subtitle: t(
        "heroNarrative.slide5.subtitle",
        "Du grain sélectionné jusqu'au conditionnement hermétique. Découvrez notre univers et profitez de produits préparés avec soin.",
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
      className="relative w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[590px] overflow-hidden bg-[#18110B] text-white flex items-center"
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
            {/* Image nette intégrée sans cadre ni bordure */}
            <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/5 lg:w-3/5 h-full flex items-center justify-end overflow-hidden">
              <img
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                className={`h-full w-full object-cover object-center lg:object-right transition-transform duration-[7000ms] ease-out select-none ${
                  isActive ? "scale-[1.03]" : "scale-100"
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
          {/* Titre : capitales romaines, graisse normale — sobre et lisible */}
          <h1 className="font-display text-[1.9rem] font-normal uppercase leading-[1.08] tracking-[0.01em] text-stone-50 sm:text-4xl md:text-[2.6rem] lg:text-[3.1rem]">
            <span className="block">{current.titleLine1}</span>
            <span className="mt-1 block text-gold">{current.titleLine2}</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-300 sm:text-base">
            {current.subtitle}
          </p>

          {/* Boutons d'action compacts & équilibrés */}
          <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-5">
            <Link
              to={getLocalizedPath(current.ctaLink)}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm text-stone-950 transition-colors duration-300 hover:bg-[#d8b25f] cursor-pointer"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            <Link
              to={getLocalizedPath("/products")}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-1 text-sm text-stone-200 underline decoration-stone-200/30 underline-offset-4 transition-colors duration-200 hover:decoration-stone-200 cursor-pointer"
            >
              <span>{t("heroNarrative.viewShop", "Voir la boutique")}</span>
              </Link>
          </div>

          {/* 4. RANGÉE DE VIGNETTES PRODUITS COMPACTES ET ÉLÉGANTES */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {slides.map((slide, idx) => {
                const isThumbActive = idx === activeIdx;
                return (
                  <div key={slide.id} className="relative flex flex-col items-center shrink-0">
                    {/* Miniature compacte & chic */}
                    <button
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`relative h-11 w-11 sm:h-12 sm:w-12 rounded-md overflow-hidden cursor-pointer transition-opacity duration-300 ${
                        isThumbActive
                          ? "opacity-100 outline outline-1 outline-offset-2 outline-gold"
                          : "opacity-45 hover:opacity-80"
                      }`}
                      title={`${slide.titleLine1} - ${slide.titleLine2}`}
                      aria-label={`Afficher ${slide.titleLine1}`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.titleLine1}
                        className="h-full w-full object-cover"
                      />
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
            className="h-10 w-10 rounded-full border border-stone-50/25 text-stone-100 flex items-center justify-center transition-colors duration-200 hover:border-stone-50/70 cursor-pointer"
            title="Précédent"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="h-10 w-10 rounded-full border border-stone-50/25 text-stone-100 flex items-center justify-center transition-colors duration-200 hover:border-stone-50/70 cursor-pointer"
            title="Suivant"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {isPaused && (
            <span className="inline-flex items-center gap-1.5 px-2 text-xs italic text-stone-400">
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

