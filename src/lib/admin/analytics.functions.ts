// Server function d'administration : agrégations pour le dashboard analytique.
// Important : chaque pays a sa PROPRE devise (XOF, GHS, EUR, USD…) — on ne
// mélange donc jamais les montants de pays différents dans un seul total.
// Toutes les figures financières restent groupées par pays/devise.
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin/require-admin";

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

// Seules les commandes ayant dépassé "pending_payment" comptent comme du
// chiffre d'affaires réel (une commande jamais payée n'est pas une vente).
const REVENUE_STATUSES = new Set(["paid", "preparing", "shipped", "in_transit", "delivered"]);

export const getAnalyticsAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { data: orders, error: ordersErr },
      { data: items, error: itemsErr },
      { data: countries },
    ] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("id, country_code, currency_code, total, status, payment_method, created_at"),
      supabaseAdmin.from("order_items").select("order_id, product_name, quantity, line_total"),
      supabaseAdmin.from("countries").select("code, name, currency_code, currency_symbol"),
    ]);

    if (ordersErr) throw new Error(ordersErr.message);
    if (itemsErr) throw new Error(itemsErr.message);

    const countryMeta = new Map((countries ?? []).map((c) => [c.code, c]));
    const orderById = new Map((orders ?? []).map((o) => [o.id, o]));

    // --- Commandes par statut (global, indépendant de la devise) ---
    const ordersByStatus: Record<string, number> = Object.fromEntries(
      ORDER_STATUSES.map((s) => [s, 0]),
    );
    for (const o of orders ?? []) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    // --- Regroupement par pays (chaque pays garde sa propre devise) ---
    type CountryBucket = {
      countryCode: string;
      countryName: string;
      currencyCode: string;
      currencySymbol: string;
      ordersCount: number;
      revenueOrdersCount: number;
      revenue: number;
      revenueByProduct: Map<string, { quantity: number; revenue: number }>;
      revenueByPaymentMethod: Map<string, { count: number; revenue: number }>;
    };
    const byCountry = new Map<string, CountryBucket>();

    function getBucket(countryCode: string): CountryBucket {
      let bucket = byCountry.get(countryCode);
      if (!bucket) {
        const meta = countryMeta.get(countryCode);
        bucket = {
          countryCode,
          countryName: meta?.name ?? countryCode,
          currencyCode: meta?.currency_code ?? "?",
          currencySymbol: meta?.currency_symbol ?? "",
          ordersCount: 0,
          revenueOrdersCount: 0,
          revenue: 0,
          revenueByProduct: new Map(),
          revenueByPaymentMethod: new Map(),
        };
        byCountry.set(countryCode, bucket);
      }
      return bucket;
    }

    for (const o of orders ?? []) {
      const bucket = getBucket(o.country_code);
      bucket.ordersCount += 1;
      if (REVENUE_STATUSES.has(o.status)) {
        bucket.revenueOrdersCount += 1;
        bucket.revenue += Number(o.total);

        const method = o.payment_method ?? "cash_on_delivery";
        const pm = bucket.revenueByPaymentMethod.get(method) ?? { count: 0, revenue: 0 };
        pm.count += 1;
        pm.revenue += Number(o.total);
        bucket.revenueByPaymentMethod.set(method, pm);
      }
    }

    for (const it of items ?? []) {
      const order = orderById.get(it.order_id);
      if (!order || !REVENUE_STATUSES.has(order.status)) continue;
      const bucket = getBucket(order.country_code);
      const p = bucket.revenueByProduct.get(it.product_name) ?? { quantity: 0, revenue: 0 };
      p.quantity += it.quantity;
      p.revenue += Number(it.line_total);
      bucket.revenueByProduct.set(it.product_name, p);
    }

    const countryStats = Array.from(byCountry.values())
      .map((b) => ({
        countryCode: b.countryCode,
        countryName: b.countryName,
        currencyCode: b.currencyCode,
        currencySymbol: b.currencySymbol,
        ordersCount: b.ordersCount,
        revenueOrdersCount: b.revenueOrdersCount,
        revenue: b.revenue,
        revenueByProduct: Array.from(b.revenueByProduct.entries())
          .map(([productName, v]) => ({ productName, ...v }))
          .sort((a, c) => c.revenue - a.revenue),
        revenueByPaymentMethod: Array.from(b.revenueByPaymentMethod.entries())
          .map(([method, v]) => ({ method, ...v }))
          .sort((a, c) => c.revenue - a.revenue),
      }))
      .sort((a, c) => c.revenue - a.revenue);

    return {
      ordersByStatus,
      totalOrders: orders?.length ?? 0,
      countryStats,
    };
  });
