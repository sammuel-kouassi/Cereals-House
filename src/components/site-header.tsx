import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Search,
  Package,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin/use-is-admin";
import { CountrySelector } from "@/components/country-selector";
import { CartDrawer } from "@/components/cart-drawer";
import { SpotlightSearch } from "@/components/spotlight-search";
import logo from "@/assets/logo.jpeg";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function SiteHeader() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 15);
      // Barre de progression de lecture : mise à jour directe du style, sans re-render
      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermeture du menu utilisateur au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayName = () => {
    return user?.full_name?.trim() || user?.email?.split("@")[0] || "Client";
  };

  const getInitial = () => {
    const name = user?.full_name?.trim();
    if (name) return name[0].toUpperCase();
    return (user?.email?.[0] || "C").toUpperCase();
  };

  const nav = [
    { to: "/", label: t("nav.home", "Accueil") },
    { to: "/products", label: t("nav.shop", "Boutique") },
    { to: "/about", label: t("nav.about", "À Propos") },
    { to: "/contact", label: t("nav.contact", "Contact") },
  ] as const;

  const iconBtn =
    "relative flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-stone-700 dark:text-stone-300 transition-colors duration-200 hover:bg-stone-900/5 hover:text-stone-950 dark:hover:bg-white/5 dark:hover:text-stone-50 cursor-pointer";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full px-3 sm:px-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled ? "py-1.5 sm:py-2" : "py-2 sm:py-2.5"
        }`}
      >
        {/* Barre de progression de lecture */}
        <div
          ref={progressRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-[2px] w-full origin-left bg-gold"
          style={{ transform: "scaleX(0)" }}
        />
        {/* Barre de navigation */}
        <div
          className={`relative mx-auto flex max-w-7xl items-center justify-between gap-2.5 rounded-full border pl-3.5 pr-3 transition-[height,box-shadow,background-color] duration-300 sm:gap-4 sm:pl-5 sm:pr-4 ${
            scrolled
              ? "h-13 sm:h-14 border-stone-200 bg-[#fbf8f3]/95 shadow-[0_6px_24px_-12px_rgba(44,27,17,0.18)] backdrop-blur-md dark:border-stone-800 dark:bg-[#140F0A]/95"
              : "h-14 sm:h-[58px] border-stone-200/80 bg-[#fbf8f3]/90 backdrop-blur-md dark:border-stone-800 dark:bg-[#140F0A]/90"
          }`}
        >
          {/* Logo & Identité Prestige */}
          <Link
            to={getLocalizedPath("/")}
            className="group flex shrink-0 items-center gap-2 sm:gap-2.5 cursor-pointer"
          >
            <img
              src={logo}
              alt="Cereals House"
              className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-stone-300 sm:h-9 sm:w-9 dark:ring-stone-700"
            />
            <div className="whitespace-nowrap leading-tight">
              <div className="font-display text-base text-stone-950 sm:text-lg dark:text-stone-50">
                Cereals <em className="text-amber-800 dark:text-gold">House</em>
              </div>
              <div className="hidden text-xs italic text-stone-500 sm:block">
                {t("header.tagline", "Terroirs d'Afrique")}
              </div>
            </div>
          </Link>

          {/* Navigation desktop avec pastille active tactile & fluide */}
          <nav className="hidden shrink-0 items-center gap-0.5 lg:flex xl:gap-2 mx-auto px-1 xl:px-2" aria-label="Navigation principale">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={getLocalizedPath(n.to)}
                activeOptions={{ exact: n.to === "/" }}
                className="relative whitespace-nowrap px-2.5 py-2 text-[0.95rem] text-stone-600 transition-colors duration-200 hover:text-stone-950 xl:px-3.5 dark:text-stone-400 dark:hover:text-stone-50 [&.active]:text-stone-950 dark:[&.active]:text-stone-50 [&.active]:underline [&.active]:decoration-gold [&.active]:decoration-[1.5px] [&.active]:underline-offset-[6px] cursor-pointer"
                activeProps={{ className: "active" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Actions & Contrôles Rapides */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-2.5">
            {/* Bouton Recherche Instantanée Capsule */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-600 transition-colors duration-200 hover:border-stone-500 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:text-stone-100 cursor-pointer"
              title="Rechercher (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden 2xl:inline">{t("header.search", "Rechercher...")}</span>
              <kbd className="rounded border border-stone-300 px-1.5 py-0.5 font-sans text-[10px] text-stone-500 dark:border-stone-700 dark:text-stone-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className={`${iconBtn} md:hidden`}
              aria-label="Recherche"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Sélecteur de Pays & Devise */}
            <div className="hidden sm:flex items-center">
              <CountrySelector compact />
            </div>

            {/* Menu Utilisateur Intégré avec Avatar interactif */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-full border border-stone-300 p-1 pr-2.5 text-xs text-foreground transition-colors duration-200 hover:border-stone-500 dark:border-stone-700 cursor-pointer"
                  title="Mon Compte"
                  aria-expanded={userDropdownOpen}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2c1b11] text-xs text-stone-50 dark:bg-gold dark:text-stone-950">
                    {getInitial()}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-stone-500 transition-transform duration-300 ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Utilisateur */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-background p-2 text-foreground shadow-[0_12px_32px_-12px_rgba(44,27,17,0.25)] dark:border-stone-800 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150">
                    <div className="flex items-center gap-3 border-b border-border/60 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2c1b11] text-sm text-stone-50 dark:bg-gold dark:text-stone-950">
                        {getInitial()}
                      </span>
                      <div className="overflow-hidden">
                        <div className="truncate text-xs font-bold text-primary">
                          {getDisplayName()}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground font-light">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="py-1.5 space-y-0.5">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Espace Administration</span>
                        </Link>
                      )}

                      <Link
                        to={getLocalizedPath("/orders")}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground/90 transition-colors hover:bg-secondary hover:text-gold"
                      >
                        <Package className="h-4 w-4 text-gold" />
                        <span>{t("nav.orders", "Mes commandes")}</span>
                      </Link>
                    </div>

                    <div className="border-t border-border/60 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t("nav.logout", "Se déconnecter")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={getLocalizedPath("/auth")}
                search={{ redirect: getLocalizedPath("/") }}
                className={iconBtn}
                aria-label={t("nav.account", "Mon compte")}
                title={t("nav.signIn", "Se connecter")}
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}

            {/* Bouton Panier Joyau interactif */}
            <button
              id="site-cart-icon"
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#2c1b11] px-3.5 text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] sm:h-9 dark:bg-gold dark:text-stone-950 dark:hover:bg-gold/90 cursor-pointer"
              aria-label={t("nav.cart", "Panier")}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="hidden text-sm sm:inline lg:hidden xl:inline">
                {t("nav.cart", "Panier")}
              </span>
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] tabular-nums text-stone-950 dark:bg-[#2c1b11] dark:text-gold motion-safe:animate-in motion-safe:zoom-in-90 motion-safe:duration-200"
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Bouton Menu Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className={`${iconBtn} lg:hidden`}
              aria-label={t("nav.menu", "Menu")}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Navigation Mobile avec fond verre fumé */}
        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-lg rounded-2xl border border-stone-200 bg-background p-3 shadow-[0_16px_40px_-16px_rgba(44,27,17,0.3)] dark:border-stone-800 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 lg:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={getLocalizedPath(n.to)}
                  activeOptions={{ exact: n.to === "/" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-4 py-3 font-display text-lg text-stone-800 transition-colors duration-200 hover:bg-stone-900/5 dark:text-stone-200 [&.active]:text-amber-800 dark:[&.active]:text-gold"
                  activeProps={{ className: "active" }}
                >
                  <span>{n.label}</span>
                  <span aria-hidden="true" className="text-sm text-stone-400">→</span>
                </Link>
              ))}

              <div className="mt-3 border-t border-border pt-3">
                <CountrySelector />
              </div>

              {/* Section Compte Mobile */}
              {user ? (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                      {getInitial()}
                    </span>
                    <span className="text-sm font-semibold text-primary">{getDisplayName()}</span>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-secondary"
                    >
                      <ShieldCheck className="h-4 w-4" /> Administration
                    </Link>
                  )}

                  <Link
                    to={getLocalizedPath("/orders")}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition hover:bg-secondary hover:text-gold"
                  >
                    <Package className="h-4 w-4 text-gold" /> {t("nav.orders", "Mes commandes")}
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> {t("nav.logout", "Se déconnecter")}
                  </button>
                </div>
              ) : (
                <Link
                  to={getLocalizedPath("/auth")}
                  search={{ redirect: getLocalizedPath("/") }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#2c1b11] py-3.5 text-sm text-stone-50 dark:bg-gold dark:text-stone-950"
                >
                  <User className="h-4 w-4" /> {t("nav.signIn", "Se connecter / S'inscrire")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer pour compenser la hauteur du header fixe et éviter tout chevauchement */}
      <div className="h-[76px] sm:h-[88px] w-full shrink-0" aria-hidden="true" />

      {/* Tiroir Panier interactif */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Modal Spotlight Search */}
      <SpotlightSearch open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}