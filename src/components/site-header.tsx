import { Link } from "@tanstack/react-router";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Search,
  Sparkles,
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    { to: "/products", label: t("nav.shop", "Boutique & Céréales") },
    { to: "/about", label: t("nav.about", "Notre Histoire") },
    { to: "/contact", label: t("nav.contact", "Contact & Devis") },
  ] as const;

  const iconBtn =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-all duration-200 ease-out hover:scale-105 hover:bg-secondary/80 hover:text-gold active:scale-95 cursor-pointer border border-transparent hover:border-gold/20";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? "py-2 sm:py-2.5"
            : "py-3 sm:py-3.5"
        }`}
      >
        <div
          className={`mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-6 lg:px-6 xl:px-8 rounded-2xl sm:rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled
              ? "border border-gold/30 bg-white/55 dark:bg-[#18110B]/65 shadow-[0_16px_40px_-12px_rgba(20,15,10,0.12)] backdrop-blur-2xl"
              : "border border-gold/20 bg-white/40 dark:bg-[#18110B]/45 shadow-[0_4px_24px_-6px_rgba(20,15,10,0.06)] backdrop-blur-xl"
          }`}
        >
          {/* Logo & Slogan de Prestige */}
          <Link to={getLocalizedPath("/")} className="group flex shrink-0 items-center gap-2.5 sm:gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-gold/40 to-amber-600/10 opacity-0 blur-xs transition-opacity duration-300 group-hover:opacity-100" />
              <img
                src={logo}
                alt="Cereals House"
                className="relative h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full object-cover ring-1.5 ring-gold/40 shadow-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:ring-gold/80"
              />
            </div>
            <div className="whitespace-nowrap leading-tight">
              <div className="font-display text-base sm:text-lg font-bold text-stone-950 dark:text-stone-100 tracking-tight transition-colors duration-200 group-hover:text-gold">
                Cereals <span className="text-gold font-serif italic">House</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-semibold">
                <span>{t("header.tagline", "Terroirs d'Afrique")}</span>
              </div>
            </div>
          </Link>

          {/* Navigation desktop aérée et éditoriale */}
          <nav className="hidden shrink-0 items-center gap-5 lg:flex xl:gap-7 2xl:gap-8 mx-auto px-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={getLocalizedPath(n.to)}
                activeOptions={{ exact: n.to === "/" }}
                className="group relative whitespace-nowrap py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-700 dark:text-stone-300 transition-colors duration-300 hover:text-stone-950 dark:hover:text-gold [&.active]:text-amber-900 dark:[&.active]:text-gold cursor-pointer"
                activeProps={{ className: "active" }}
              >
                {n.label}
                <span className="pointer-events-none absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold to-amber-600 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:w-full [.active_&]:w-full shadow-[0_0_8px_rgba(200,157,66,0.6)]" />
              </Link>
            ))}
          </nav>

          {/* Actions & Réglages */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {/* Bouton Recherche Instantanée Glassmorphism */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-full border border-stone-200/60 dark:border-stone-700/60 bg-white/40 dark:bg-white/5 px-2.5 py-1.5 sm:px-3 text-xs text-stone-600 dark:text-stone-300 transition hover:border-gold/40 hover:bg-white/70 dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-2xs backdrop-blur-sm"
              title="Rechercher (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5 text-gold shrink-0" />
              <span className="hidden 2xl:inline">{t("header.search", "Rechercher une céréale...")}</span>
              <kbd className="rounded border border-stone-200/80 dark:border-stone-700 bg-white/60 dark:bg-stone-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className={`${iconBtn} md:hidden`}
              aria-label="Recherche"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Sélecteur de Pays & Devise */}
            <div className="hidden sm:flex items-center">
              <CountrySelector />
            </div>

            {/* Menu Utilisateur Intégré avec Déconnexion et Commandes dans l'Avatar */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 p-1 pr-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:border-gold hover:bg-gold/15 active:scale-95 cursor-pointer shadow-xs"
                  title="Mon Compte & Déconnexion"
                  aria-expanded={userDropdownOpen}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold border border-gold/40 shadow-2xs">
                    {getInitial()}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gold transition-transform duration-200 ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Utilisateur */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/80 bg-background/98 p-2 text-foreground shadow-2xl backdrop-blur-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-150 z-50">
                    {/* Header profil */}
                    <div className="flex items-center gap-3 border-b border-border/60 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold border border-gold/40">
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

                    {/* Liens rapides du compte */}
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

                    {/* Bouton de Déconnexion */}
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

            {/* Bouton Panier interactif ouvrant le Cart Drawer */}
            <button
              id="site-cart-icon"
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex shrink-0 items-center gap-2 rounded-full border border-gold/30 bg-gold/10 hover:border-gold/60 hover:bg-gold/20 px-2.5 py-1.5 sm:px-3 sm:py-2 text-stone-900 dark:text-stone-100 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] active:scale-95 cursor-pointer shadow-xs"
              aria-label={t("nav.cart", "Panier")}
            >
              <ShoppingBag className="h-4 w-4 text-amber-900 dark:text-gold shrink-0" />
              <span className="hidden sm:inline text-xs font-bold tracking-tight">
                {t("nav.cart", "Panier")}
              </span>
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-gold via-amber-400 to-amber-600 px-1.5 text-[10px] font-black text-stone-950 shadow-xs ring-1 ring-white/20 motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-200"
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
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-gold" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Navigation Mobile avec fond verre fumé */}
        {mobileMenuOpen && (
          <div className="border-t border-border/70 bg-background/98 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 lg:hidden shadow-xl">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-5">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={getLocalizedPath(n.to)}
                  activeOptions={{ exact: n.to === "/" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 hover:bg-secondary hover:text-gold flex items-center justify-between [&.active]:text-gold [&.active]:bg-gold/10"
                  activeProps={{ className: "active" }}
                >
                  <span>{n.label}</span>
                  <span className="text-xs text-gold">→</span>
                </Link>
              ))}

              <div className="mt-4 border-t border-border pt-4">
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
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold via-amber-400 to-gold py-3.5 text-sm font-bold text-[#14110F] shadow-gold"
                >
                  <User className="h-4 w-4" /> {t("nav.signIn", "Se connecter / S'inscrire")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer pour compenser la hauteur du header fixe (80px) et éviter tout chevauchement */}
      <div className="h-20 w-full shrink-0" aria-hidden="true" />

      {/* Tiroir Panier interactif */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Modal Spotlight Search */}
      <SpotlightSearch open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}