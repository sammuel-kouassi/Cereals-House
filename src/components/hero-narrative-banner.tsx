import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

  const slides: SlideData[] = [
    {
      id: "curves-boost",
      eyebrow: t("heroNarrative.slide1.eyebrow", "100% Bio & Terroirs Nobles"),
      titleLine1: t("heroNarrative.slide1.titleLine1", "Curves Boost"),
      titleLine2: t("heroNarrative.slide1.titleLine2", "énergie & rondeurs"),
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
      titleLine1: t("heroNarrative.slide2.titleLine1", "Céréales mixtes"),
      titleLine2: t("heroNarrative.slide2.titleLine2", "le pack vitalité"),
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
      titleLine1: t("heroNarrative.slide3.titleLine1", "Gari du Bénin"),
      titleLine2: t("heroNarrative.slide3.titleLine2", "croustillant & pur"),
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
      titleLine1: t("heroNarrative.slide4.titleLine1", "Farines complètes"),
      titleLine2: t("heroNarrative.slide4.titleLine2", "prêtes en 3 minutes"),
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
      titleLine1: t("heroNarrative.slide5.titleLine1", "Maison Céréales"),
      titleLine2: t("heroNarrative.slide5.titleLine2", "l'excellence bio"),
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
  const count = slides.length;

  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [touching, setTouching] = useState(false);
  const isPaused = hovered || focusWithin || touching;

  // Un seul minuteur par diapositive (au lieu d'un intervalle de 50 ms qui
  // redessinait tout le hero 20 fois par seconde). Coupé en mouvement réduit.
  useEffect(() => {
    if (isPaused || reducedMotion) return;
    const timer = window.setTimeout(() => setActiveIdx((i) => (i + 1) % count), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeIdx, isPaused, reducedMotion, count]);

  const nextSlide = () => setActiveIdx((curr) => (curr + 1) % count);
  const prevSlide = () => setActiveIdx((curr) => (curr - 1 + count) % count);
  const goToSlide = (idx: number) => setActiveIdx(idx);

  // --- Swipe : suivi 1:1 du texte, projection de l'élan au lâcher ---
  const drag = useRef<{
    id: number;
    x0: number;
    y0: number;
    dx: number;
    locked: boolean;
    history: { x: number; t: number }[];
  } | null>(null);

  const setContentX = (x: number, animate: boolean) => {
    const el = contentRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 350ms ease-out" : "none";
    el.style.transform = x ? `translate3d(${x}px, 0, 0)` : "";
    el.style.opacity = x ? String(Math.max(0.35, 1 - Math.abs(x) / 400)) : "";
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    setTouching(true);
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, locked: false, history: [{ x: e.clientX, t: e.timeStamp }] };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.locked) {
      // Hystérésis de 10px avant de décider : horizontal = swipe, vertical = défilement
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        setTouching(false);
        return;
      }
      d.locked = true;
      sectionRef.current?.setPointerCapture(e.pointerId);
    }
    d.dx = dx;
    d.history.push({ x: e.clientX, t: e.timeStamp });
    if (d.history.length > 5) d.history.shift();
    setContentX(dx, false);
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setTouching(false);
    if (!d || d.id !== e.pointerId || !d.locked) return;
    const first = d.history[0];
    const last = d.history[d.history.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const velocity = ((last.x - first.x) / dt) * 1000; // px/s
    // Projection d'Apple (décélération 0.99, ressenti « vif »)
    const projected = d.dx + ((velocity / 1000) * 0.99) / (1 - 0.99);
    const width = sectionRef.current?.clientWidth ?? 375;
    setContentX(0, true);
    if (projected < -width * 0.3) nextSlide();
    else if (projected > width * 0.3) prevSlide();
  };

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrousel"
      className="relative w-full min-h-[480px] sm:min-h-[540px] lg:min-h-[590px] overflow-hidden bg-[#18110B] text-white flex items-center touch-pan-y"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* 1. VISUEL HERO À DROITE SANS AUCUNE FRONTIÈRE NI BORDURE */}
      {slides.map((slide, idx) => {
        const isActive = idx === activeIdx;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-500 ease-out pointer-events-none ${
              isActive ? "opacity-100 z-0" : "opacity-0 z-[-1]"
            }`}
          >
            {/* Image nette intégrée sans cadre ni bordure */}
            <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/5 lg:w-3/5 h-full flex items-center justify-end overflow-hidden">
              <img
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                draggable={false}
                className={`h-full w-full object-cover object-center lg:object-right transition-transform duration-[7000ms] ease-out select-none motion-reduce:transition-none ${
                  isActive ? "scale-[1.03] motion-reduce:scale-100" : "scale-100"
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
        {/* Colonne Gauche : Titre, Description, Actions */}
        <div className="my-auto max-w-xl lg:max-w-xl pointer-events-auto">
          {/* Texte : suit le doigt pendant le swipe, fondu synchronisé avec l'image */}
          <div ref={contentRef} aria-live={isPaused ? "polite" : "off"}>
            <div key={current.id} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
              <h1 className="font-display text-[2.1rem] font-normal leading-[1.05] tracking-[-0.02em] text-stone-50 sm:text-[2.6rem] md:text-[2.9rem] lg:text-[3.4rem]">
                <span className="block">{current.titleLine1}</span>
                <em className="mt-1 block text-gold">{current.titleLine2}</em>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-300 sm:text-base">
                {current.subtitle}
              </p>

              {/* Boutons d'action compacts & équilibrés */}
              <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-5">
                <Link
                  to={getLocalizedPath(current.ctaLink)}
                  className="pressable group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm text-stone-950 transition-colors duration-200 hover:bg-[#d8b25f] cursor-pointer"
                >
                  <span>{current.ctaText}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to={getLocalizedPath("/products")}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-1 text-sm text-stone-200 underline decoration-stone-200/30 underline-offset-4 transition-colors duration-200 hover:decoration-stone-200 cursor-pointer"
                >
                  <span>{t("heroNarrative.viewShop", "Voir la boutique")}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. RANGÉE DE VIGNETTES PRODUITS COMPACTES ET ÉLÉGANTES */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto p-1 scrollbar-none">
              {slides.map((slide, idx) => {
                const isThumbActive = idx === activeIdx;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`relative h-11 w-11 shrink-0 sm:h-12 sm:w-12 rounded-md overflow-hidden cursor-pointer transition-opacity duration-200 ${
                      isThumbActive
                        ? "opacity-100 outline outline-1 outline-offset-2 outline-gold"
                        : "opacity-45 hover:opacity-80"
                    }`}
                    aria-label={`${slide.titleLine1} ${slide.titleLine2}`}
                    aria-current={isThumbActive}
                  >
                    <img src={slide.image} alt="" draggable={false} className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. CONTRÔLES DISCRETS EN BAS À DROITE (Flèches) */}
        <div className="hidden sm:flex items-center justify-end gap-2.5 mt-auto pt-4 pointer-events-auto">
          <button
            type="button"
            onClick={prevSlide}
            className="h-11 w-11 rounded-full border border-stone-50/25 text-stone-100 flex items-center justify-center transition-colors duration-200 hover:border-stone-50/70 cursor-pointer"
            aria-label={t("heroNarrative.prev", "Diapositive précédente")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="h-11 w-11 rounded-full border border-stone-50/25 text-stone-100 flex items-center justify-center transition-colors duration-200 hover:border-stone-50/70 cursor-pointer"
            aria-label={t("heroNarrative.next", "Diapositive suivante")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}
