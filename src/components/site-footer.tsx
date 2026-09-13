import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { CerealMotifBackground } from "@/components/ui/cereal-motif-background";

import waveImg from "@/assets/wave.png";
import omImg from "@/assets/om.png";
import mtnImg from "@/assets/mtn.jpg";
import moovImg from "@/assets/moov.png";
import visaImg from "@/assets/visa.png";
export function SiteFooter() {
  const { t } = useTranslation();
  const { getLocalizedPath, currentLang, switchLanguage } = useLanguageNavigation();

  const paymentLogos = [
    { name: "Wave", src: waveImg },
    { name: "Orange Money", src: omImg },
    { name: "MTN Money", src: mtnImg },
    { name: "Moov Money", src: moovImg },
    { name: "Visa", src: visaImg },
  ];

  return (
    <footer className="relative mt-12 sm:mt-16 bg-[#0D0B0A] text-stone-300 overflow-hidden border-t border-gold/20">
      {/* Motifs de céréales dorés discrets */}
      <CerealMotifBackground variant="footer" showLargeSheaf={false} className="opacity-35" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Grille principale compacte */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 pb-8 border-b border-stone-800/80">
          {/* Marque & Coordonnées (2 colonnes sur desktop) */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Cereals <span className="text-gold">House</span>
              </span>
            </div>

            <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
              {t(
                "footer.tagline",
                "Céréales et farines d'exception d'Afrique de l'Ouest. 100% naturelles, sans additifs et garanties sans impuretés.",
              )}
            </p>

            <div className="space-y-1 text-xs text-stone-400 font-light">
              <p>9 Boulevard de France, Cocody Riviera • Abidjan, Côte d'Ivoire</p>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <a
                  href="mailto:contact@cereals-house.com"
                  className="hover:text-gold transition-colors"
                >
                  contact@cereals-house.com
                </a>
                <span>•</span>
                <a
                  href="tel:+2250584637219"
                  className="hover:text-gold transition-colors font-medium text-stone-300"
                >
                  (+225) 05 84 63 72 19
                </a>
              </div>
            </div>

            {/* Réseaux sociaux compacts */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://www.facebook.com/share/1HjoGWMccN/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-gold hover:bg-gold hover:text-black cursor-pointer shadow-xs"
                aria-label="Facebook"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@shopingcommerce?_r=1&_t=ZS-99eLiR2dTN6"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-gold hover:bg-gold hover:text-black cursor-pointer shadow-xs"
                aria-label="TikTok"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Colonne 1 : Découvrir */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase">
              Découvrir
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/")} className="hover:text-gold transition">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/about")} className="hover:text-gold transition">
                  Notre histoire
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className="hover:text-gold transition">
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 : Boutique */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase">
              Boutique
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition">
                  Toutes les céréales
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition">
                  Farines d'éveil bébé
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition">
                  Fonio & mil perlé
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Commandes & Service */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-white uppercase">
              Commandes & B2B
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/cart")} className="hover:text-gold transition">
                  Mon panier
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/orders")} className="hover:text-gold transition">
                  Suivi de colis
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className="hover:text-gold transition">
                  Devis grossiste
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/auth")} className="hover:text-gold transition">
                  Espace client
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre inférieure compacte sur une seule ligne */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex flex-wrap items-center gap-3.5 text-stone-500 text-[11px]">
            <span>© {new Date().getFullYear()} Cereals House. Tous droits réservés.</span>
            <span>•</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-stone-300 transition">
              CGV
            </Link>
            <span>•</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-stone-300 transition">
              Confidentialité
            </Link>
          </div>

          {/* Sélecteur de Langue discret + Logos de paiement */}
          <div className="flex flex-wrap items-center gap-5">
            {/* Langue */}
            <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => switchLanguage("fr")}
                className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                  currentLang === "fr"
                    ? "bg-gold text-black font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Passer en Français"
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => switchLanguage("en")}
                className={`px-2.5 py-0.5 rounded-full transition cursor-pointer ${
                  currentLang === "en"
                    ? "bg-gold text-black font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Paiements discrets */}
            <div className="flex items-center gap-2 opacity-70">
              {paymentLogos.map((p) => (
                <img
                  key={p.name}
                  src={p.src}
                  alt={p.name}
                  className="h-3.5 max-w-[32px] object-contain rounded-xs grayscale hover:grayscale-0 transition"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}