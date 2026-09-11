import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Package, ShoppingBag, ShieldAlert, Globe, Truck, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/admin/use-is-admin";
import { PageLoader } from "@/components/page-loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminNotificationsFn, markNotificationReadFn } from "@/lib/admin/quotes.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administration — Cereals House" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Commandes", icon: ShoppingBag, exact: false },
  { to: "/admin/quotes", label: "Devis B2B", icon: FileText, exact: false },
  { to: "/admin/products", label: "Produits", icon: Package, exact: false },
  { to: "/admin/countries", label: "Pays", icon: Globe, exact: false },
  { to: "/admin/shipping", label: "Livraison", icon: Truck, exact: false },
] as const;

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => getAdminNotificationsFn(),
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: isAdmin,
  });

  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    if (notifications.length > previousCount) {
      // Jouer un son (beep natif ou un fichier audio public/beep.mp3)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.value = 880; // La5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
        toast.info("Nouvelle demande de devis reçue !");
      } catch (e) {
        console.error("Impossible de jouer le son", e);
      }
    }
    setPreviousCount(notifications.length);
  }, [notifications.length, previousCount]);

  const markAsRead = useMutation({
    mutationFn: (id: string) => markNotificationReadFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

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
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
            <span className="h-px w-5 bg-gold" /> Administration
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-primary">Espace admin</h1>
        </div>
        
        {/* Cloche de notifications */}
        <div className="relative group">
          <Link to="/admin/quotes" className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:border-gold/50 hover:bg-gold/10">
            <Bell className="h-5 w-5 text-muted-foreground group-hover:text-gold transition-colors" />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </Link>
          
          {/* Menu déroulant notifications (optionnel) */}
          {notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Nouvelles Demandes ({notifications.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className="text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="font-semibold text-primary">{notif.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</div>
                    <button 
                      onClick={() => markAsRead.mutate(notif.id)}
                      className="text-[10px] text-gold hover:underline mt-1 cursor-pointer"
                    >
                      Marquer lu
                    </button>
                  </div>
                ))}
              </div>
              <Link to="/admin/quotes" className="block text-center text-xs text-gold font-bold mt-3 pt-3 border-t border-border/50 hover:underline">
                Voir tous les devis
              </Link>
            </div>
          )}
        </div>
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
