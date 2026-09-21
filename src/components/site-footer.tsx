import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { CerealMotifBackground } from "@/components/ui/cereal-motif-background";
import { toast } from "sonner";
import {
  Wheat,
  ShieldCheck,
  Sparkles,
  Truck,
  Lock,
  Mail,
  ArrowRight,
  Phone,
  MapPin,
  Check,
  MessageCircle,
} from "lucide-react";

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

  const trustPillars = [
    {
      icon: Wheat,
      title: "Origine 100% Terroir",
      description: "Filières nobles d'Afrique de l'Ouest sélectionnées chez nos coopératives partenaires.",
    },
    {
      icon: Sparkles,
      title: "Pureté & Zéro Impureté",
      description: "Moulues sur meule de pierre, sans sable, sans conservateurs ni additifs chimiques.",
    },
    {
      icon: Truck,
      title: "Expédition Express",
      description: "Livraison rapide à Abidjan & expédition soignée dans toute la sous-région.",
    },
    {
      icon: ShieldCheck,
      title: "Paiements Certifiés",
      description: "Transactions chiffrées SSL par Wave, Orange Money, MTN, Moov et Visa.",
    },
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
    <footer className="relative mt-16 sm:mt-24 bg-[#120D0A] text-stone-300 overflow-hidden border-t border-gold/30 shadow-[0_-20px_50px_rgba(0,0,0,0.35)]">
      {/* Halo lumineux d'ambiance terroir */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-gold/15 via-amber-700/5 to-transparent blur-3xl opacity-60" />

      {/* Motifs de céréales dorés élégants */}
      <CerealMotifBackground variant="footer" showLargeSheaf={false} className="opacity-25" />

      {/* ─── BANDEAU DE RÉASSURANCE NOBLE ─── */}
      <div className="relative z-10 border-b border-gold/15 bg-black/25 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustPillars.map((pillar, idx) => {
              const IconComponent = pillar.icon;
              return (
                <div
                  key={idx}
                  className="group flex items-start gap-3.5 p-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] border border-transparent hover:border-gold/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-amber-900/30 border border-gold/40 text-gold shadow-xs group-hover:scale-110 group-hover:border-gold transition-transform duration-300">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-white group-hover:text-gold transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-stone-400 font-light">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CONTENU PRINCIPAL DU FOOTER ─── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 pb-12 border-b border-stone-800/80">
          {/* Colonne Marque & Identité (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to={getLocalizedPath("/")} className="group inline-flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-gold/50 to-amber-600/20 opacity-40 blur-xs transition-opacity duration-300 group-hover:opacity-100" />
                <img
                  src={logo}
                  alt="Cereals House"
                  className="relative h-12 w-12 shrink-0 rounded-full object-cover ring-1.5 ring-gold/60 shadow-md group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="font-display text-xl font-bold tracking-tight text-white group-hover:text-gold transition-colors">
                  Cereals <span className="text-gold font-serif italic">House</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gold/80 font-semibold">
                  Terroirs d'Afrique
                </div>
              </div>
            </Link>

            <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
              Maison d'excellence céréalière dédiée aux grains nobles d'Afrique de l'Ouest. Cultivés avec respect, transformés avec rigueur meunière et savourés avec fierté.
            </p>

            {/* Coordonnées & Badge Atelier */}
            <div className="space-y-2 pt-1 text-xs text-stone-300 font-light">
              <div className="flex items-start gap-2 text-stone-400">
                <MapPin className="h-4 w-4 shrink-0 text-gold/80 mt-0.5" />
                <span>9 Boulevard de France, Cocody Riviera • Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-stone-400">
                <a
                  href="mailto:contact@cereals-house.com"
                  className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-gold/80" />
                  contact@cereals-house.com
                </a>
                <span>•</span>
                <a
                  href="tel:+2250584637219"
                  className="inline-flex items-center gap-1.5 hover:text-gold transition-colors font-medium text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-gold/80" />
                  (+225) 05 84 63 72 19
                </a>
              </div>
            </div>

            {/* Réseaux sociaux & Conciergerie */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20des%20renseignements"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20 shadow-xs cursor-pointer"
                title="Service Client WhatsApp"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium">WhatsApp Direct 7j/7</span>
              </a>

              <a
                href="https://www.facebook.com/share/1HjoGWMccN/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-700 bg-white/5 text-stone-300 transition hover:border-gold hover:bg-gold hover:text-stone-950 cursor-pointer shadow-2xs"
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-700 bg-white/5 text-stone-300 transition hover:border-gold hover:bg-gold hover:text-stone-950 cursor-pointer shadow-2xs"
                aria-label="TikTok"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Colonne 1 : Découverte (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
              <span>{t("footer.company", "Maison")}</span>
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/")} className="hover:text-gold transition inline-block py-0.5">
                  {t("nav.home", "Accueil")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/about")} className="hover:text-gold transition inline-block py-0.5">
                  {t("footer.about", "Notre Histoire & Meunerie")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className="hover:text-gold transition inline-block py-0.5">
                  {t("footer.contact", "Nous contacter")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/about")} className="hover:text-gold transition inline-block py-0.5">
                  {t("footer.retailLink", "Points de Vente & Relais")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 2 : Boutique & Sélections (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
              <span>{t("footer.shop", "Boutique")}</span>
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-light">
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition inline-block py-0.5">
                  {t("footer.allProducts", "Toutes les céréales")}
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition inline-block py-0.5">
                  Farines d'Éveil Bébé
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition inline-block py-0.5">
                  Fonio Noble Précuit
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className="hover:text-gold transition inline-block py-0.5">
                  Mil Perlé Tamisé
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/cart")} className="hover:text-gold transition inline-block py-0.5">
                  {t("footer.cart", "Mon panier")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Le Cercle Terroir / Newsletter & Privilèges (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-amber-900/10 to-stone-900/40 p-5 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2 text-gold">
                <Wheat className="h-4 w-4" />
                <span className="font-display text-xs font-bold uppercase tracking-wider text-white">
                  {t("footer.clubTitle", "Le Cercle Terroir")}
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-stone-300 font-light">
                Recevez nos récoltes fraîches, nos idées recettes ancestrales et nos offres réservées aux membres.
              </p>

              {newsletterSubscribed ? (
                <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/15 p-3 text-xs text-gold font-medium">
                  <Check className="h-4 w-4 shrink-0 text-gold" />
                  <span>{t("footer.newsletterSuccess", "Bienvenue dans le Cercle Cereals House !")}</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="mt-3.5 space-y-2">
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={t("footer.newsletterPlaceholder", "Votre email...")}
                      className="w-full rounded-full border border-stone-700 bg-stone-950/70 py-2 pl-3.5 pr-24 text-xs text-white placeholder-stone-500 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 rounded-full bg-gradient-to-r from-gold to-amber-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-950 transition hover:brightness-110 active:scale-95 cursor-pointer shadow-xs"
                    >
                      Rejoindre
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 font-light">
                    Aucun spam. Désinscription possible en un clic.
                  </p>
                </form>
              )}
            </div>

            {/* Suivi & Espace Grossiste */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 pt-1">
              <Link
                to={getLocalizedPath("/orders")}
                className="hover:text-gold transition inline-flex items-center gap-1 font-medium"
              >
                <span>{t("footer.orderTracking", "Suivi de colis")}</span>
                <ArrowRight className="h-3 w-3 text-gold/70" />
              </Link>
              <span>•</span>
              <Link
                to={getLocalizedPath("/contact")}
                className="hover:text-gold transition inline-flex items-center gap-1"
              >
                <span>{t("footer.wholesaleLink", "Devis B2B Grossiste")}</span>
                <ArrowRight className="h-3 w-3 text-gold/70" />
              </Link>
            </div>
          </div>
        </div>

        {/* ─── BARRE INFÉRIEURE : COPYRIGHT, LANGUES & PAIEMENTS SÉCURISÉS ─── */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-400">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-stone-500 text-[11px]">
            <span>© {new Date().getFullYear()} Cereals House. {t("footer.rights", "Tous droits réservés.")}</span>
            <span>•</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-gold transition">
              {t("footer.terms", "Conditions Générales (CGV)")}
            </Link>
            <span>•</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-gold transition">
              {t("footer.privacy", "Politique de Confidentialité")}
            </Link>
          </div>

          {/* Sélecteur de Langue discret + Logos de paiement */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            {/* Langue */}
            <div className="flex items-center rounded-full border border-gold/30 bg-black/40 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => switchLanguage("fr")}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  currentLang === "fr"
                    ? "bg-gradient-to-r from-gold to-amber-600 text-stone-950 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Passer en Français"
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => switchLanguage("en")}
                className={`px-3 py-1 rounded-full transition cursor-pointer ${
                  currentLang === "en"
                    ? "bg-gradient-to-r from-gold to-amber-600 text-stone-950 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Logos de paiements avec badge sécurisé */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                <Lock className="h-3 w-3 text-gold" />
                <span>SSL</span>
              </div>
              <div className="flex items-center gap-2">
                {paymentLogos.map((p) => (
                  <div
                    key={p.name}
                    className="flex h-6 w-9 items-center justify-center rounded-sm bg-white/90 p-0.5 shadow-2xs transition hover:scale-105"
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
      </div>
    </footer>
  );
}