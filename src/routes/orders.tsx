import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  preparing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  shipped: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  in_transit: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Mes commandes — Cereals House" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();

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

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center">{t("common.loading")}</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">{t("orders.signInTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("orders.signInDesc")}</p>
        <Link
          to="/auth"
          search={{ redirect: "/orders" }}
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90"
        >
          {t("nav.signIn")}
        </Link>
      </div>
    );
  }

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "fr-FR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary">{t("orders.title")}</h1>
      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-secondary" />
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("orders.empty")}</p>
          <Link to="/products" className="mt-4 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground hover:bg-gold/90">
            {t("orders.discover")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => {
            const color = STATUS_COLORS[o.status] ?? "bg-muted";
            const label = t(`orders.status.${o.status}`, { defaultValue: o.status });
            return (
              <li key={o.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-gold/50 hover:shadow-soft"
                >
                  <div>
                    <div className="font-display text-lg font-semibold text-primary">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString(locale)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{label}</span>
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