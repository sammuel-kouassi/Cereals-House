import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "En attente de paiement", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  paid: { label: "Payée", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  preparing: { label: "En préparation", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  shipped: { label: "Expédiée", color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  in_transit: { label: "En cours de livraison", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  delivered: { label: "Livrée", color: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300" },
  cancelled: { label: "Annulée", color: "bg-destructive/15 text-destructive" },
  refunded: { label: "Remboursée", color: "bg-muted text-muted-foreground" },
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Mes commandes — Cereals House" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, currency_code, status, created_at, country_code")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center">Chargement…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">Connectez-vous</h1>
        <p className="mt-2 text-muted-foreground">Pour voir vos commandes, connectez-vous.</p>
        <Link to="/auth" className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary">Mes commandes</h1>
      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-secondary" />
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Vous n'avez pas encore passé de commande.</p>
          <Link to="/products" className="mt-4 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => {
            const s = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-muted" };
            return (
              <li key={o.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-gold/50 hover:shadow-soft"
                >
                  <div>
                    <div className="font-display text-lg font-semibold text-primary">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("fr-FR")}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>
                    <div className="font-bold text-gold">
                      {formatPrice(Number(o.total), o.currency_code, o.currency_code === "XOF" ? "FCFA" : o.currency_code === "EUR" ? "€" : o.currency_code === "USD" ? "$" : "₵")}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
