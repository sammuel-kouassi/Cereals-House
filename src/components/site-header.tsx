import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { CountrySelector } from "@/components/country-selector";
import logo from "@/assets/logo.jpeg";

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = [
    { to: "/", label: "Accueil" },
    { to: "/products", label: "Boutique" },
    { to: "/about", label: "À propos" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Cereals House" className="h-12 w-12 rounded-full object-cover ring-2 ring-gold/40" />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold text-primary">Cereals House</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Céréales premium</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-gold [&.active]:text-gold"
              activeProps={{ className: "active" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CountrySelector />
          </div>
          <Link
            to={user ? "/orders" : "/auth"}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition hover:bg-secondary hover:text-gold sm:flex"
            aria-label="Compte"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition hover:bg-secondary hover:text-gold"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-border pt-3">
              <CountrySelector />
            </div>
            <Link
              to={user ? "/orders" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
            >
              {user ? "Mes commandes" : "Se connecter"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
