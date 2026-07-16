import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Package,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { initiateCinetPayPaymentFn } from "@/lib/payments/cinetpay.functions";
import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import { PageLoader } from "@/components/page-loader";

const STATUS_STYLES: Record<string, { badge: string; icon: typeof Clock }> = {
  pending_payment: { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: Clock },
  paid: { badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  preparing: { badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300", icon: Package },
  shipped: { badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", icon: Truck },
  in_transit: { badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300", icon: Truck },
  delivered: {
    badge: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  cancelled: { badge: "bg-destructive/15 text-destructive", icon: XCircle },
  refunded: { badge: "bg-muted text-muted-foreground", icon: XCircle },
};

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Mes commandes — Cereals House" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_number, total, currency_code, status, created_at, country_code, payment_method, payment_status",
        )
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function handleRetryPayment(orderId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setRetryingId(orderId);
    try {
      const { paymentUrl } = await initiateCinetPayPaymentFn({ data: { orderId } });
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("orderDetail.retryPaymentError"));
      setRetryingId(null);
    }
  }

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Reveal>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-primary">
            {t("orders.signInTitle")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("orders.signInDesc")}</p>
          <Link
            to="/auth"
            search={{ redirect: "/orders" }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
          >
            {t("nav.signIn")}
          </Link>
        </Reveal>
      </div>
    );
  }

  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "fr-FR";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <span className="h-px w-5 bg-gold" /> {t("nav.orders")}
        </span>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">{t("orders.title")}</h1>
      </Reveal>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Reveal delay={100}>
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t("orders.empty")}</p>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
            >
              {t("orders.discover")}
            </Link>
          </div>
        </Reveal>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o, idx) => {
            const style = STATUS_STYLES[o.status] ?? {
              badge: "bg-muted text-muted-foreground",
              icon: Package,
            };
            const StatusIcon = style.icon;
            const label = t(`orders.status.${o.status}`, { defaultValue: o.status });
            const canRetry =
              isCinetPaySupportedCountry(o.country_code) &&
              o.payment_method &&
              o.payment_method !== "cash_on_delivery" &&
              (o.payment_status === "pending" || o.payment_status === "failed");
            return (
              <Reveal key={o.id} delay={idx * 60}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="group relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-gold"
                >
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />

                  <div className="flex items-center gap-4">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${style.badge} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold text-primary transition-colors duration-300 group-hover:text-gold">
                        {o.order_number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString(locale)}
                      </div>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-4">
                    {canRetry && (
                      <button
                        type="button"
                        onClick={(e) => handleRetryPayment(o.id, e)}
                        disabled={retryingId === o.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:translate-y-0 disabled:opacity-60"
                      >
                        {retryingId === o.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {t("orderDetail.retryPayment")}
                      </button>
                    )}
                    <span
                      className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-block ${style.badge}`}
                    >
                      {label}
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gold">
                        {formatPrice(
                          Number(o.total),
                          o.currency_code,
                          o.currency_code === "XOF"
                            ? "FCFA"
                            : o.currency_code === "EUR"
                              ? "€"
                              : o.currency_code === "USD"
                                ? "$"
                                : "₵",
                        )}
                      </div>
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:hidden ${style.badge}`}
                      >
                        {label}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
