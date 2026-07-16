import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Package, ShoppingBag, TrendingUp, Globe } from "lucide-react";
import { getAnalyticsAdminFn } from "@/lib/admin/analytics.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "En attente",
  paid: "Payées",
  preparing: "En préparation",
  shipped: "Expédiées",
  in_transit: "En livraison",
  delivered: "Livrées",
  cancelled: "Annulées",
  refunded: "Remboursées",
};

const PAYMENT_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_money: "MTN Mobile Money",
  moov_money: "Moov Money",
  tmoney: "TMoney",
  visa: "Visa/Mastercard",
  cash_on_delivery: "Paiement à la livraison",
};

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => getAnalyticsAdminFn(),
  });

  if (isLoading || !data) return <PageLoader />;

  const totalRevenueOrders = data.countryStats.reduce((sum, c) => sum + c.revenueOrdersCount, 0);

  return (
    <div className="space-y-8">
      {/* Cartes de synthèse */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={ShoppingBag}
          label="Commandes totales"
          value={String(data.totalOrders)}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Commandes génératrices de revenu"
          value={String(totalRevenueOrders)}
        />
        <SummaryCard icon={Globe} label="Pays actifs" value={String(data.countryStats.length)} />
      </div>

      {/* Commandes par statut */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-primary">Commandes par statut</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(data.ordersByStatus).map(([status, count]) => (
            <div
              key={status}
              className="rounded-xl border border-border bg-secondary/30 p-3 text-center"
            >
              <div className="font-display text-2xl font-bold text-gold">{count}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {STATUS_LABELS[status] ?? status}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Détail par pays */}
      <section className="space-y-6">
        <h2 className="font-display text-lg font-bold text-primary">Ventes par pays</h2>
        {data.countryStats.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune donnée de vente pour le moment.</p>
        )}
        {data.countryStats.map((c) => (
          <div key={c.countryCode} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold text-primary">{c.countryName}</h3>
              <div className="text-right">
                <div className="font-display text-2xl font-bold text-gold">
                  {formatPrice(c.revenue, c.currencyCode, c.currencySymbol)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.revenueOrdersCount} commande{c.revenueOrdersCount > 1 ? "s" : ""} sur{" "}
                  {c.ordersCount}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {/* Top produits */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Meilleurs produits
                </h4>
                {c.revenueByProduct.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Aucune vente.</p>
                ) : (
                  <div className="mt-3 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={c.revenueByProduct.slice(0, 6)}
                        layout="vertical"
                        margin={{ left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="productName"
                          width={110}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            formatPrice(value, c.currencyCode, c.currencySymbol)
                          }
                        />
                        <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Répartition par moyen de paiement */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Moyens de paiement
                </h4>
                {c.revenueByPaymentMethod.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Aucune vente.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {c.revenueByPaymentMethod.map((pm) => (
                      <li key={pm.method} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/80">
                          {PAYMENT_LABELS[pm.method] ?? pm.method}{" "}
                          <span className="text-muted-foreground">× {pm.count}</span>
                        </span>
                        <span className="font-semibold text-gold">
                          {formatPrice(pm.revenue, c.currencyCode, c.currencySymbol)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-primary">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
