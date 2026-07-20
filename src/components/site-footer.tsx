import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.jpeg";

export function SiteFooter() {
  const { t } = useTranslation();

  const linkClass =
    "group inline-flex items-center gap-1 text-primary-foreground/80 transition-colors duration-300 hover:text-gold";

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-primary text-primary-foreground">
      {/* Liseré doré en haut, signature discrète de la marque */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      {/* Monogramme géant en filigrane, purement décoratif */}
      <div className="pointer-events-none absolute -right-10 -top-10 select-none font-display text-[220px] font-bold leading-none text-gold/[0.03]">
        CH
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="group flex items-center gap-3">
            <img
              src={logo}
              alt=""
              className="h-12 w-12 rounded-full ring-2 ring-gold/50 transition-all duration-500 ease-out group-hover:rotate-6 group-hover:scale-105 group-hover:ring-gold/80"
            />
            <div>
              <div className="font-display text-xl font-bold text-gold">Cereals House</div>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary-foreground/60">
                <span className="h-1 w-1 rounded-full bg-gold motion-safe:animate-pulse" />
                {t("footer.tagline")}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">{t("footer.description")}</p>
        </div>

        <div>
          <h4 className="relative inline-block text-sm font-semibold uppercase tracking-widest text-gold">
            {t("footer.shop")}
            <span className="absolute -bottom-1.5 left-0 h-px w-6 bg-gold/50" />
          </h4>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/products" className={linkClass}>
                {t("footer.allProducts")}
                <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
            <li>
              <Link to="/cart" className={linkClass}>
                {t("footer.cart")}
                <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
            <li>
              <Link to="/orders" className={linkClass}>
                {t("footer.orderTracking")}
                <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="relative inline-block text-sm font-semibold uppercase tracking-widest text-gold">
            {t("footer.company")}
            <span className="absolute -bottom-1.5 left-0 h-px w-6 bg-gold/50" />
          </h4>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <Link to="/about" className={linkClass}>
                {t("footer.about")}
                <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
            <li>
              <Link to="/contact" className={linkClass}>
                {t("footer.contact")}
                <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="relative inline-block text-sm font-semibold uppercase tracking-widest text-gold">
            {t("footer.contactTitle")}
            <span className="absolute -bottom-1.5 left-0 h-px w-6 bg-gold/50" />
          </h4>
          <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
            <li className="group flex items-center gap-2.5 transition-colors duration-300 hover:text-gold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/5 transition-colors duration-300 group-hover:bg-gold/15">
                <Phone className="h-3.5 w-3.5 text-gold" />
              </span>
              +225 05 84 63 72 19
            </li>
            <li className="group flex items-center gap-2.5 transition-colors duration-300 hover:text-gold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/5 transition-colors duration-300 group-hover:bg-gold/15">
                <Mail className="h-3.5 w-3.5 text-gold" />
              </span>
              apiahrose8@gmail.com
            </li>
            <li className="group flex items-center gap-2.5 transition-colors duration-300 hover:text-gold">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/5 transition-colors duration-300 group-hover:bg-gold/15">
                <MapPin className="h-3.5 w-3.5 text-gold" />
              </span>
              Abidjan, Côte d'Ivoire
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Cereals House. {t("footer.rights")}</p>
          <p className="transition-colors duration-300 hover:text-primary-foreground/90">{t("footer.payments")}</p>
        </div>
      </div>
    </footer>
  );
}