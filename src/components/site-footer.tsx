import { Link } from "@tanstack/react-router";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUpRight,
  Sparkles,
  MessageCircle,
  Send,
  ShieldCheck,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";
import { useLanguageNavigation } from "@/lib/i18n-routing";

import waveImg from "@/assets/wave.png";
import omImg from "@/assets/om.png";
import mtnImg from "@/assets/mtn.jpg";
import moovImg from "@/assets/moov.png";
import visaImg from "@/assets/visa.png";

export function SiteFooter() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const linkClass =
    "group inline-flex items-center gap-1.5 text-stone-300 transition-colors duration-200 hover:text-gold text-xs sm:text-sm";

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    toast.success(
      t(
        "footer.newsletterSuccess",
        "Merci ! Vous êtes inscrit(e) aux actualités exclusives Cereals House.",
      ),
    );
    setNewsletterEmail("");
  };

  const paymentLogos = [
    { name: "Wave", src: waveImg },
    { name: "Orange Money", src: omImg },
    { name: "MTN Money", src: mtnImg },
    { name: "Moov Money", src: moovImg },
    { name: "Visa", src: visaImg },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-gold/30 bg-[#0F0C09] text-stone-100">
      {/* Halo d'ambiance doré subtil en bas du footer */}
      <div
        className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Liseré doré de signature */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold/70 to-transparent shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

      {/* Monogramme géant filigrane */}
      <div className="pointer-events-none absolute -right-10 top-0 select-none font-display text-[260px] font-bold leading-none text-gold/[0.02]">
        CH
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* ============================================================ */}
          {/* COLONNE 1 : Marque & Newsletter Privilège (4 colonnes)        */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 space-y-5">
            <Link to={getLocalizedPath("/")} className="group flex items-center gap-3">
              <img
                src={logo}
                alt="Cereals House"
                className="h-12 w-12 rounded-full ring-2 ring-gold/40 shadow-sm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105 group-hover:ring-gold/70"
              />
              <div>
                <div className="font-display text-xl font-bold text-white tracking-tight">
                  Cereals House
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold motion-safe:animate-pulse" />
                  <span>{t("header.tagline", "Terroirs Nobles d'Afrique")}</span>
                </div>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-sm">
              {t(
                "footer.description",
                "Céréales africaines ancestrales et farines d'éveil pures. Sélectionnées à la main, moulues sur meule de pierre et scellées sous écrin hermétique.",
              )}
            </p>

            {/* Newsletter Privilège */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />{" "}
                {t("footer.clubTitle", "Club Recettes & Offres Privilège")}
              </span>
              <form onSubmit={handleNewsletter} className="mt-2.5 flex items-center gap-2 max-w-sm">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={t("footer.newsletterPlaceholder", "Votre adresse email...")}
                  required
                  className="w-full rounded-full border border-stone-800 bg-stone-950/80 px-4 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
                <button
                  type="submit"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-[#14110F] shadow-sm transition-transform hover:scale-105 hover:bg-gold/90 cursor-pointer"
                  title="S'inscrire"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLONNE 2 : Boutique & Univers (2 colonnes)                  */}
          {/* ============================================================ */}
          <div className="lg:col-span-2 sm:col-span-6">
            <h4 className="relative inline-block text-xs font-bold uppercase tracking-widest text-gold">
              {t("footer.shop", "Boutique")}
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-5 bg-gold/60" />
            </h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to={getLocalizedPath("/products")} className={linkClass}>
                  <span>{t("footer.allProducts", "Tous les Produits")}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100 text-gold" />
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className={linkClass}>
                  <span>{t("footer.cerealsGrains", "Céréales & Grains")}</span>
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/products")} className={linkClass}>
                  <span>{t("footer.babyFlours", "Farines Infantiles Bio")}</span>
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/orders")} className={linkClass}>
                  <span>{t("footer.orderTracking", "Suivi de Commande")}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100 text-gold" />
                </Link>
              </li>
            </ul>
          </div>

          {/* ============================================================ */}
          {/* COLONNE 3 : Maison & Engagements (3 colonnes)                */}
          {/* ============================================================ */}
          <div className="lg:col-span-3 sm:col-span-6">
            <h4 className="relative inline-block text-xs font-bold uppercase tracking-widest text-gold">
              {t("footer.company", "Maison Cereals House")}
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-5 bg-gold/60" />
            </h4>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to={getLocalizedPath("/about")} className={linkClass}>
                  <span>{t("footer.about", "Notre Histoire & Meunerie")}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100 text-gold" />
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className={linkClass}>
                  <span>{t("footer.wholesaleLink", "Vente en Gros & Devis B2B")}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 transition-all duration-200 group-hover:opacity-100 text-gold" />
                </Link>
              </li>
              <li>
                <Link to={getLocalizedPath("/contact")} className={linkClass}>
                  <span>{t("footer.retailLink", "Points de Vente & Relais")}</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/2250584637219?text=Bonjour%20Cereals%20House,%20je%20souhaite%20un%20renseignement."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 font-medium transition"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{t("footer.whatsappDirect", "WhatsApp Direct (7j/7)")}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* ============================================================ */}
          {/* COLONNE 4 : Contact Direct & Coordonnées (3 colonnes)         */}
          {/* ============================================================ */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="relative inline-block text-xs font-bold uppercase tracking-widest text-gold">
              {t("footer.contactTitle", "Service Client")}
              <span className="absolute -bottom-1.5 left-0 h-0.5 w-5 bg-gold/60" />
            </h4>

            <ul className="mt-5 space-y-3 text-xs sm:text-sm text-stone-300 font-light">
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold border border-gold/25">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span>+225 05 84 63 72 19</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold border border-gold/25">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">apiahrose8@gmail.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold/15 text-gold border border-gold/25">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span>Abidjan, Côte d'Ivoire & UEMOA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bandeau des Partenaires de Paiement Sécurisé */}
        <div className="mt-12 border-t border-stone-800/80 pt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span>{t("footer.securePayments", "Paiements instantanés & 100% sécurisés :")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {paymentLogos.map((p) => (
              <div
                key={p.name}
                className="flex h-7 items-center justify-center rounded-lg border border-stone-800 bg-stone-900/90 px-2 py-0.5 shadow-2xs transition hover:border-gold/40"
                title={p.name}
              >
                <img src={p.src} alt={p.name} className="h-4 max-w-[42px] object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Ligne inférieure de Copyright & Mentions */}
        <div className="mt-6 border-t border-stone-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 font-light">
          <p>© {new Date().getFullYear()} Cereals House. {t("footer.rights", "Tous droits réservés.")}</p>
          <div className="flex items-center gap-4 text-stone-400">
            <Link to={getLocalizedPath("/about")} className="hover:text-gold transition">{t("footer.privacy", "Confidentialité")}</Link>
            <span>·</span>
            <Link to={getLocalizedPath("/about")} className="hover:text-gold transition">{t("footer.terms", "Conditions Générales")}</Link>
            <span>·</span>
            <Link to={getLocalizedPath("/contact")} className="hover:text-gold transition">{t("footer.support", "Support Client")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}