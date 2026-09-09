import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home as HomeIcon,
  MapPin,
  CreditCard,
  Copy,
  PhoneCall,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getOrderByIdFn } from "@/lib/orders/orders.functions";
import { checkPaymentStatusFn } from "@/lib/payments/check-status.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";
import { useLanguageNavigation } from "@/lib/i18n-routing";

const FLOW = [
  { key: "pending_payment", label: "Commande enregistrée", icon: Clock },
  { key: "paid", label: "Paiement validé", icon: Check },
  { key: "preparing", label: "En préparation", icon: Package },
  { key: "shipped", label: "Expédiée", icon: Truck },
  { key: "in_transit", label: "En cours d'acheminement", icon: Truck },
  { key: "delivered", label: "Livrée chez vous", icon: HomeIcon },
] as const;

export function OrderDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => getOrderByIdFn({ data: { orderId: id } }),
    refetchInterval: (query) => {
      const order = query.state.data?.order;
      if (!order) return false;
      return order.status === "pending_payment" ? 4000 : false;
    },
  });

  const order = data?.order;

  // Vérification active auprès de CinetPay lorsque la commande est en attente
  useEffect(() => {
    if (!order || order.status !== "pending_payment" || !order.cinetpay_transaction_id) return;

    let cancelled = false;
    async function check() {
      try {
        const res = await checkPaymentStatusFn({ data: { orderId: id } });
        if (!cancelled && res.status !== "pending") {
          queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
        }
      } catch (err) {
        console.error("Échec de la vérification active du paiement", err);
      }
    }

    check();
    const interval = window.setInterval(check, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [order?.status, order?.cinetpay_transaction_id, id, queryClient]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <PageLoader />
      </div>
    );
  }

  const items = data?.items ?? [];
  const history = data?.history ?? [];

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("orderDetail.notFound", "Commande introuvable.")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le numéro de commande renseigné n'existe pas.
        </p>
        <Link
          to={getLocalizedPath("/orders")}
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold"
        >
          {t("orderDetail.myOrders", "Mes commandes")}
        </Link>
      </div>
    );
  }

  const currentStepIndex = FLOW.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to={getLocalizedPath("/orders")} className="hover:text-gold transition">
              {t("orderDetail.myOrders", "Mes commandes")}
            </Link>
            <span>/</span>
            <span className="font-semibold text-primary">{order.order_number}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            Commande {order.order_number}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Passée le {new Date(order.created_at).toLocaleDateString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("orderDetail.total", "Total")}</div>
          <div className="font-display text-2xl font-bold text-gold">
            {formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}
          </div>
        </div>
      </div>

      {/* Barre de Suivi d'Acheminement */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-lg font-bold text-primary mb-6">
          {t("orderDetail.tracking", "Suivi de la livraison")}
        </h2>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FLOW.map((step, idx) => {
            const isDone = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center space-y-2">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl transition ${
                    isDone
                      ? "bg-gold text-gold-foreground shadow-gold font-bold"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-semibold ${isCurrent ? "text-gold font-bold" : isDone ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Liste des articles */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-primary mb-4">{t("orderDetail.items", "Articles commandés")}</h3>
            <div className="divide-y divide-border/60">
              {items.map((item: any) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    {item.product_image && (
                      <img src={item.product_image} alt={item.product_name} className="h-12 w-12 rounded-xl object-cover bg-secondary" />
                    )}
                    <div>
                      <span className="font-semibold text-primary block">{item.product_name}</span>
                      <span className="text-muted-foreground text-[11px]">{item.quantity} × {formatPrice(Number(item.unit_price), order.currency_symbol || order.currency_code)}</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(Number(item.line_total), order.currency_symbol || order.currency_code)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Détails livraison & paiement */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-display text-base font-bold text-primary border-b border-border/80 pb-3">{t("orderDetail.delivery", "Adresse de livraison")}</h3>
            <div>
              <span className="font-semibold text-primary block">{order.shipping_full_name}</span>
              <span className="text-muted-foreground block">{order.shipping_address}, {order.shipping_city}</span>
              <span className="text-muted-foreground block">{order.shipping_phone}</span>
            </div>
            <div className="pt-2 border-t border-border/60">
              <span className="text-muted-foreground block">{t("orderDetail.payment", "Modalité de paiement")} : <strong className="text-primary">{order.payment_method === "cash_on_delivery" ? t("orderDetail.codMethod", "Paiement à la livraison") : "En ligne"}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
