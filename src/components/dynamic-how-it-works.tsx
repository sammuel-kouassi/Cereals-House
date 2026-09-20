import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Compass, MapPin, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { Reveal } from "@/components/reveal";

import imgStep1 from "@/assets/hero_cereales_mixtes_pack.jpg";
import imgStep2 from "@/assets/hero-distribution-map.jpg";
import imgStep3 from "@/assets/hero_curves_boost.jpg";
import imgStep4 from "@/assets/hero_cereales_mixtes_single.jpg";

interface StepItem {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof Compass;
  image: string;
  tag: string;
}

export function DynamicHowItWorks() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(1); // Étape 2 active par défaut comme sur le modèle Dribbble

  const steps: StepItem[] = [
    {
      id: "step-1",
      number: "01",
      title: t("home.step1Title", "Faites votre choix"),
      shortTitle: t("home.step1Short", "Choisir vos céréales"),
      description: t(
        "home.step1Desc",
        "Parcourez notre collection de céréales pures, farines précuites et packs dégustation. Sélectionnez vos recettes favorites et ajoutez-les au panier en un clic.",
      ),
      icon: Compass,
      image: imgStep1,
      tag: "Catalogue Bio",
    },
    {
      id: "step-2",
      number: "02",
      title: t("home.step2Title", "Indiquez votre adresse"),
      shortTitle: t("home.step2Short", "Adresse & Destination"),
      description: t(
        "home.step2Desc",
        "Renseignez vos coordonnées de livraison en Côte d'Ivoire, au Sénégal, Bénin, Mali, Burkina, Togo, Ghana ou diaspora. Les frais et délais s'ajustent automatiquement.",
      ),
      icon: MapPin,
      image: imgStep2,
      tag: "Routage Intelligent",
    },
    {
      id: "step-3",
      number: "03",
      title: t("home.step3Title", "Réglez en toute sécurité"),
      shortTitle: t("home.step3Short", "Paiement Sécurisé"),
      description: t(
        "home.step3Desc",
        "Paiement Mobile Money instantané (Wave, Orange, MTN, Moov) avec détection opérateur ou carte bancaire. Paiement à la livraison également disponible à Abidjan.",
      ),
      icon: ShieldCheck,
      image: imgStep3,
      tag: "100% Crypté",
    },
    {
      id: "step-4",
      number: "04",
      title: t("home.step4Title", "Cuisinez sans attendre"),
      shortTitle: t("home.step4Short", "Réception & Dégustation"),
      description: t(
        "home.step4Desc",
        "Votre colis étanche et protecteur est remis en main propre en 24h à 48h. Céréales 100% triées, garanties sans sable, prêtes à cuire en seulement 3 minutes.",
      ),
      icon: UtensilsCrossed,
      image: imgStep4,
      tag: "Prêt en 3 Min",
    },
  ];

  return (
    <section className="border-y border-border/80 bg-secondary/30 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En-tête éditorial style Dribbble */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            {/* Puce How It Works */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold backdrop-blur-md mb-2.5 shadow-xs">
              <span>{t("home.howItWorksEyebrow", "Comment ça marche")}</span>
            </div>

            {/* Titre Principal */}
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary tracking-tight leading-tight">
              Commander vos céréales —{" "}
              <span className="bg-gradient-to-r from-[#935c1e] via-[#BF9024] to-[#E5BF5A] bg-clip-text text-transparent">
                En toute simplicité
              </span>
            </h2>

            {/* Sous-titre */}
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {t(
                "home.howItWorksDesc",
                "Quatre étapes simples pour recevoir vos céréales saines, naturelles et prêtes pour vos repas.",
              )}
            </p>
          </div>
        </Reveal>

        {/* Grille Dynamique de Cartes Accordéon (Hauteur ajustée et compacte) */}
        <div className="flex flex-col md:flex-row gap-3.5 lg:gap-4 items-stretch w-full min-h-[340px] sm:min-h-[360px] lg:min-h-[370px]">
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                onMouseEnter={() => setActiveStep(idx)}
                className={`group relative rounded-2xl sm:rounded-3xl transition-all duration-500 ease-out overflow-hidden flex flex-col justify-between select-none cursor-pointer ${
                  isActive
                    ? "md:flex-[2.4] lg:flex-[2.5] bg-card border-2 border-gold/50 shadow-xl shadow-gold/10 p-4 sm:p-5"
                    : "md:flex-1 bg-card/65 border border-border/80 hover:border-gold/40 hover:bg-card p-4 sm:p-4.5 shadow-xs hover:shadow-md"
                }`}
              >
                {isActive ? (
                  /* ============================================================ */
                  /* CARTE DÉPLIÉE / ACTIVE (Visuel compact + Détails complets)   */
                  /* ============================================================ */
                  <div className="h-full flex flex-col justify-between animate-fadeIn">
                    <div>
                      {/* Image d'illustration compacte */}
                      <div className="relative w-full h-32 sm:h-36 lg:h-38 rounded-xl overflow-hidden mb-3.5 shrink-0 bg-stone-900 border border-border/60 shadow-inner">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* Badge tag flottant sur l'image */}
                        <div className="absolute bottom-2.5 left-2.5 rounded-full border border-white/20 bg-black/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                          {step.tag}
                        </div>

                        {/* Numéro d'étape discret sur l'image */}
                        <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/60 text-gold font-bold font-mono text-[11px] backdrop-blur-md border border-white/10">
                          {step.number}
                        </div>
                      </div>

                      {/* Icône & Titre */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 text-gold border border-gold/30 shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                          Étape {step.number}
                        </span>
                      </div>

                      <h3 className="font-display text-lg sm:text-xl font-bold text-primary tracking-tight leading-snug">
                        {step.title}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {step.description}
                      </p>
                    </div>

                    {/* Barre inférieure active */}
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold text-gold">
                      <span>Étape active</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
                    </div>
                  </div>
                ) : (
                  /* ============================================================ */
                  /* CARTE REPLIÉE COMPACTE (Grand numéro + Icône + Titre bas)    */
                  /* ============================================================ */
                  <div className="h-full flex flex-col justify-between">
                    {/* Grand numéro d'étape en haut */}
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl sm:text-3xl font-extrabold text-muted-foreground/35 transition-colors duration-300 group-hover:text-gold/70">
                        {step.number}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-border transition-colors duration-300 group-hover:bg-gold/50" />
                    </div>

                    {/* Icône au centre */}
                    <div className="my-auto py-3 flex flex-col items-start">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/80 text-muted-foreground border border-border/80 transition-all duration-300 group-hover:bg-gold/15 group-hover:text-gold group-hover:border-gold/30 group-hover:scale-110">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Titre au bas de la carte repliée */}
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-primary leading-snug transition-colors duration-300 group-hover:text-gold">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                        {step.shortTitle}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
