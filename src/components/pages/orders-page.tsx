import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Package,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { listUserOrdersFn } from "@/lib/orders/orders.functions";
import { checkPaymentStatusFn } from "@/lib/payments/check-status.functions";
import { PageLoader } from "@/components/page-loader";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function OrdersPage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const queryClient = useQueryClient();

  const STATUS_STYLES: Record<string, { badge: string; label: string; icon: typeof Clock }> = {
    pending_payment: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", label: t("orders.status.pending_payment", "En attente de paiement"), icon: Clock },
    paid: { badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", label: t("orders.status.paid", "Payée"), icon: CheckCircle2 },
    preparing: { badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300", label: t("orders.status.preparing", "En préparation"), icon: Package },
    shipped: { badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", label: t("orders.status.shipped", "Expédiée"), icon: Truck },
    in_transit: { badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300", label: t("orders.status.in_transit", "En cours de livraison"), icon: Truck },
    delivered: { badge: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300", label: t("orders.status.delivered", "Livrée avec succès"), icon: CheckCircle2 },
    cancelled: { badge: "bg-destructive/15 text-destructive", label: t("orders.status.cancelled", "Annulée"), icon: XCircle },
    refunded: { badge: "bg-muted text-muted-foreground", label: t("orders.status.refunded", "Remboursée"), icon: XCircle },
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    enabled: !!user,
    queryFn: () => listUserOrdersFn(),
  });

  // Vérification active automatique des commandes en attente
  useEffect(() => {
    const pendingOrders = orders.filter(
      (o: any) => o.payment_status === "pending" && o.status === "pending_payment",
    );
    if (pendingOrders.length === 0) return;

    let cancelled = false;
    async function checkAll() {
      const results = await Promise.allSettled(
        pendingOrders.map((o: any) => checkPaymentStatusFn({ data: { orderId: o.id } })),
      );
      const anyChanged = results.some(
        (r) => r.status === "fulfilled" && r.value.status !== "pending",
      );
      if (!cancelled && anyChanged) {
        queryClient.invalidateQueries({ queryKey: ["user-orders", user?.id] });
      }
    }

    checkAll();
    const interval = window.setInterval(checkAll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orders.map((o: any) => `${o.id}:${o.payment_status}`).join(","), user?.id, queryClient]);

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("orders.signInTitle", "Suivi de vos commandes")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("orders.signInDesc", "Connectez-vous pour consulter l'historique et l'état d'acheminement de vos céréales.")}
        </p>
        <Link
          to={getLocalizedPath("/auth")}
          search={{ redirect: getLocalizedPath("/orders") }}
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 cursor-pointer"
        >
          {t("nav.signIn", "Se connecter")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-border pb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Espace Client</span>
        <h1 className="mt-1 font-display text-3xl font-bold text-primary sm:text-4xl">
          {t("orders.title", "Mes Commandes")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("orders.subtitle", "Retrouvez l'état de préparation, d'expédition et les détails de vos achats.")}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground mb-4">
            <ShoppingBag className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-display text-xl font-bold text-primary">
            {t("orders.empty", "Vous n'avez pas encore passé de commande.")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("orders.emptyDesc", "Explorez notre boutique et faites-vous livrer vos céréales préférées.")}
          </p>
          <Link
            to={getLocalizedPath("/products")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold hover:bg-gold/90 transition cursor-pointer"
          >
            {t("orders.discover", "Découvrir nos céréales")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order: any) => {
            const statusConfig = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending_payment;
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={order.id}
                to={getLocalizedPath(`/orders/${order.id}`)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-gold/40 hover:shadow-soft cursor-pointer"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-primary group-hover:text-gold transition">
                      {order.order_number}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.badge}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Passée le {new Date(order.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-border/50 pt-3 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="font-display text-lg font-bold text-primary">
                      {formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {order.items_count} article(s)
                    </span>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary transition group-hover:bg-gold group-hover:text-gold-foreground">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
