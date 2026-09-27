import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, Clock, ShieldCheck, Flame } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useLanguageNavigation } from "@/lib/i18n-routing";

// Images des céréales
import imgMil from "@/assets/product-mil.jpg";
import imgFonio from "@/assets/product-fonio.jpg";
import imgBouillie from "@/assets/product-bouillie-maman-bebe.jpg";
import imgPack from "@/assets/hero_cereales_mixtes_pack.jpg";
import imgSorgho from "@/assets/product-sorgho.jpg";
import imgMais from "@/assets/product-mais.jpg";
import imgNiebe from "@/assets/product-niebe.jpg";
import imgArachide from "@/assets/product-arachide.jpg";

export function DynamicHowItWorks() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [isPaused, setIsPaused] = useState(false);

  // Catalogue complet des céréales d'exception
  const cerealProducts = [
    {
      id: "mil",
      name: "Mil pour Dêguê",
      subtitle: "Précuit vapeur • 1kg",
      badge: "Zéro sable",
      tag: "Bestseller",
      price: "2 500 FCFA",
      image: imgMil,
    },
    {
      id: "fonio",
      name: "Fonio Royal Bio",
      subtitle: "Digest & sans gluten • 500g",
      badge: "100% Bio",
      tag: "Céréale ancestrale",
      price: "3 000 FCFA",
      image: imgFonio,
    },
    {
      id: "bouillie",
      name: "Farine Bébé & Maman",
      subtitle: "Moringa & baobab naturel • 1kg",
      badge: "Fortifiée",
      tag: "Nutrition pure",
      price: "3 500 FCFA",
      image: imgBouillie,
    },
    {
      id: "pack",
      name: "Pack Dégustation",
      subtitle: "Assortiment 4 variétés d'Afrique",
      badge: "Pack découverte",
      tag: "Sélection chef",
      price: "9 500 FCFA",
      image: imgPack,
    },
    {
      id: "sorgho",
      name: "Sorgho Rouge Digest",
      subtitle: "Riche en fer & antioxydants • 1kg",
      badge: "Tonus naturel",
      tag: "Terroir Ouest",
      price: "2 200 FCFA",
      image: imgSorgho,
    },
    {
      id: "mais",
      name: "Maïs Blanc Concassé",
      subtitle: "Précuit vapeur meunerie • 1kg",
      badge: "Haute pureté",
      tag: "Bouillies & Tô",
      price: "1 800 FCFA",
      image: imgMais,
    },
    {
      id: "niebe",
      name: "Niébé Sélectionné",
      subtitle: "Protéines végétales pures • 1kg",
      badge: "Riche en fibres",
      tag: "Légumineuse",
      price: "2 000 FCFA",
      image: imgNiebe,
    },
    {
      id: "arachide",
      name: "Pâte d'Arachide Pure",
      subtitle: "100% artisanale sans additifs • 500g",
      badge: "Onctueuse",
      tag: "Naturelle",
      price: "2 500 FCFA",
      image: imgArachide,
    },
  ];

  return (
    <section className="relative border-y border-stone-200/80 bg-stone-50/70 py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête sobre et épuré */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                <span>Sélection Meunerie • Zéro grain de sable garanti</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
                Sélectionnez vos céréales de terroirs
              </h2>
              <p className="mt-2.5 text-sm text-stone-600 leading-relaxed max-w-xl">
                Chaque variété est récoltée à maturité, méticuleusement triée, lavée à l'eau claire et précuite à la vapeur. Prêtes pour vos préparations en 3 minutes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={getLocalizedPath("/products")}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 transition-colors group"
              >
                <span>Voir toute la boutique</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Plateau Principal : Ruban de céréales à défilement horizontal perpétuel */}
        <div
          className="relative rounded-3xl border border-stone-200/90 bg-white p-5 sm:p-8 shadow-sm overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Dégradés d'estompage latéraux doux */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 z-10 bg-gradient-to-l from-white via-white/80 to-transparent" />

          {/* Indication visuelle discrète */}
          <div className="flex items-center justify-between text-xs text-stone-400 mb-4 px-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Défilement continu • Survolez un paquet pour le figer
            </span>
            <span className="hidden sm:inline text-stone-400">
              8 variétés artisanales disponibles
            </span>
          </div>

          {/* Ruban animé en continu */}
          <div className="relative w-full overflow-hidden py-2">
            <div
              className="animate-cereal-marquee flex gap-4 sm:gap-6"
              style={{
                animationPlayState: isPaused ? "paused" : "running",
              }}
            >
              {/* Duplication pour boucle infinie 100% sans saut */}
              {[...cerealProducts, ...cerealProducts].map((p, idx) => (
                <Link
                  key={`${p.id}-${idx}`}
                  to={getLocalizedPath("/products")}
                  className="group block w-64 sm:w-72 shrink-0 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 hover:border-amber-400 hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-40 sm:h-44 rounded-xl overflow-hidden mb-3.5 bg-stone-200 relative">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-950/75 text-white backdrop-blur-xs">
                      {p.badge}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                      {p.price}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-amber-800 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-xs text-stone-500 truncate">
                      {p.subtitle}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-stone-200/70 flex items-center justify-between text-xs text-amber-800 font-semibold">
                    <span className="text-[11px] text-stone-500 font-normal">
                      {p.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Commander
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bandeau de réassurance sobre et aéré au bas */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Emballage hermétique longue conservation (12 mois)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Cuisson express en 3 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Paiement sécurisé par GeniusPay</span>
              </div>
            </div>

            <Link
              to={getLocalizedPath("/products")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-stone-950 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] shrink-0"
            >
              <span>Accéder à la boutique</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
