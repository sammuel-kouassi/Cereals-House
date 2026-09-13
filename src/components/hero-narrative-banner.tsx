import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ArrowRight, Pause } from "lucide-react";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { InteractiveDistributionMap } from "@/components/interactive-distribution-map";

import heroCurvesBoost from "@/assets/hero_curves_boost.jpg";
import heroCerealesMixtesPack from "@/assets/hero_cereales_mixtes_pack.jpg";
import heroGariPremium from "@/assets/hero_gari_premium.jpg";
import heroCerealesMixtesSingle from "@/assets/hero_cereales_mixtes_single.jpg";
import heroMaisonCerealesBoutique from "@/assets/hero_maison_cereales_boutique.jpg";

interface SlideData {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image?: string;
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
      eyebrow: "Formule Premium & 100% Bio",
      title: "Curves Boost Énergie, Force & Rondeurs",
      subtitle:
        "Mélange nutritif bio à base de maïs, soja et flocons d'avoine. Riche en protéines végétales pures pour soutenir la vitalité, les rondeurs naturelles et le développement musculaire des sportifs.",
      image: heroCurvesBoost,
      ctaText: "Découvrir Curves Boost",
      ctaLink: "/products",
    },
    {
      id: "cereales-mixtes-pack",
      eyebrow: "Pack Nutrition Familiale",
      title: "Céréales Mixtes Le Plein de Vitalité au Quotidien",
      subtitle:
        "Farines complètes prêtes en quelques minutes pour bébés dès 6 mois, enfants et adultes. Une texture onctueuse et gourmande pour bien démarrer la journée.",
      image: heroCerealesMixtesPack,
      ctaText: "Commander en pack",
      ctaLink: "/products",
    },
    {
      id: "gari-benin",
      eyebrow: "Terroir Béninois Authentique",
      title: "Gari Premium du Bénin Croustillant & Parfumé",
      subtitle:
        "Manioc noble rigoureusement sélectionné et torréfié selon la pure tradition béninoise. Délicieux délayé avec lait frais, sucre, arachides croquantes et glaçons.",
      image: heroGariPremium,
      ctaText: "Découvrir le Gari du Bénin",
      ctaLink: "/products",
    },
    {
      id: "distribution-map",
      eyebrow: t("hero.slideMap.eyebrow", "Partout en Afrique de l'Ouest & Diaspora"),
      title: t("hero.slideMap.title", "Livré chez vous en 24h à 48h"),
      subtitle: t(
        "hero.slideMap.description",
        "En Côte d'Ivoire, au Sénégal, au Mali, au Burkina, au Togo, au Bénin et vers la diaspora. Vos commandes sont emballées avec amour et expédiées avec suivi en direct.",
      ),
      ctaText: t("hero.slideMap.cta", "Commander dans ma ville"),
      ctaLink: "/products",
    },
    {
      id: "cereales-mixtes-single",
      eyebrow: "Farines Pures & Sans Additifs",
      title: "Farines Complètes Sahéliennes Prêtes en 3 Minutes",
      subtitle:
        "100% naturel, sans additifs chimiques ni conservateurs. Une préparation instantanée délicate qui préserve toutes les vitamines et minéraux des récoltes locales.",
      image: heroCerealesMixtesSingle,
      ctaText: "Voir nos farines",
      ctaLink: "/products",
    },
    {
      id: "maison-cereales",
      eyebrow: "Épicerie Meunière & Boutique",
      title: "La Maison des Céréales Bio Terroirs Nobles",
      subtitle:
        "Du grain brut jusqu'au conditionnement hermétique d'excellence. Visitez notre univers meunier et profitez d'une traçabilité irréprochable sur chaque récolte.",
      image: heroMaisonCerealesBoutique,
      ctaText: "Explorer la boutique",
      ctaLink: "/products",
    },
  ];

  const current = slides[activeIdx];
  const isMapSlide = current.id === "distribution-map";
  const DURATION_MS = 6000;

  // Défilement automatique avec mise en pause réactive au survol du curseur
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

  // Calcul pour le cercle de progression SVG
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section
      className="relative w-full min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] overflow-hidden bg-stone-950 text-white flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Arrière-plan panoramique avec 5 images ou carte interactive en fondu croisé fluide */}
      {slides.map((slide, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-0 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          >
            {slide.id === "distribution-map" ? (
              <InteractiveDistributionMap isActive={isActive} />
            ) : (
              slide.image && (
                <div className="relative h-full w-full overflow-hidden">
                  {/* Fond d'ambiance harmonieux avec flou pour draper tout l'écran */}
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover blur-2xl opacity-25 scale-110"
                    aria-hidden="true"
                  />
                  {/* Image nette intégrale (non rognée) positionnée sur la droite */}
                  <div className="absolute inset-y-0 right-0 w-full lg:w-3/5 flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:pr-14 z-0">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className={`h-full max-h-[440px] sm:max-h-[500px] lg:max-h-[560px] w-auto max-w-[90%] sm:max-w-[75%] lg:max-w-full object-contain rounded-2xl drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)] border border-white/10 transition-transform duration-[7000ms] ease-out ${
                        isActive ? "scale-102" : "scale-100"
                      }`}
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        );
      })}

      {/* 2. Filtres cinématographiques : contraste renforcé sur la gauche pour lisibilité parfaite */}
      {!isMapSlide && (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 sm:via-black/55 to-black/25 z-[1]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-[1]"
            aria-hidden="true"
          />
        </>
      )}

      {/* 3. Contenu Éditorial Inspiré du Design de Référence */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14 flex flex-col justify-between min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] pointer-events-none">
        {/* Contenu textuel sur la gauche */}
        <div className="my-auto max-w-xl sm:max-w-2xl pt-2 sm:pt-4 pointer-events-auto">
          {/* Surtitre en or avec ombre prononcée pour lisibilité directe */}
          <div className="text-xs uppercase tracking-[0.22em] text-[#E5B842] font-bold mb-2.5 sm:mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {current.eyebrow}
          </div>

          {/* Titre Principal Haute Typographie Éditoriale */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-white leading-[1.12] mb-3 sm:mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            {current.title}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm lg:text-base text-white/95 font-normal leading-relaxed max-w-lg mb-6 sm:mb-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {current.subtitle}
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              to={getLocalizedPath(current.ctaLink)}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/80 bg-stone-950/85 hover:bg-stone-950 px-7 py-3 text-xs sm:text-sm font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              to={getLocalizedPath("/about")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-stone-900/70 hover:bg-stone-900/90 px-6 py-3 text-xs sm:text-sm font-medium text-white transition-all duration-300 hover:border-white hover:scale-105 cursor-pointer backdrop-blur-sm shadow-xl"
            >
              <span>{t("hero.aboutLink", "Notre Histoire")}</span>
            </Link>
          </div>
        </div>

        {/* 4. Barre Inférieure : Indicateurs & Contrôles à droite */}
        <div className="w-full flex items-center justify-between pt-6 mt-auto pointer-events-auto border-t border-white/20">
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
            {/* Anneau de progression circulaire avec numéro de slide ou icône Pause au survol */}
            <div
              className="relative flex items-center justify-center h-11 w-11 select-none"
              title={isPaused ? "Défilement automatique en pause (curseur sur la bannière)" : "Défilement actif"}
            >
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
                  className={`text-[#D4AF37] transition-all duration-75 ${
                    isPaused ? "opacity-60" : "opacity-100"
                  }`}
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-white flex items-center justify-center">
                {isPaused ? (
                  <Pause className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                ) : (
                  `0${activeIdx + 1}`
                )}
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
