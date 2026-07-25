import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Package, Download, Printer } from "lucide-react";
import {
  listOrdersAdminFn,
  updateOrderStatusAdminFn,
  exportOrdersAdminFn,
  generatePackingSlipAdminFn,
  checkOrderPaymentStatusAdminFn,
} from "@/lib/admin/orders.functions";
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

const PAGE_SIZE = 25;

function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

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
      // Échappement CSV minimal : double les guillemets internes et entoure
      // toute valeur contenant une virgule, un guillemet ou un retour ligne.
      const escape = (v: unknown) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = columns.join(",");
      const rows = orders.map((o) => columns.map((c) => escape(o[c])).join(","));
      const csv = "\uFEFF" + [header, ...rows].join("\n"); // BOM pour Excel

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
    queryKey: ["admin-orders", statusFilter, search, page],
    queryFn: () =>
      listOrdersAdminFn({
        data: {
          status: (statusFilter || undefined) as (typeof ORDER_STATUSES)[number] | undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
  });

  // Vérification ACTIVE des commandes en attente affichées dans la liste —
  // sans ça, le statut ne se met à jour qu'en rechargeant après être passé
  // par la fiche détail d'une commande, ou en attendant le webhook.
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

  async function handleStatusChange(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusAdminFn({
        data: { orderId, status: status as (typeof ORDER_STATUSES)[number] },
      });
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdatingId(null);
    }
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
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
          value={statusFilter}
          onChange={(e) => {
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
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/20 disabled:opacity-60"
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
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">N° commande</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Pays</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Paiement</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-primary">{o.order_number}</td>
                  <td className="px-4 py-3">{o.shipping_full_name}</td>
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
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gold/30 ${STATUS_BADGE[o.status] ?? "bg-muted"}`}
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
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handlePackingSlip(o.id)}
                      disabled={printingId === o.id}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-gold"
                      title="Bon de préparation"
                    >
                      {printingId === o.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
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
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-40"
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
            className="rounded-full border border-border px-4 py-1.5 text-sm disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
