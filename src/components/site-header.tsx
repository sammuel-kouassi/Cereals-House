import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, LogOut, ShieldCheck, Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin/use-is-admin";
import { CountrySelector } from "@/components/country-selector";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CartDrawer } from "@/components/cart-drawer";
import { SpotlightSearch } from "@/components/spotlight-search";
import logo from "@/assets/logo.jpeg";

export function SiteHeader() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [greetingKey, setGreetingKey] = useState<"greeting.morning" | "greeting.evening">(
    "greeting.morning",
  );

  useEffect(() => {
    const hour = new Date().getHours();
    setGreetingKey(hour >= 17 ? "greeting.evening" : "greeting.morning");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getShortName = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(" ");
      if (parts.length > 1) {
        return `${parts[0]} ${parts[1][0]}.`;
      }
      return parts[0];
    }
    return user?.email?.split("@")[0] || "Client";
  };

  const getInitial = () => {
    const name = user?.full_name?.trim();
    if (name) return name[0].toUpperCase();
    return (user?.email?.[0] || "C").toUpperCase();
  };

  const greetingLabel = `${t(greetingKey as any) || (greetingKey === "greeting.evening" ? "Bonsoir" : "Bonjour")}, ${getShortName()}`;

  const nav = [
    { to: "/", label: t("nav.home", "Accueil") },
    { to: "/products", label: t("nav.shop", "Boutique & Céréales") },
    { to: "/about", label: t("nav.about", "Notre Histoire") },
    { to: "/contact", label: t("nav.contact", "Contact & Devis") },
  ] as const;

  const iconBtn =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-all duration-200 ease-out hover:scale-105 hover:bg-secondary hover:text-gold active:scale-95 cursor-pointer";

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "border-border shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] bg-background/95 py-0"
            : "border-border/60 py-0.5"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          {/* Logo & Slogan */}
          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <img
              src={logo}
              alt="Cereals House"
              className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover ring-2 ring-gold/40 transition-all duration-500 ease-out group-hover:rotate-6 group-hover:scale-105 group-hover:ring-gold/70 shadow-sm"
            />
            <div className="whitespace-nowrap leading-tight">
              <div className="font-display text-lg sm:text-xl font-bold text-primary transition-all duration-300 group-hover:tracking-wide">
                Cereals House
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold motion-safe:animate-pulse" />
                {t("header.tagline", "Céréales d'Afrique & Nutrition")}
              </div>
            </div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden shrink-0 items-center gap-4 lg:flex xl:gap-6">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="group relative whitespace-nowrap py-1 text-xs font-semibold uppercase tracking-wider text-foreground/80 transition-colors duration-200 hover:text-gold [&.active]:text-gold xl:text-sm xl:normal-case xl:font-medium xl:tracking-normal"
                activeProps={{ className: "active" }}
              >
                {n.label}
                <span className="pointer-events-none absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gold transition-all duration-200 ease-out group-hover:w-full [.active_&]:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions & Réglages */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Bouton Recherche Instantanée */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-gold/40 hover:bg-secondary hover:text-foreground cursor-pointer"
              title="Rechercher (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5 text-gold" />
              <span className="hidden xl:inline">{t("header.search", "Rechercher...")}</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
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

            {/* Sélecteurs Pays & Langue */}
            <div className="hidden items-center gap-1 sm:flex">
              <CountrySelector />
              <div className="hidden 2xl:block">
                <LanguageSwitcher />
              </div>
            </div>

            <div className="mx-0.5 hidden h-5 w-px shrink-0 bg-border/80 sm:block" />

            {/* Espace Utilisateur */}
            {user ? (
              <div className="flex shrink-0 items-center gap-1">
                <div
                  title={`${greetingLabel} (${user.email})`}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 p-1 pr-1.5 text-xs font-medium text-foreground/80 transition-colors duration-200 hover:border-gold/40 xl:pr-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {getInitial()}
                  </span>
                  <span className="hidden whitespace-nowrap text-xs font-semibold text-primary 2xl:inline">
                    {greetingLabel}
                  </span>
                </div>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`${iconBtn} text-gold`}
                    title="Espace Administration"
                    aria-label="Administration"
                  >
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                )}

                <Link
                  to="/orders"
                  className={iconBtn}
                  title={t("nav.orders", "Mes commandes")}
                  aria-label={t("nav.orders", "Mes commandes")}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  className={`${iconBtn} hover:bg-red-500/10 hover:text-red-500`}
                  title={t("nav.logout", "Se déconnecter")}
                  aria-label={t("nav.logout", "Se déconnecter")}
                >
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                search={{ redirect: "/" }}
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
              className={iconBtn}
              aria-label={t("nav.cart", "Panier")}
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalItems > 0 && (
                <span
                  key={totalItems}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground shadow-sm motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-200"
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
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Navigation Mobile */}
        {mobileMenuOpen && (
          <div className="border-t border-border/60 bg-background/98 backdrop-blur-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 hover:bg-secondary hover:text-gold"
                >
                  {n.label}
                </Link>
              ))}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <CountrySelector />
                <LanguageSwitcher />
              </div>

              {/* Section Compte Mobile */}
              {user ? (
                <div className="mt-3 space-y-1 border-t border-border pt-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                      {getInitial()}
                    </span>
                    <span className="text-sm font-semibold text-primary">{greetingLabel}</span>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-secondary"
                    >
                      <ShieldCheck className="h-4 w-4" /> Administration
                    </Link>
                  )}

                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-secondary hover:text-gold"
                  >
                    <User className="h-4 w-4" /> {t("nav.orders", "Mes commandes")}
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> {t("nav.logout", "Se déconnecter")}
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  search={{ redirect: "/" }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gold py-3 text-sm font-semibold text-gold-foreground shadow-gold"
                >
                  <User className="h-4 w-4" /> {t("nav.signIn", "Se connecter / S'inscrire")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Tiroir Panier interactif */}
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Modal Spotlight Search */}
      <SpotlightSearch open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
}