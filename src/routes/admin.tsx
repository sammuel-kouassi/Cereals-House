import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, ShieldAlert, Globe,Truck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin/use-is-admin";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — Cereals House" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingBag, exact: false },
  { to: "/admin/products", label: "Produits", icon: Package, exact: false },
  { to: "/admin/countries", label: "Pays", icon: Globe, exact: false },
  { to: "/admin/shipping", label: "Livraison", icon: Truck, exact: false },
] as const;

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (authLoading || adminLoading) return <PageLoader />;

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-primary">Accès refusé</h1>
        <p className="mt-2 text-muted-foreground">
          Cette section est réservée aux administrateurs de Cereals House.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <span className="h-px w-5 bg-gold" /> Administration
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">Espace admin</h1>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-border bg-secondary/40 p-1">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                active
                  ? "bg-gold text-gold-foreground shadow-gold"
                  : "text-foreground/70 hover:text-primary"
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
