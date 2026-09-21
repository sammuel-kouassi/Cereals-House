import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Compass,
  MapPin,
  ShieldCheck,
  UtensilsCrossed,
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { InteractiveDistributionMap } from "@/components/interactive-distribution-map";

// Images des céréales
import imgMil from "@/assets/product-mil.jpg";
import imgFonio from "@/assets/product-fonio.jpg";
import imgBouillie from "@/assets/product-bouillie-maman-bebe.jpg";
import imgPack from "@/assets/hero_cereales_mixtes_pack.jpg";
import imgPackaging from "@/assets/hero-packaging-noble.jpg";

// Logos des moyens de paiement
import logoWave from "@/assets/wave.png";
import logoOM from "@/assets/om.png";
import logoMTN from "@/assets/mtn.jpg";
import logoMoov from "@/assets/moov.png";
import logoVisa from "@/assets/visa.png";

export function DynamicHowItWorks() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();

  // Étape 2 active par défaut
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      idx: 0,
      number: "01",
      title: "Choisir vos céréales",
      subtitle: "Catalogue pur & sans sable",
      icon: Compass,
    },
    {
      idx: 1,
      number: "02",
      title: "Indiquez votre adresse",
      subtitle: "Carte de distribution & hubs",
      icon: MapPin,
    },
    {
      idx: 2,
      number: "03",
      title: "Payez en toute sécurité",
      subtitle: "Mobile Money & Carte",
      icon: ShieldCheck,
    },
    {
      idx: 3,
      number: "04",
      title: "Cuisinez sans attendre",
      subtitle: "Prêt en 3 minutes",
      icon: UtensilsCrossed,
    },
  ];

  return (
    <section className="relative border-y border-stone-200/80 bg-stone-50/60 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête sobre et élégant */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-semibold tracking-wider text-amber-800 uppercase mb-2 block">
              Expédition directe & Meunerie artisanale
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
              Commander vos céréales en toute simplicité
            </h2>
            <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
              De notre meunerie centrale à Abidjan jusqu'à votre table : quatre étapes transparentes pour savourer des céréales pures, garanties sans sable.
            </p>
          </div>
        </Reveal>

        {/* Barre de navigation unique (Onglets professionnels) */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {steps.map((s) => {
            const isActive = activeStep === s.idx;
            const Icon = s.icon;
            return (
              <button
                key={s.idx}
                type="button"
                onClick={() => setActiveStep(s.idx)}
                className={`relative text-left p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? "bg-white border-amber-500 shadow-sm ring-1 ring-amber-500/20"
                    : "bg-white/60 border-stone-200/80 hover:bg-white hover:border-stone-300 text-stone-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isActive ? "text-amber-700" : "text-stone-400"
                    }`}
                  >
                    {s.number}
                  </span>
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-amber-600" : "text-stone-400"
                    }`}
                  />
                </div>
                <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                  {s.title}
                </div>
                <div className="text-[11px] text-stone-500 truncate mt-0.5">
                  {s.subtitle}
                </div>

                {isActive && (
                  <div className="absolute inset-x-4 bottom-0 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Plateau Principal */}
        <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden min-h-[520px]">
          {/* ============================================================== */}
          {/* ÉTAPE 02 : LA CARTE SEULEMENT (Plein écran & épurée)          */}
          {/* ============================================================== */}
          {activeStep === 1 && (
            <div className="w-full h-[520px] sm:h-[580px] lg:h-[620px] relative">
              <InteractiveDistributionMap className="h-full w-full" />
            </div>
          )}

          {/* ============================================================== */}
          {/* ÉTAPE 01 : CHOIX DES CÉRÉALES (Présentation soignée)           */}
          {/* ============================================================== */}
          {activeStep === 0 && (
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
              <div className="max-w-xl mb-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Étape 01 • Terroirs & Qualité
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mt-1">
                  Sélectionnez vos céréales de terroirs
                </h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  Chaque variété est récoltée à maturité, méticuleusement triée et précuite à la vapeur. Zéro grain de sable garanti.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 hover:border-amber-400/60 transition">
                  <div className="h-36 rounded-xl overflow-hidden mb-3 bg-stone-200">
                    <img src={imgMil} alt="Mil pour Dêguê" className="h-full w-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">Mil pour Dêguê</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Précuit vapeur • 1kg</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 hover:border-amber-400/60 transition">
                  <div className="h-36 rounded-xl overflow-hidden mb-3 bg-stone-200">
                    <img src={imgFonio} alt="Fonio Royal" className="h-full w-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">Fonio Royal Bio</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Digest & sans gluten</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 hover:border-amber-400/60 transition">
                  <div className="h-36 rounded-xl overflow-hidden mb-3 bg-stone-200">
                    <img src={imgBouillie} alt="Farine Bébé & Maman" className="h-full w-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">Farine Bébé & Maman</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Moringa & baobab naturel</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5 hover:border-amber-400/60 transition">
                  <div className="h-36 rounded-xl overflow-hidden mb-3 bg-stone-200">
                    <img src={imgPack} alt="Pack Découverte" className="h-full w-full object-cover" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">Pack Dégustation</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Assortiment 4 variétés</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Emballage hermétique longue conservation (12 mois)</span>
                </div>
                <Link
                  to={getLocalizedPath("/products")}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-950 transition cursor-pointer shadow-xs"
                >
                  <span>Voir la boutique</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ÉTAPE 03 : PAIEMENT SIMPLE & CLAIR (Sans texte inutile)       */}
          {/* ============================================================== */}
          {activeStep === 2 && (
            <div className="p-8 sm:p-12 max-w-3xl mx-auto flex flex-col items-center text-center justify-center min-h-[520px]">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2 block">
                Étape 03 • Règlement Sécurisé
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                Réglez en toute confiance
              </h3>
              <p className="mt-2.5 text-sm text-stone-600 max-w-lg leading-relaxed">
                Paiement Mobile Money instantané ou carte bancaire internationale. Aucun frais supplémentaire n'est appliqué sur votre commande.
              </p>

              {/* Grille des moyens de paiement élégante */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 w-full max-w-xl">
                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col items-center justify-center gap-2">
                  <img src={logoWave} alt="Wave" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-semibold text-stone-800">Wave</span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col items-center justify-center gap-2">
                  <img src={logoOM} alt="Orange Money" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-semibold text-stone-800">Orange Money</span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col items-center justify-center gap-2">
                  <img src={logoMTN} alt="MTN" className="h-8 w-8 object-cover rounded-md" />
                  <span className="text-xs font-semibold text-stone-800">MTN MoMo</span>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col items-center justify-center gap-2">
                  <img src={logoMoov} alt="Moov" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-semibold text-stone-800">Moov Money</span>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-stone-200 bg-stone-50/50 p-4 flex flex-col items-center justify-center gap-2">
                  <img src={logoVisa} alt="Carte bancaire" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-semibold text-stone-800">Carte CB</span>
                </div>
              </div>

              {/* Note sobre */}
              <div className="mt-8 flex items-center gap-2 text-xs text-stone-500">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Paiement 100% en ligne sécurisé avant expédition express</span>
              </div>

              <div className="mt-8">
                <Link
                  to={getLocalizedPath("/products")}
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
                >
                  <span>Passer commande</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ÉTAPE 04 : RÉCEPTION & CUISSON 3 MINUTES                      */}
          {/* ============================================================== */}
          {activeStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
              <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 block mb-2">
                    Étape 04 • À Table en 3 Minutes
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                    Cuisinez sans attendre
                  </h3>
                  <p className="mt-2.5 text-sm text-stone-600 leading-relaxed">
                    Vos céréales arrivent protégées dans un bocal ou sachet barrière hermétique. Finies les heures de lavage et de tamisage.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Ouvrez le sachet étanche</div>
                        <div className="text-xs text-stone-500">Protection totale contre l'humidité et les insectes.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Versez dans l'eau chaude ou le lait</div>
                        <div className="text-xs text-stone-500">Céréales déjà précuites à la vapeur en meunerie.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-stone-900">3 minutes à feu doux et savourez</div>
                        <div className="text-xs text-stone-500">Goût authentique des terroirs africains pour toute la famille.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-200">
                  <Link
                    to={getLocalizedPath("/products")}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs sm:text-sm font-bold text-stone-950 transition cursor-pointer shadow-xs"
                  >
                    <span>Découvrir nos recettes & produits</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative overflow-hidden min-h-[300px] lg:min-h-full bg-stone-100">
                <img
                  src={imgPackaging}
                  alt="Packaging Cereals House"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-stone-950/75 backdrop-blur-md text-white border border-white/10">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Prêt en 3:00 min</span>
                  </div>
                  <div className="text-sm font-bold">Fraîcheur et arômes préservés jusqu'à 12 mois</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
