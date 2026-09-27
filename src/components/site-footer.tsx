import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { toast } from "sonner";
import { Globe, Check, ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";

import logo from "@/assets/logo.jpeg";
import waveImg from "@/assets/wave.png";
import omImg from "@/assets/om.png";
import mtnImg from "@/assets/mtn.jpg";
import moovImg from "@/assets/moov.png";
import visaImg from "@/assets/visa.png";

export function SiteFooter() {
  const { t } = useTranslation();
  const { getLocalizedPath, currentLang, switchLanguage } = useLanguageNavigation();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const paymentLogos = [
    { name: "Wave", src: waveImg },
    { name: "Orange Money", src: omImg },
    { name: "MTN Money", src: mtnImg },
    { name: "Moov Money", src: moovImg },
    { name: "Visa", src: visaImg },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error(t("common.invalidEmail", "Veuillez saisir une adresse email valide."));
      return;
    }
    setNewsletterSubscribed(true);
    toast.success(
      t(
        "footer.newsletterSuccess",
        "Merci ! Vous êtes inscrit(e) aux actualités exclusives Cereals House.",
      ),
    );
  };

  return (
    <footer className="mt-24 sm:mt-36 border-t border-stone-800/80 bg-[#12100E] text-stone-300 font-sans">
      {/* ─── CONTENU PRINCIPAL AÉRÉ DU FOOTER ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Colonne 1 : Marque & Présentation Institutionnelle (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Link to={getLocalizedPath("/")} className="inline-flex items-center gap-3.5 group">
              <img
                src={logo}
                alt="Cereals House"
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-stone-700/80 group-hover:ring-amber-500/50 transition"
              />
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-white">
                  Cereals <span className="text-gold font-serif italic">House</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">
                  Terroirs & Meunerie d'Afrique
                </div>
              </div>
            </Link>

            <p className="text-sm text-stone-400 leading-relaxed max-w-md font-light">
              Maison meunière d'excellence dédiée à la valorisation des grains nobles d'Afrique de l'Ouest. Filières paysannes durables, traçabilité certifiée et transformation artisanale sans sable.
            </p>

            {/* Coordonnées aérées */}
            <div className="space-y-3 pt-2 text-xs sm:text-sm text-stone-400 font-light">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-amber-500/80 shrink-0 mt-0.5" />
                <span>9 Boulevard de France, Cocody Riviera, Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <a
                  href="mailto:contact@cereals-house.com"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-amber-500/80" />
                  <span>contact@cereals-house.com</span>
                </a>
                <a
                  href="tel:+2250584637219"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-amber-500/80" />
                  <span>(+225) 05 84 63 72 19</span>
                </a>
              </div>
            </div>

            {/* Liens Réseaux Sociaux & WhatsApp */}
            <div className="flex items-center gap-4 pt-3">
              <a
                href="https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20des%20renseignements"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/60 px-3.5 py-1.5 text-xs text-stone-300 hover:text-white hover:border-emerald-500/60 transition"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>WhatsApp Pro</span>
                <ArrowUpRight className="h-3 w-3 text-stone-500" />
              </a>

              <a
                href="https://www.facebook.com/share/1HjoGWMccN/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full border border-stone-800 bg-stone-900/40 text-stone-400 hover:text-white hover:border-stone-600 transition"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://www.tiktok.com/@shopingcommerce?_r=1&_t=ZS-99eLiR2dTN6"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full border border-stone-800 bg-stone-900/40 text-stone-400 hover:text-white hover:border-stone-600 transition"
                aria-label="TikTok"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Colonne 2 : Navigation Maison & Savoir-Faire (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-stone-200 uppercase">
              {t("footer.company", "Maison")}
            </h4>
            <ul className="space-y-3 text-sm text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/")} className="hover:text-white transition-colors inline-block">
                  {t("nav.home", "Accueil")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/about")} className="hover:text-white transition-colors inline-block">
                  {t("footer.about", "Notre Histoire")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/about")} className="hover:text-white transition-colors inline-block">
                  {t("footer.retailLink", "Points de Vente")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className="hover:text-white transition-colors inline-block">
                  {t("footer.wholesaleLink", "Devis B2B Grossiste")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Boutique & Céréales (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-stone-200 uppercase">
              {t("footer.shop", "Boutique")}
            </h4>
            <ul className="space-y-3 text-sm text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-white transition-colors inline-block">
                  {t("footer.allProducts", "Toutes les céréales")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-white transition-colors inline-block">
                  Farines Bébé & Maman
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-white transition-colors inline-block">
                  Fonio Royal Bio
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-white transition-colors inline-block">
                  Mil pour Dêguê
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/cart")} className="hover:text-white transition-colors inline-block">
                  {t("footer.cart", "Mon panier")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Newsletter & Suivi (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-stone-200 uppercase">
              Restez informé
            </h4>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-light">
              Recevez les annonces de récoltes fraîches et les offres privées de la Maison.
            </p>

            {newsletterSubscribed ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>Merci pour votre inscription !</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-3 pt-2">
                <div className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    className="w-full rounded-xl border border-stone-700 bg-stone-900/90 px-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 px-4 text-xs sm:text-sm font-bold text-stone-950 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    S'inscrire à la lettre
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 font-light">
                  Aucun spam. Désabonnement à tout moment.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* ─── BARRE INFÉRIEURE AÉRÉE : COPYRIGHT, LANGUES & PAIEMENTS ─── */}
        <div className="mt-16 pt-10 border-t border-stone-800/80 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          {/* Mentions légales & Copyright */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-[11px] sm:text-xs text-stone-400 font-light">
            <span>© {new Date().getFullYear()} Cereals House. {t("footer.rights", "Tous droits réservés.")}</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-stone-200 transition-colors">
              {t("footer.privacy", "Confidentialité")}
            </Link>
            <Link to={getLocalizedPath("/about")} className="hover:text-stone-200 transition-colors">
              {t("footer.terms", "Conditions Générales")}
            </Link>
            <Link to={getLocalizedPath("/about")} className="hover:text-stone-200 transition-colors">
              Mentions Légales
            </Link>
          </div>

          {/* Langue & Moyens de paiement */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {/* Sélecteur de langue */}
            <div className="flex items-center gap-2 border border-stone-800 rounded-lg px-3 py-1.5 bg-stone-900/60 text-xs text-stone-400">
              <Globe className="h-3.5 w-3.5 text-stone-500" />
              <button
                type="button"
                onClick={() => switchLanguage("fr")}
                className={`transition-colors cursor-pointer ${
                  currentLang === "fr" ? "font-bold text-stone-200" : "hover:text-stone-200"
                }`}
              >
                Français
              </button>
              <span className="text-stone-700">·</span>
              <button
                type="button"
                onClick={() => switchLanguage("en")}
                className={`transition-colors cursor-pointer ${
                  currentLang === "en" ? "font-bold text-stone-200" : "hover:text-stone-200"
                }`}
              >
                English
              </button>
            </div>

            {/* Moyens de paiement */}
            <div className="flex items-center gap-2" title="Paiements sécurisés par GeniusPay">
              {paymentLogos.map((p) => (
                <div
                  key={p.name}
                  className="flex h-6 w-9 items-center justify-center rounded-md bg-white p-0.5 opacity-85 hover:opacity-100 transition-opacity"
                  title={p.name}
                >
                  <img
                    src={p.src}
                    alt={p.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}