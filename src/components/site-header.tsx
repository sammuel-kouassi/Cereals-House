import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin/use-is-admin";
import { CountrySelector } from "@/components/country-selector";
import { LanguageSwitcher } from "@/components/language-switcher";
import logo from "@/assets/logo.jpeg";

export function SiteHeader() {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [greetingKey, setGreetingKey] = useState<"greeting.morning" | "greeting.evening">(
    "greeting.morning",
  );

  // Détection dynamique de l'heure locale (passage à "Bonsoir" dès 17h00)
  useEffect(() => {
    const hour = new Date().getHours();
    setGreetingKey(hour >= 17 ? "greeting.evening" : "greeting.morning");
  }, []);

  // Header qui se "solidifie" légèrement une fois qu'on a scrollé
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fonction pour extraire et formater le nom de famille + initiale (ex: "Kouassi S.")
  const getShortName = () => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(" ");
      if (parts.length > 1) {
        return `${parts[0]} ${parts[1][0]}.`;
      }
      return parts[0];
    }
    return user?.email?.split("@")[0] || "Client";
  };

  const getInitial = () => {
    const name = user?.user_metadata?.full_name?.trim();
    if (name) return name[0].toUpperCase();
    return (user?.email?.[0] || "C").toUpperCase();
  };

  const greetingLabel = `${t(greetingKey as any) || (greetingKey === "greeting.evening" ? "Bonsoir" : "Bonjour")}, ${getShortName()}`;

  const nav = [
    { to: "/", label: t("nav.home") },
    { to: "/products", label: t("nav.shop") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  const iconBtn =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-all duration-300 ease-out hover:scale-110 hover:bg-secondary hover:text-gold active:scale-95";

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-background/85 backdrop-blur-lg transition-all duration-300 ${
        scrolled
          ? "border-border shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] bg-background/95"
          : "border-border/60"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <img
            src={logo}
            alt="Cereals House"
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-gold/40 transition-all duration-500 ease-out group-hover:rotate-6 group-hover:scale-105 group-hover:ring-gold/70"
          />
          <div className="whitespace-nowrap leading-tight">
            <div className="font-display text-xl font-bold text-primary transition-all duration-300 group-hover:tracking-wide">
              Cereals House
            </div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1 w-1 shrink-0 rounded-full bg-gold motion-safe:animate-pulse" />
              {t("header.tagline")}
            </div>
          </div>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden shrink-0 items-center gap-6 md:flex xl:gap-8">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="group relative whitespace-nowrap py-1 text-sm font-medium text-foreground/80 transition-colors duration-300 hover:text-gold [&.active]:text-gold"
              activeProps={{ className: "active" }}
            >
              {n.label}
              <span className="pointer-events-none absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gold transition-all duration-300 ease-out group-hover:w-full [.active_&]:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Le sélecteur de langue rejoint le sélecteur de pays dès xl (1280px) — assez de marge
              pour éviter tout scroll horizontal, tout en restant visible sur la plupart des écrans desktop. */}
          <div className="hidden items-center gap-1.5 xl:flex">
            <LanguageSwitcher />
            <div className="hidden sm:block">
              <CountrySelector />
            </div>
          </div>
          <div className="block xl:hidden">
            <div className="hidden sm:block">
              <CountrySelector />
            </div>
          </div>

          {/* Séparateur entre réglages (langue/pays) et compte */}
          <div className="mx-1 hidden h-6 w-px shrink-0 bg-border sm:block" />

          {/* Espace Utilisateur Connecté / Anonyme (Ordinateur) */}
          {user ? (
            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              {/* En dessous de 2xl : bulle avatar seule (même gabarit que les autres icônes), le message
                  complet reste accessible via l'infobulle au survol. */}
              <div
                title={greetingLabel}
                className="mr-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gold/20 bg-gold/5 py-1 pl-1 pr-1 text-sm font-medium text-foreground/80 transition-colors duration-300 hover:border-gold/40 2xl:pr-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  {getInitial()}
                </span>
                <span className="hidden whitespace-nowrap 2xl:inline">{greetingLabel}</span>
              </div>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={iconBtn}
                  title="Administration"
                  aria-label="Administration"
                >
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              )}

              <Link
                to="/orders"
                className={iconBtn}
                title={t("nav.orders" as any) || "Mes commandes"}
                aria-label={t("nav.orders" as any) || "Mes commandes"}
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={signOut}
                className={`${iconBtn} hover:bg-red-500/10 hover:text-red-500`}
                title={t("nav.logout") || "Se déconnecter"}
                aria-label={t("nav.logout") || "Se déconnecter"}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/" }}
              className={`${iconBtn} hidden sm:flex`}
              aria-label={t("nav.account")}
              title={t("nav.signIn" as any) || "Se connecter"}
            >
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link to="/cart" className={iconBtn} aria-label={t("nav.cart")}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-300"
              >
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`${iconBtn} md:hidden`}
            aria-label={t("nav.menu")}
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <Menu
                className={`absolute h-5 w-5 transition-all duration-300 ${open ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
              />
              <X
                className={`absolute h-5 w-5 transition-all duration-300 ${open ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Menu Navigation Mobile */}
      {open && (
        <div className="border-t border-border/60 bg-background motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-secondary hover:text-gold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:fill-mode-both"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <LanguageSwitcher />
              <CountrySelector />
            </div>

            {/* Section Compte Dynamique pour le Menu Mobile */}
            {user ? (
              <>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {getInitial()}
                  </span>
                  <span className="text-sm font-semibold text-primary">{greetingLabel}</span>
                </div>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gold transition-colors duration-200 hover:bg-secondary"
                  >
                    <ShieldCheck className="h-4 w-4" /> Administration
                  </Link>
                )}

                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-secondary hover:text-gold"
                >
                  {t("nav.orders" as any) || "Mes commandes"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors duration-200 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" /> {t("nav.logout") || "Se déconnecter"}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                search={{ redirect: "/" }}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-secondary hover:text-gold"
              >
                {t("nav.signIn" as any) || "Se connecter"}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
