import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  XCircle,
  AlertTriangle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getOrderByIdFn } from "@/lib/orders/orders.functions";
import { cancelOrderFn } from "@/lib/orders/cancel-order.functions";
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

const CANCEL_REASONS = [
  "Erreur dans le choix des articles ou quantité",
  "Changement d'avis",
  "Délai de livraison trop long",
  "Erreur dans les coordonnées de livraison",
  "Autre motif (précisez ci-dessous)",
];

export function OrderDetailPage({ id }: { id: string }) {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const queryClient = useQueryClient();

  // État de la modale d'annulation client
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState(CANCEL_REASONS[0]);
  const [cancelReasonCustom, setCancelReasonCustom] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  // Vérification active auprès de Paystack / CinetPay lorsque la commande est en attente
  useEffect(() => {
    if (
      !order ||
      order.status !== "pending_payment" ||
      (!order.cinetpay_transaction_id && !order.payment_reference)
    )
      return;

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
  }, [order?.status, order?.cinetpay_transaction_id, order?.payment_reference, id, queryClient]);

  async function handleConfirmCancellation() {
    if (!order) return;
    setCancelling(true);
    try {
      const fullReason =
        cancelReasonPreset === "Autre motif (précisez ci-dessous)"
          ? cancelReasonCustom.trim() || "Autre motif"
          : cancelReasonCustom.trim()
            ? `${cancelReasonPreset} (${cancelReasonCustom.trim()})`
            : cancelReasonPreset;

      await cancelOrderFn({
        data: {
          orderId: order.id,
          reason: fullReason,
        },
      });

      toast.success("Votre commande a bien été annulée.");
      setShowCancelModal(false);
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'annulation");
    } finally {
      setCancelling(false);
    }
  }

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

  const isCancelled = order.status === "cancelled";
  const isRefunded = order.status === "refunded";
  const isClientCancellable = ["pending_payment", "paid", "preparing"].includes(order.status);
  const isShippedOrTransit = ["shipped", "in_transit"].includes(order.status);
  const currentStepIndex = FLOW.findIndex((s) => s.key === order.status);

  const whatsappMessage = encodeURIComponent(
    `Bonjour Cereals House, je vous contacte concernant ma commande ${order.order_number} (${formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}).`
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
              Commande {order.order_number}
            </h1>
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 border border-destructive/20 px-3 py-1 text-xs font-bold text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                Commande Annulée
              </span>
            )}
            {isRefunded && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Commande Remboursée
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Passée le {new Date(order.created_at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("orderDetail.total", "Total")}</div>
          <div className="font-display text-2xl font-bold text-gold">
            {formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}
          </div>
        </div>
      </div>

      {/* Bannière d'état spécifique : Commande Annulée */}
      {isCancelled && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/[0.05] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-destructive">
                  Cette commande a été annulée
                </h3>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {order.cancellation_reason ? (
                    <>
                      <strong>Motif enregistré :</strong> {order.cancellation_reason}
                    </>
                  ) : (
                    "L'annulation de cette commande a été validée."
                  )}
                </p>
                <div className="text-[11px] text-muted-foreground pt-0.5">
                  {order.cancelled_by === "customer"
                    ? "Annulée à la demande du client"
                    : "Annulée par les équipes de Cereals House"}
                  {order.cancelled_at && ` · le ${new Date(order.cancelled_at).toLocaleString("fr-FR")}`}
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/2250584637219?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition shrink-0"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Assistance WhatsApp</span>
            </a>
          </div>

          {/* Statut du règlement & remboursement */}
          <div className="border-t border-destructive/20 pt-3 text-xs text-foreground/85">
            {order.payment_status === "paid" ? (
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Paiement en ligne :</strong> Votre commande ayant été réglée, notre service effectue le remboursement sous 24h à 48h ouvrées sur votre compte d'origine.
                </span>
              </div>
            ) : order.payment_status === "refunded" ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Remboursement effectué :</strong> Les fonds vous ont été intégralement restitués.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Aucun montant n'a été prélevé pour cette commande. Le dossier est clôturé.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre de Suivi d'Acheminement (affichée si la commande n'est pas annulée) */}
      {!isCancelled && !isRefunded && (
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-lg font-bold text-primary">
              {t("orderDetail.tracking", "Suivi de la livraison")}
            </h2>
            <span className="text-xs font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
              {FLOW[currentStepIndex]?.label ?? "En cours"}
            </span>
          </div>

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
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Liste des articles */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
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

            {/* Récapitulatif sous-total / livraison */}
            <div className="border-t border-border/70 pt-4 mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total articles</span>
                <span>{formatPrice(Number(order.subtotal), order.currency_symbol || order.currency_code)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frais de livraison</span>
                <span>{formatPrice(Number(order.shipping_fee), order.currency_symbol || order.currency_code)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 font-bold text-primary text-sm">
                <span>Total TTC</span>
                <span className="text-gold font-display text-base">
                  {formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Détails livraison & paiement & Action d'annulation */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4 text-xs">
            <h3 className="font-display text-base font-bold text-primary border-b border-border/80 pb-3">{t("orderDetail.delivery", "Adresse de livraison")}</h3>
            <div>
              <span className="font-semibold text-primary block">{order.shipping_full_name}</span>
              <span className="text-muted-foreground block">{order.shipping_address}, {order.shipping_city}</span>
              <span className="text-muted-foreground block">{order.shipping_phone}</span>
            </div>
            <div className="pt-2 border-t border-border/60 space-y-1">
              <span className="text-muted-foreground block">
                {t("orderDetail.payment", "Modalité de paiement")} :{" "}
                <strong className="text-primary">
                  {order.payment_method === "cash_on_delivery" ? t("orderDetail.codMethod", "Paiement à la livraison") : "En ligne (Paystack / Mobile Money)"}
                </strong>
              </span>
              <span className="text-muted-foreground block">
                État du paiement :{" "}
                <strong className={order.payment_status === "paid" ? "text-emerald-600" : order.payment_status === "refunded" ? "text-emerald-700" : "text-amber-600"}>
                  {order.payment_status === "paid" ? "Payé ✓" : order.payment_status === "refunded" ? "Remboursé ✓" : "En attente"}
                </strong>
              </span>
            </div>
          </div>

          {/* Bloc d'action d'annulation pour le client */}
          {isClientCancellable && (
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <div className="space-y-1">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gestion de votre commande
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Vous pouvez annuler sans frais votre commande tant qu'elle n'a pas été expédiée.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-2.5 px-4 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition duration-200 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Annuler ma commande</span>
              </button>
            </div>
          )}

          {/* Notification d'aide si commande en route */}
          {isShippedOrTransit && (
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <Truck className="h-4 w-4 shrink-0" />
                <span>Colis en cours d'acheminement</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Votre colis est entre les mains du transporteur. Pour toute modification ou annulation d'urgence, contactez directement notre équipe :
              </p>
              <a
                href={`https://wa.me/2250584637219?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:underline pt-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Contacter le livreur sur WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modale d'annulation Client */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">
                    Annuler la commande {order.order_number}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Confirmez-vous vouloir interrompre le traitement de cette commande ?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Note de transparence sur le paiement */}
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 text-xs space-y-1.5">
              <span className="font-bold text-primary block">Conséquence sur votre règlement :</span>
              {order.payment_status === "paid" ? (
                <p className="text-muted-foreground leading-relaxed">
                  Votre commande a déjà été payée ({formatPrice(Number(order.total), order.currency_symbol || order.currency_code)}). Notre équipe comptable effectuera le <strong>remboursement intégral sous 24h à 48h</strong> sur votre compte Mobile Money ou carte bancaire.
                </p>
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  Aucun montant n'ayant été prélevé, la commande sera clôturée sans aucun frais pour vous.
                </p>
              )}
            </div>

            {/* Sélection du motif */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary">
                Indiquez le motif de l'annulation *
              </label>
              <select
                value={cancelReasonPreset}
                onChange={(e) => setCancelReasonPreset(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-gold focus:outline-none"
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <textarea
                rows={2}
                value={cancelReasonCustom}
                onChange={(e) => setCancelReasonCustom(e.target.value)}
                placeholder="Précisions complémentaires (facultatif)…"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50"
              >
                Garder ma commande
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancellation}
                className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Annulation en cours…</span>
                  </>
                ) : (
                  <span>Confirmer l'annulation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
