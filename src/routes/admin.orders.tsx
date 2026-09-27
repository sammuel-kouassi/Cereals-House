import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  Download,
  Printer,
  XCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import {
  listOrdersAdminFn,
  updateOrderStatusAdminFn,
  exportOrdersAdminFn,
  generatePackingSlipAdminFn,
  checkOrderPaymentStatusAdminFn,
} from "@/lib/admin/orders.functions";
import { finalizeOrderCancellationAdminFn } from "@/lib/orders/cancel-order.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payée",
  preparing: "En préparation",
  shipped: "Expédiée",
  in_transit: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  preparing: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  shipped: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  in_transit: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  delivered: "bg-emerald-600/20 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-destructive/15 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

const ADMIN_CANCEL_REASONS = [
  "Rupture de stock ou approvisionnement indisponible",
  "Demande d'annulation du client (appel / WhatsApp)",
  "Client injoignable ou coordonnées invalides",
  "Commande passée en double / erreur de saisie",
  "Autre motif (préciser ci-dessous)",
];

const PAGE_SIZE = 25;

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Filtre dédié aux demandes d'annulation client
  const [cancellationOnlyFilter, setCancellationOnlyFilter] = useState(false);

  // État de la modale d'annulation administrateur
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);
  const [adminCancelReasonPreset, setAdminCancelReasonPreset] = useState(ADMIN_CANCEL_REASONS[0]);
  const [adminCancelReasonCustom, setAdminCancelReasonCustom] = useState("");
  const [adminCancelling, setAdminCancelling] = useState(false);

  // État du rejet de demande d'annulation
  const [orderToReject, setOrderToReject] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  async function handlePackingSlip(orderId: string) {
    setPrintingId(orderId);
    try {
      const { pdfBase64 } = await generatePackingSlipAdminFn({ data: { orderId } });
      const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la génération du bon");
    } finally {
      setPrintingId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const { orders } = await exportOrdersAdminFn({
        data: {
          status: (statusFilter || undefined) as (typeof ORDER_STATUSES)[number] | undefined,
          search: search || undefined,
        },
      });
      if (orders.length === 0) {
        toast.error("Aucune commande à exporter.");
        return;
      }

      const columns: (keyof (typeof orders)[number])[] = [
        "order_number",
        "created_at",
        "status",
        "payment_status",
        "payment_method",
        "country_code",
        "currency_code",
        "subtotal",
        "shipping_fee",
        "total",
        "shipping_full_name",
        "shipping_phone",
        "shipping_address",
        "shipping_city",
      ];
      const escape = (v: unknown) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = columns.join(",");
      const rows = orders.map((o) => columns.map((c) => escape(o[c])).join(","));
      const csv = "\uFEFF" + [header, ...rows].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'export");
    } finally {
      setExporting(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, search, page, cancellationOnlyFilter],
    queryFn: () =>
      listOrdersAdminFn({
        data: {
          status: (!cancellationOnlyFilter && statusFilter ? statusFilter : undefined) as (typeof ORDER_STATUSES)[number] | undefined,
          cancellationRequestedOnly: cancellationOnlyFilter ? true : undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
  });

  // Vérification ACTIVE des commandes en attente
  useEffect(() => {
    const pendingOrders = (data?.orders ?? []).filter(
      (o) => o.payment_status === "pending" && o.status === "pending_payment",
    );
    if (pendingOrders.length === 0) return;

    let cancelled = false;
    async function checkAll() {
      const results = await Promise.allSettled(
        pendingOrders.map((o) => checkOrderPaymentStatusAdminFn({ data: { orderId: o.id } })),
      );
      const anyChanged = results.some(
        (r) => r.status === "fulfilled" && r.value.status !== "pending",
      );
      if (!cancelled && anyChanged) {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      }
    }

    checkAll();
    const interval = window.setInterval(checkAll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(data?.orders ?? []).map((o) => `${o.id}:${o.payment_status}`).join(","), queryClient]);

  async function handleStatusChange(orderId: string, status: string, customNote?: string) {
    // Si l'admin choisit "cancelled", ouvrir la modale pour renseigner le motif
    if (status === "cancelled") {
      const target = data?.orders.find((o) => o.id === orderId);
      if (target) {
        setOrderToCancel(target);
        setAdminCancelReasonPreset(ADMIN_CANCEL_REASONS[0]);
        setAdminCancelReasonCustom("");
        return;
      }
    }

    setUpdatingId(orderId);
    try {
      await updateOrderStatusAdminFn({
        data: {
          orderId,
          status: status as (typeof ORDER_STATUSES)[number],
          note: customNote,
        },
      });
      toast.success("Statut mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmAdminCancel() {
    if (!orderToCancel) return;
    setAdminCancelling(true);
    try {
      const fullReason =
        adminCancelReasonPreset === "Autre motif (préciser ci-dessous)"
          ? adminCancelReasonCustom.trim() || "Autre motif administratif"
          : adminCancelReasonCustom.trim()
            ? `${adminCancelReasonPreset} (${adminCancelReasonCustom.trim()})`
            : adminCancelReasonPreset;

      await finalizeOrderCancellationAdminFn({
        data: {
          orderId: orderToCancel.id,
          approved: true,
          note: fullReason,
        },
      });

      toast.success(
        `La commande ${orderToCancel.order_number} a été officiellement annulée. Les stocks ont été réintégrés et le client notifié.`
      );
      setOrderToCancel(null);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'annulation administrative");
    } finally {
      setAdminCancelling(false);
    }
  }

  async function handleConfirmRejectCancel() {
    if (!orderToReject) return;
    setRejecting(true);
    try {
      await finalizeOrderCancellationAdminFn({
        data: {
          orderId: orderToReject.id,
          approved: false,
          note: rejectReason.trim() || "Demande d'annulation rejetée par l'administrateur",
        },
      });
      toast.success(`La demande d'annulation pour ${orderToReject.order_number} a été refusée.`);
      setOrderToReject(null);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du rejet de la demande");
    } finally {
      setRejecting(false);
    }
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Onglets rapides de filtrage */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCancellationOnlyFilter(false);
            setStatusFilter("");
            setPage(0);
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
            !cancellationOnlyFilter && !statusFilter
              ? "bg-gold text-gold-foreground shadow-gold"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Toutes ({data?.total ?? 0})
        </button>

        <button
          type="button"
          onClick={() => {
            setCancellationOnlyFilter(true);
            setStatusFilter("");
            setPage(0);
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
            cancellationOnlyFilter
              ? "bg-amber-600 text-white shadow-xs"
              : (data as any)?.pendingCancellationCount > 0
                ? "border border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200 animate-pulse hover:bg-amber-500/25"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Demandes d'annulation</span>
          {((data as any)?.pendingCancellationCount ?? 0) > 0 && (
            <span className="ml-1 rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-bold text-white">
              {(data as any)?.pendingCancellationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setCancellationOnlyFilter(false);
            setStatusFilter("preparing");
            setPage(0);
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
            !cancellationOnlyFilter && statusFilter === "preparing"
              ? "bg-gold text-gold-foreground shadow-gold"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          En préparation
        </button>

        <button
          type="button"
          onClick={() => {
            setCancellationOnlyFilter(false);
            setStatusFilter("cancelled");
            setPage(0);
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
            !cancellationOnlyFilter && statusFilter === "cancelled"
              ? "bg-gold text-gold-foreground shadow-gold"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Annulées
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Rechercher un n° de commande…"
          className="w-full max-w-xs rounded-full border border-input bg-background px-4 py-2 text-sm transition-all duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
        <select
          value={cancellationOnlyFilter ? "" : statusFilter}
          onChange={(e) => {
            setCancellationOnlyFilter(false);
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-full border border-input bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
        >
          <option value="">Tous les statuts</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/20 disabled:opacity-60 cursor-pointer"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter CSV
        </button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !data || data.orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Aucune commande trouvée.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">N° commande</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Pays</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Paiement</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
                const isOrderCancelled = o.status === "cancelled";
                const isOrderPaid = o.payment_status === "paid";
                const hasPendingCancelRequest =
                  Boolean(o.cancellation_requested) && o.status !== "cancelled";

                return (
                  <tr
                    key={o.id}
                    className={`border-b border-border/60 last:border-0 transition-colors ${
                      hasPendingCancelRequest
                        ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border-l-4 border-l-amber-500"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{o.order_number}</span>
                        {hasPendingCancelRequest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            Demande client
                          </span>
                        )}
                      </div>

                      {hasPendingCancelRequest && o.cancellation_request_reason && (
                        <p
                          className="mt-1 text-xs text-amber-800 dark:text-amber-200 line-clamp-2 max-w-xs"
                          title={o.cancellation_request_reason}
                        >
                          <span className="font-semibold">Motif client :</span>{" "}
                          {o.cancellation_request_reason}
                        </p>
                      )}

                      {isOrderCancelled && o.cancellation_reason && (
                        <span
                          className="text-[11px] text-destructive block max-w-xs truncate mt-0.5"
                          title={o.cancellation_reason}
                        >
                          Motif : {o.cancellation_reason}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="block font-medium">{o.shipping_full_name}</span>
                      <span className="text-xs text-muted-foreground">{o.shipping_phone}</span>
                    </td>

                    <td className="px-4 py-3">{o.country_code}</td>

                    <td className="px-4 py-3 font-semibold text-gold">
                      {formatPrice(Number(o.total), o.currency_code, o.currency_code)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          o.payment_status === "paid"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : o.payment_status === "failed"
                              ? "bg-destructive/15 text-destructive"
                              : o.payment_status === "refunded"
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {o.payment_status === "paid"
                          ? "Payée"
                          : o.payment_status === "refunded"
                            ? "Remboursée"
                            : o.payment_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={o.status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gold/30 cursor-pointer ${
                            STATUS_BADGE[o.status] ?? "bg-muted"
                          }`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        {updatingId === o.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Actions spécifiques si demande d'annulation client en attente */}
                        {hasPendingCancelRequest && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToCancel(o);
                                setAdminCancelReasonPreset("Demande d'annulation du client (appel / WhatsApp)");
                                setAdminCancelReasonCustom(
                                  o.cancellation_request_reason
                                    ? `Demande client validée : "${o.cancellation_request_reason}"`
                                    : "Demande client validée"
                                );
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs cursor-pointer"
                              title="Valider la demande d'annulation"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Valider l'annulation</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOrderToReject(o);
                                setRejectReason("");
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
                              title="Refuser la demande d'annulation"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Refuser</span>
                            </button>
                          </>
                        )}

                        {/* Action rapide : marquer remboursée si annulée & payée */}
                        {isOrderCancelled && isOrderPaid && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(o.id, "refunded", "Remboursement en ligne validé")
                            }
                            disabled={updatingId === o.id}
                            className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500 hover:text-white transition"
                            title="Marquer comme Remboursée"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Remboursée</span>
                          </button>
                        )}

                        {/* Action rapide admin standard : annuler directement si pas de demande en cours */}
                        {!hasPendingCancelRequest &&
                          !isOrderCancelled &&
                          o.status !== "delivered" &&
                          o.status !== "refunded" && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o.id, "cancelled")}
                              disabled={updatingId === o.id}
                              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                              title="Annuler cette commande"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                        {/* Bon de préparation */}
                        <button
                          type="button"
                          onClick={() => handlePackingSlip(o.id)}
                          disabled={printingId === o.id}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-gold cursor-pointer"
                          title="Bon de préparation"
                        >
                          {printingId === o.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-40 cursor-pointer"
          >
            Précédent
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-40 cursor-pointer"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modale d'annulation Administrateur */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">
                    {orderToCancel.cancellation_requested
                      ? `Finaliser l'annulation : ${orderToCancel.order_number}`
                      : `Annulation administrateur : ${orderToCancel.order_number}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Client : <strong>{orderToCancel.shipping_full_name}</strong> · Montant :{" "}
                    <strong>
                      {formatPrice(Number(orderToCancel.total), orderToCancel.currency_code)}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Détail de la demande client si applicable */}
            {orderToCancel.cancellation_requested && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1">
                <p className="font-semibold text-amber-800 dark:text-amber-200">
                  Demande formulée par le client
                </p>
                <p className="text-amber-900/90 dark:text-amber-100 italic">
                  « {orderToCancel.cancellation_request_reason || "Aucun motif textuel fourni"} »
                </p>
              </div>
            )}

            {/* Impact sur le stock et le paiement */}
            <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Les articles seront automatiquement réintégrés dans les stocks.</span>
              </div>
              {orderToCancel.payment_status === "paid" && (
                <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attention :</strong> Cette commande est déjà réglée en ligne (
                    {orderToCancel.payment_method}). Pensez à procéder au remboursement sur
                    GeniusPay / Mobile Money.
                  </span>
                </div>
              )}
            </div>

            {/* Sélection du motif admin */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-primary">
                Motif officiel enregistré pour la commande *
              </label>
              <select
                value={adminCancelReasonPreset}
                onChange={(e) => setAdminCancelReasonPreset(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-gold focus:outline-none"
              >
                {ADMIN_CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <textarea
                rows={2}
                value={adminCancelReasonCustom}
                onChange={(e) => setAdminCancelReasonCustom(e.target.value)}
                placeholder="Note interne ou détails complémentaires…"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={adminCancelling}
                onClick={() => setOrderToCancel(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50 cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={adminCancelling}
                onClick={handleConfirmAdminCancel}
                className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {adminCancelling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Traitement…</span>
                  </>
                ) : (
                  <span>
                    {orderToCancel.cancellation_requested
                      ? "Valider et annuler définitivement"
                      : "Confirmer l'annulation"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de refus de la demande d'annulation */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-primary">
                    Refuser la demande d'annulation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Commande <strong>{orderToReject.order_number}</strong> ({orderToReject.shipping_full_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderToReject(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              La commande restera active dans son état actuel (
              <span className="font-medium text-foreground">
                {STATUS_LABELS[orderToReject.status] ?? orderToReject.status}
              </span>
              ). Le client verra que sa demande n'a pas été acceptée (par exemple si la commande
              est déjà en cours d'acheminement).
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-primary">
                Motif du refus (optionnel mais recommandé)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex : Commande déjà préparée et remise au livreur…"
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={rejecting}
                onClick={() => setOrderToReject(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleConfirmRejectCancel}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Envoi…</span>
                  </>
                ) : (
                  <span>Confirmer le refus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
