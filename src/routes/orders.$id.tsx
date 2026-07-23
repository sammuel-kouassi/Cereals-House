import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home as HomeIcon,
  MapPin,
  CreditCard,
  Loader2,
  RefreshCw,
  Copy,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/reveal";
import { PageLoader } from "@/components/page-loader";
import { initiateCinetPayPaymentFn } from "@/lib/payments/cinetpay.functions";
import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import { cancelOrderFn } from "@/lib/orders/cancel-order.functions";
import { ConfirmDialog } from "@/components/confirm-dialog";

const NON_CANCELLABLE_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

const FLOW = [
  { key: "pending_payment", icon: Clock },
  { key: "paid", icon: Check },
  { key: "preparing", icon: Package },
  { key: "shipped", icon: Truck },
  { key: "in_transit", icon: Truck },
  { key: "delivered", icon: HomeIcon },
] as const;

const SYMBOLS: Record<string, string> = { XOF: "FCFA", EUR: "€", USD: "$", GHS: "₵" };

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*), order_status_history(*)")
        .eq("id", id)
        .maybeSingle();
      return order;
    },
    // Le webhook CinetPay confirme le paiement quelques instants APRÈS que le
    // navigateur soit revenu sur cette page (redirection quasi instantanée vs
    // notification serveur-à-serveur asynchrone) : sans ce polling, la page
    // resterait figée sur "en attente" même une fois la commande payée en base.
    refetchInterval: (query) => {
      const order = query.state.data;
      if (!order) return false;
      const stillPending = order.payment_status === "pending" && order.status === "pending_payment";
      return stillPending ? 3000 : false;
    },
  });

  async function handleRetryPayment() {
    setRetrying(true);
    try {
      const { paymentUrl } = await initiateCinetPayPaymentFn({ data: { orderId: id } });
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("orderDetail.retryPaymentError"));
      setRetrying(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const result = await cancelOrderFn({ data: { orderId: id } });
      toast.success(
        result.requiresRefund
          ? t("orderDetail.cancelledRefundToast")
          : t("orderDetail.cancelledToast"),
      );
      queryClient.invalidateQueries({ queryKey: ["order", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("orderDetail.cancelError"));
    } finally {
      setCancelling(false);
      setConfirmingCancel(false);
    }
  }

  if (isLoading) {
    return <PageLoader />;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{t("orderDetail.notFound")}</p>
        <Link to="/orders" className="mt-3 inline-block font-semibold text-gold hover:underline">
          {t("orderDetail.myOrders")}
        </Link>
      </div>
    );
  }

  const currentIdx = FLOW.findIndex((s) => s.key === data.status);
  const progressPct = currentIdx <= 0 ? 0 : (currentIdx / (FLOW.length - 1)) * 100;
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "fr-FR";
  const sym = SYMBOLS[data.currency_code] ?? data.currency_code;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-gold"
      >
        ← {t("orderDetail.myOrders")}
      </Link>

      <Reveal>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">{data.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {t("orderDetail.placedOn")} {new Date(data.created_at).toLocaleString(locale)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("orderDetail.total")}
            </div>
            <div className="font-display text-2xl font-bold text-gold">
              {formatPrice(Number(data.total), data.currency_code, sym)}
            </div>
            {isCinetPaySupportedCountry(data.country_code) &&
              data.payment_method &&
              data.payment_method !== "cash_on_delivery" &&
              data.payment_status !== "paid" && (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:translate-y-0 disabled:opacity-60"
                >
                  {retrying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {t("orderDetail.retryPayment")}
                </button>
              )}
            {!NON_CANCELLABLE_STATUSES.has(data.status) && (
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                disabled={cancelling}
                className="mt-3 ml-2 inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive transition-all duration-300 hover:-translate-y-0.5 hover:bg-destructive/10 disabled:translate-y-0 disabled:opacity-60"
              >
                {cancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                {t("orderDetail.cancelOrder")}
              </button>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card p-6">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold via-gold/70 to-transparent" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-primary">
              {t("orderDetail.tracking")}
            </h2>
            {data.payment_status === "pending" && data.status === "pending_payment" && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-gold motion-safe:animate-pulse" />
                {t("orderDetail.checkingPayment")}
              </span>
            )}
          </div>

          <ol className="relative mt-8 space-y-6">
            {/* Ligne de progression verticale, remplie proportionnellement à l'avancement réel de la commande */}
            <div className="absolute left-5 top-2 bottom-2 w-px bg-border" aria-hidden="true">
              <div
                className="w-full bg-gold transition-all duration-1000 ease-out"
                style={{ height: `${progressPct}%` }}
              />
            </div>
            {FLOW.map((step, i) => {
              const done = i <= currentIdx && currentIdx !== -1;
              // "Paiement confirmé" est un événement instantané et "Livrée" est
              // l'état terminal : dire "En cours" dessus n'a pas de sens, à la
              // différence de "En préparation"/"Expédiée" qui sont de vrais
              // états qui durent dans le temps.
              const isInstantOrTerminal = step.key === "paid" || step.key === "delivered";
              const active = i === currentIdx && !isInstantOrTerminal;
              return (
                <li key={step.key} className="relative flex gap-4">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-500 ${
                      done
                        ? "bg-gold text-gold-foreground shadow-gold"
                        : "bg-secondary text-muted-foreground"
                    } ${active ? "ring-4 ring-gold/30 motion-safe:animate-pulse" : ""}`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div
                      className={`font-semibold transition-colors duration-500 ${done ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {t(`orderDetail.flow.${step.key}`)}
                    </div>
                    {active && (
                      <div className="mt-1 text-xs font-semibold text-gold">
                        {t("orderDetail.inProgress")}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal delay={140}>
          <section className="h-full rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-primary">
              {t("orderDetail.items")}
            </h2>
            <ul className="mt-4 space-y-3">
              {data.order_items?.map((it, idx) => (
                <li
                  key={it.id}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="flex items-center gap-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-both"
                >
                  {it.product_image && (
                    <img
                      src={it.product_image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                  </div>
                  <div className="font-semibold">
                    {formatPrice(Number(it.line_total), data.currency_code, sym)}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("orderDetail.subtotal")}</dt>
                <dd>{formatPrice(Number(data.subtotal), data.currency_code, sym)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("orderDetail.shipping")}</dt>
                <dd>{formatPrice(Number(data.shipping_fee), data.currency_code, sym)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold">
                <dt>{t("orderDetail.total")}</dt>
                <dd className="text-gold">
                  {formatPrice(Number(data.total), data.currency_code, sym)}
                </dd>
              </div>
            </dl>
          </section>
        </Reveal>

        <Reveal delay={200}>
          <section className="h-full rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              <h2 className="font-display text-lg font-bold text-primary">
                {t("orderDetail.delivery")}
              </h2>
            </div>
            <div className="mt-3 text-sm">
              <div className="font-medium">{data.shipping_full_name}</div>
              <div className="text-muted-foreground">{data.shipping_phone}</div>
              <div className="mt-2">{data.shipping_address}</div>
              <div>
                {data.shipping_city}, {data.country_code}
              </div>
              {data.shipping_notes && (
                <p className="mt-3 text-muted-foreground italic">
                  &ldquo;{data.shipping_notes}&rdquo;
                </p>
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
              <CreditCard className="h-4 w-4 text-gold" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("orderDetail.payment")}
              </h3>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span>
                {data.payment_method
                  ? t(`checkout.payment.${data.payment_method}`, {
                      defaultValue: data.payment_method,
                    })
                  : t("orderDetail.codMethod")}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  PAYMENT_STATUS_STYLES[data.payment_status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {t(`orderDetail.paymentStatus.${data.payment_status}`, {
                  defaultValue: data.payment_status,
                })}
              </span>
            </div>
            {data.payment_reference && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(data.payment_reference!);
                  toast.success(t("orderDetail.referenceCopied"));
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-gold"
                title={t("orderDetail.copyReference")}
              >
                <Copy className="h-3 w-3" />
                <span className="font-mono">{data.payment_reference}</span>
              </button>
            )}
          </section>
        </Reveal>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        title={t("orderDetail.cancelOrder")}
        message={t("orderDetail.cancelConfirm")}
        confirmLabel={t("orderDetail.cancelOrder")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
        loading={cancelling}
      />
    </div>
  );
}