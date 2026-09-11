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
    <footer className="relative mt-20 sm:mt-28 bg-[#0D0B0A] text-stone-200 overflow-hidden border-t border-gold/25">
      {/* Motifs de céréales dorés exclusifs au footer */}
      <CerealMotifBackground variant="footer" showLargeSheaf={true} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-16 sm:pt-20">
        {/* ============================================================ */}
        {/* 1. SECTION SUPÉRIEURE : COORDONNÉES & 3 COLONNES DE LIENS     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Colonne Gauche : Réseaux sociaux & Coordonnées (5 colonnes) */}
          <div className="md:col-span-5 space-y-6">
            {/* 3 Icônes sociales cerclées (Instagram, X, YouTube) */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/80 transition-all duration-200 hover:border-white hover:bg-white hover:text-black cursor-pointer shadow-xs"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/80 transition-all duration-200 hover:border-white hover:bg-white hover:text-black cursor-pointer shadow-xs"
                aria-label="X Twitter"
              >
                <span className="font-sans font-bold text-xs">𝕏</span>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/80 transition-all duration-200 hover:border-white hover:bg-white hover:text-black cursor-pointer shadow-xs"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>

            {/* Coordonnées & Adresse formatées comme sur la référence */}
            <div className="space-y-4 text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
              <p>
                9 Boulevard de France, Cocody Riviera
                <br />
                Abidjan, Côte d'Ivoire & Afrique de l'Ouest
              </p>
              <p>
                <a
                  href="mailto:contact@cerealshouse.com"
                  className="transition-colors hover:text-gold"
                >
                  contact@cerealshouse.com
                </a>
              </p>
              <p>
                <a
                  href="tel:+2250584637219"
                  className="transition-colors hover:text-gold"
                >
                  (+225) 05 84 63 72 19
                </a>
              </p>
            </div>
          </div>

          {/* Colonnes Droite : 3 Colonnes de Navigation (MENU, SHOP, CART) */}
          <div className="md:col-span-7 grid grid-cols-3 gap-6 sm:gap-8">
            {/* Colonne 1 : MENU */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4 sm:mb-5">
                MENU
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-400 font-light">
                <li>
                  <Link
                    to={getLocalizedPath("/")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/about")}
                    className="transition hover:text-gold hover:underline"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/about")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Meunerie
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/contact")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 2 : SHOP */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4 sm:mb-5">
                SHOP
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-400 font-light">
                <li>
                  <Link
                    to={getLocalizedPath("/products")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Mil Perlé
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/products")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Farines Bio
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/products")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Fonio Royal
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/products")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Bouillies
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : CART */}
            <div>
              <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4 sm:mb-5">
                CART
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-400 font-light">
                <li>
                  <Link
                    to={getLocalizedPath("/cart")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Panier
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/orders")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Commandes
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/contact")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Vente en Gros
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/auth")}
                    className="transition hover:text-gold hover:underline"
                  >
                    Mon Compte
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. LIGNE MÉDIANE SÉPARATRICE AVEC BOUTON TRANSPARENT "BOUTIQUE" */}
        {/* ============================================================ */}
        <div className="relative mt-12 sm:mt-16 flex items-center">
          <div className="w-full border-t border-stone-700/70" />
          <Link
            to={getLocalizedPath("/products")}
            className="shrink-0 -ml-3 sm:-ml-4 z-10 rounded-full border border-white/80 bg-white/15 backdrop-blur-md px-7 sm:px-8 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-white/30 hover:border-white hover:scale-105 active:scale-95 cursor-pointer"
          >
            {t("nav.shop", "Boutique")}
          </Link>
        </div>

        {/* ============================================================ */}
        {/* 3. SECTION SOUS LA LIGNE : PHRASE DE MARQUE, LANGUE & CGV    */}
        {/* ============================================================ */}
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-stone-400">
          <p className="max-w-md text-stone-400 font-light leading-relaxed">
            {t(
              "footer.missionStatement",
              "Des terroirs sahéliens à votre table. Nos coopératives partenaires et maîtres meuniers perpétuent la noblesse des céréales africaines pures, sans additifs ni conservateurs.",
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-medium tracking-wider uppercase text-stone-400">
            {/* Sélecteur de Langue Exclusif au Footer (Français / Anglais) */}
            <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 p-1 text-xs">
              <button
                type="button"
                onClick={() => switchLanguage("fr")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  currentLang === "fr"
                    ? "bg-gold text-black font-bold shadow-xs"
                    : "text-stone-300 hover:text-white"
                }`}
                title="Passer en Français"
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => switchLanguage("en")}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  currentLang === "en"
                    ? "bg-gold text-black font-bold shadow-xs"
                    : "text-stone-300 hover:text-white"
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            <Link
              to={getLocalizedPath("/about")}
              className="transition hover:text-white"
            >
              TERMS & CONDITIONS
            </Link>
            <Link
              to={getLocalizedPath("/about")}
              className="transition hover:text-white"
            >
              PRIVACY POLICY
            </Link>
          </div>
        </div>

        {/* Moyens de paiement sécurisés discrets */}
        <div className="mt-8 pt-4 border-t border-stone-800/60 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] text-stone-500 font-light">
            Paiements instantanés & sécurisés : Wave, Orange Money, MTN, Moov, Carte bancaire
          </span>
          <div className="flex items-center gap-2 opacity-75">
            {paymentLogos.map((p) => (
              <img
                key={p.name}
                src={p.src}
                alt={p.name}
                className="h-4 max-w-[36px] object-contain rounded-xs grayscale hover:grayscale-0 transition"
              />
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. TYPOGRAPHIE GÉANTE FILIGRANE AU BAS DU FOOTER             */}
        {/*    (Exactement comme "ente. - mome" sur la référence)        */}
        {/* ============================================================ */}
        <div className="overflow-hidden pointer-events-none select-none -mb-4 sm:-mb-8 mt-6 pt-4">
          <div className="font-display font-extrabold text-[15vw] leading-[0.82] text-stone-700/35 tracking-tighter whitespace-nowrap">
            cereals.- house
          </div>
        </div>
      </div>
    </footer>
  );
}