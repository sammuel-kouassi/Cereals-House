import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Star,
  Leaf,
  Award,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useCountry } from "@/lib/country-context";
import { Flag } from "@/components/flag";

import heroLuxuryCereals from "@/assets/hero-luxury-cereals.jpg";
import heroNutritionPure from "@/assets/hero-nutrition-pure.jpg";
import heroPackagingNoble from "@/assets/hero-packaging-noble.jpg";

interface HeroSlide {
  id: string;
  pill: string;
  titleLight: string;
  titleGold: string;
  description: string;
  image: string;
  tag: string;
  floatingLabel: string;
  floatingSub: string;
  statNumber: string;
  statLabel: string;
  ctaText: string;
  ctaLink: string;
}

export function HeroNarrativeBanner() {
  const { country } = useCountry();
  const { t } = useTranslation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const isHoveredRef = useRef(false);

  const slides: HeroSlide[] = [
    {
      id: "terroirs",
      pill: "Terroirs Nobles d'Afrique de l'Ouest",
      titleLight: "La Noblesse des",
      titleGold: "Céréales Ancestrales",
      description:
        "Mil perlé doré du Sahel, fonio royal du Fouta et sorgho rouge récoltés à la main par nos coopératives partenaires. Une pureté nutritionnelle intacte, 100% naturelle et sans additifs.",
      image: heroLuxuryCereals,
      tag: "🌾 Grains Entiers · Meules de Pierre · Zéro Conservateur",
      floatingLabel: "Origine Pure Certifiée",
      floatingSub: "100% Terroirs durables d'Afrique de l'Ouest",
      statNumber: "100%",
      statLabel: "Naturel & Sans Gluten Ajouté",
      ctaText: "Explorer la Récolte",
      ctaLink: "/products",
    },
    {
      id: "nutrition",
      pill: "Nutrition Infantile & Bien-être Familial",
      titleLight: "L'Éveil Savoureux des",
      titleGold: "Farines & Bouillies Pures",
      description:
        "Farines d'éveil enrichies au Moringa bio et à la pulpe de Baobab. Précuites à la vapeur douce pour une digestibilité optimale, riches en fer, calcium et zinc pour grandir sereinement.",
      image: heroNutritionPure,
      tag: "🥣 Dès 6 mois · Enrichi Moringa & Baobab Bio",
      floatingLabel: "Digestibilité Infantile",
      floatingSub: "Approuvé par plus de 1,200 mamans et pédiatres",
      statNumber: "5x",
      statLabel: "Plus de micronutriments biodisponibles",
      ctaText: "Découvrir les Farines",
      ctaLink: "/products",
    },
    {
      id: "ecrins",
      pill: "Excellence & Fraîcheur Scellée",
      titleLight: "L'Art de l'Écrin Noble",
      titleGold: "Chez Vous en 24h à 48h",
      description:
        "Pots hermétiques protecteurs et sachets barrière préservant chaque arôme noisette et toutes les vitamines. Règlement ultra-simple par Mobile Money ou carte bancaire.",
      image: heroPackagingNoble,
      tag: "✨ Scellage Hermétique · Paiement Wave & Orange",
      floatingLabel: "Expédition Express",
      floatingSub: "Livraison sécurisée à domicile ou relais",
      statNumber: "48h",
      statLabel: "Livraison Express & Suivi en Direct",
      ctaText: "Commander en Ligne",
      ctaLink: "/products",
    },
  ];

  const current = slides[activeIdx];
  const DURATION_MS = 6500;

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
      className="relative overflow-hidden bg-[#110D0A] text-stone-100"
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
    >
      {/* Halo d'ambiance doré subtil en arrière-plan */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-gold/20 via-amber-700/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-amber-600/15 via-gold/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* Grille de texture très discrète façon papier vélin de luxe */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4af37_0.6px,transparent_0.6px)] [background-size:28px_28px] opacity-[0.07]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pt-16 lg:pb-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* ============================================================ */}
          {/* COLONNE GAUCHE : Typographie & Puissance Éditoriale          */}
          {/* ============================================================ */}
          <div className="lg:col-span-6 space-y-7">
            {/* Pillule badge de prestige avec micropoint pulsant */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <span>{current.pill}</span>
            </div>

            {/* Titre Principal Haute Typographie */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.08] tracking-tight text-white">
              <span className="block drop-shadow-sm">{current.titleLight}</span>
              <span className="block bg-gradient-to-r from-[#F7E7B4] via-[#E2B94D] to-[#BF9024] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(212,175,55,0.25)]">
                {current.titleGold}
              </span>
            </h1>

            {/* Descriptif soigné */}
            <p className="max-w-xl text-base sm:text-lg text-stone-300 font-light leading-relaxed">
              {current.description}
            </p>

            {/* Tag de traçabilité & bienfaits */}
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/60 px-4 py-1.5 text-xs font-medium text-stone-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>{current.tag}</span>
            </div>

            {/* Boutons d'Action Principaux */}
            <div className="pt-1 flex flex-wrap items-center gap-4">
              <Link
                to={current.ctaLink}
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-500 to-gold px-8 py-4 text-sm font-bold text-[#14110F] shadow-[0_10px_35px_-10px_rgba(212,175,55,0.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(212,175,55,0.9)] cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>{current.ctaText}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                to="/about"
                className="group inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/40 px-6 py-4 text-sm font-semibold text-stone-200 backdrop-blur-md transition-all duration-300 hover:border-gold/60 hover:text-gold hover:bg-stone-800/60"
              >
                <span>Notre Histoire & Meunerie</span>
                <ChevronRight className="h-4 w-4 text-stone-400 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-gold" />
              </Link>
            </div>

            {/* Ligne de Réassurance & Preuve Sociale */}
            <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-2.5">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <span className="font-medium text-stone-300">
                  <strong className="text-white">1,200+ familles</strong> font confiance à Cereals House
                </span>
              </div>

              {country && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-900/80 border border-stone-800 px-3 py-1 text-stone-300 font-medium">
                  <Flag code={country.code} />
                  <span>Livraison disponible en {country.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE DROITE : Showcase Photographique & Cartes Bento     */}
          {/* ============================================================ */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Cadre de l'image principale avec contour doré lumineux */}
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-3xl border border-gold/30 bg-stone-900 shadow-2xl transition-all duration-700 group">
                {/* Images avec fondu croisé ultra-fluide */}
                {slides.map((s, idx) => {
                  const isActive = idx === activeIdx;
                  return (
                    <div
                      key={s.id}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={s.image}
                        alt={s.titleLight + " " + s.titleGold}
                        className={`h-full w-full object-cover object-center transition-transform duration-[8000ms] ease-out ${
                          isActive ? "scale-105" : "scale-100"
                        }`}
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                      {/* Vignette dégradée sombre pour faire ressortir les badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#110D0A]/90 via-[#110D0A]/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#110D0A]/40 via-transparent to-[#110D0A]/20" />
                    </div>
                  );
                })}

                {/* Badge flottant Supérieur Gauche : Certifié Excellence */}
                <div className="absolute top-5 left-5 z-20 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur-xl shadow-xl">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-white">
                      {current.floatingLabel}
                    </div>
                    <div className="text-[10px] text-stone-300 font-light">
                      {current.floatingSub}
                    </div>
                  </div>
                </div>

                {/* Badge flottant Supérieur Droit : Stat clé */}
                <div className="absolute top-5 right-5 z-20 flex flex-col items-center rounded-2xl border border-gold/30 bg-stone-950/60 px-3.5 py-2 backdrop-blur-xl shadow-xl text-center">
                  <span className="font-display text-lg font-bold text-gold leading-none">
                    {current.statNumber}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-stone-300 font-medium mt-0.5 max-w-[80px]">
                    {current.statLabel}
                  </span>
                </div>

                {/* Carte Bento Inférieure Flottante : Détails Express */}
                <div className="absolute bottom-5 inset-x-5 z-20 rounded-2xl border border-gold/25 bg-[#171310]/85 p-4.5 backdrop-blur-xl shadow-2xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-bold text-white">
                          Cereals House Premium
                        </div>
                        <div className="text-xs text-stone-300">
                          Mil, Fonio, Sorgho, Maïs & Farines Enrichies
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/products"
                      className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-amber-300 transition-colors"
                    >
                      Commander <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-stone-700/60 pt-3 text-[11px] text-stone-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="truncate">Meule de pierre</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="truncate">Sans additif</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="truncate">Mobile Money</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BARRE DE NAVIGATION NARRATIVE MULTI-SÉQUENCES EN BAS          */}
        {/* ============================================================ */}
        <div className="mt-12 border-t border-stone-800/80 pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {slides.map((s, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectSlide(idx)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "border-gold/50 bg-stone-900/80 shadow-[0_0_25px_rgba(212,175,55,0.12)]"
                      : "border-stone-800/80 bg-stone-950/40 hover:border-stone-700 hover:bg-stone-900/40"
                  }`}
                >
                  {/* Ligne de progression dynamique au sommet de la carte */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-stone-800 mb-3">
                    {isActive ? (
                      <div
                        className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    ) : idx < activeIdx ? (
                      <div className="h-full bg-stone-600 w-full" />
                    ) : (
                      <div className="h-full w-0 group-hover:w-full group-hover:bg-stone-700 transition-all duration-300" />
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`font-display text-sm font-bold transition-colors ${
                        isActive ? "text-gold" : "text-stone-300 group-hover:text-white"
                      }`}
                    >
                      0{idx + 1}. {s.titleLight} {s.titleGold}
                    </span>
                    <span
                      className={`text-[11px] font-semibold transition-colors ${
                        isActive ? "text-gold" : "text-stone-500 group-hover:text-stone-400"
                      }`}
                    >
                      {isActive ? "En cours" : "Voir"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-stone-400 line-clamp-1 font-light">
                    {s.tag.replace(/[🌾🥣✨]/g, "").trim()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
