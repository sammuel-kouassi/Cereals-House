// Server functions d'administration pour les commandes avec Neon DB
import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { query, queryOne } from "@/integrations/neon/db.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail } from "@/lib/email/templates";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";
import { generatePackingSlipPdf } from "@/lib/receipt/generate-packing-slip.server";
import { verifyAndConfirmPayment } from "@/lib/payments/payment-confirmation.server";
import { notifyCustomerOfStatusChange } from "@/lib/orders/order-notifications.server";

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

const listInputSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  countryCode: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listOrdersAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => listInputSchema.parse(data))
  .handler(async ({ data }) => {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (data.status) {
      params.push(data.status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (data.countryCode) {
      params.push(data.countryCode);
      whereClauses.push(`country_code = $${params.length}`);
    }
    if (data.search) {
      params.push(`%${data.search}%`);
      whereClauses.push(`order_number ILIKE $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await queryOne<{ count: string }>(
      `SELECT count(*) as count FROM orders ${whereStr}`,
      params
    );
    const total = parseInt(countRes?.count ?? "0", 10);

    const limit = data.pageSize;
    const offset = data.page * data.pageSize;
    params.push(limit, offset);

    const orders = await query<any>(
      `SELECT o.*, c.name as country_name, c.currency_symbol, c.flag_emoji
       FROM orders o
       LEFT JOIN countries c ON c.code = o.country_code
       ${whereStr}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { orders: orders ?? [], total };
  });

const exportInputSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  countryCode: z.string().optional(),
  search: z.string().trim().optional(),
});

export const exportOrdersAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => exportInputSchema.parse(data))
  .handler(async ({ data }) => {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (data.status) {
      params.push(data.status);
      whereClauses.push(`status = $${params.length}`);
    }
    if (data.countryCode) {
      params.push(data.countryCode);
      whereClauses.push(`country_code = $${params.length}`);
    }
    if (data.search) {
      params.push(`%${data.search}%`);
      whereClauses.push(`order_number ILIKE $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const orders = await query<any>(
      `SELECT * FROM orders ${whereStr} ORDER BY created_at DESC LIMIT 5000`,
      params
    );

    return { orders: orders ?? [] };
  });

const updateStatusInputSchema = z.object({
  orderId: z.string(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const updateOrderStatusAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => updateStatusInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const currentOrder = await queryOne<any>(
      `SELECT id, status, payment_status FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );

    if (!currentOrder) {
      throw new Error("Commande introuvable.");
    }

    // Gestion spécifique de l'annulation par l'admin
    if (data.status === "cancelled" && currentOrder.status !== "cancelled") {
      // 1. Réintégration automatique du stock
      const items = await query<any>(
        `SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL`,
        [data.orderId]
      );
      for (const item of (items ?? [])) {
        try {
          await query(`SELECT increment_product_stock($1, $2)`, [item.product_id, item.quantity]);
        } catch (e) {
          await query(
            `UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2`,
            [item.quantity, item.product_id]
          ).catch(() => null);
        }
      }

      await query(
        `UPDATE orders 
         SET status = 'cancelled', 
             cancellation_reason = $1, 
             cancelled_at = now(), 
             cancelled_by = 'admin', 
             updated_at = now() 
         WHERE id = $2`,
        [data.note?.trim() || "Annulée par l'administrateur", data.orderId]
      );
    } else if (data.status === "refunded") {
      await query(
        `UPDATE orders 
         SET status = 'refunded', 
             payment_status = 'refunded', 
             updated_at = now() 
         WHERE id = $1`,
        [data.orderId]
      );
    } else {
      await query(
        `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`,
        [data.status, data.orderId]
      );
    }

    const historyNote =
      data.status === "cancelled"
        ? `Annulée par l'administrateur${data.note ? ` : ${data.note}` : ""}`
        : data.status === "refunded"
          ? `Remboursement validé par l'administrateur${data.note ? ` : ${data.note}` : ""}`
          : data.note ?? null;

    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, $2, $3, $4)`,
      [data.orderId, data.status, historyNote, context?.user?.id || null]
    );

    try {
      await notifyCustomerOfStatusChange(data.orderId, data.status);
    } catch (err) {
      console.error("[orders] échec de la notification email client", err);
    }

    return { success: true };
  });

const packingSlipInputSchema = z.object({ orderId: z.string() });

export const generatePackingSlipAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => packingSlipInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT order_number, created_at, shipping_full_name, shipping_phone, shipping_address, shipping_city, country_code, shipping_notes, payment_method, payment_status
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Commande introuvable.");

    const country = await queryOne<any>(`SELECT name FROM countries WHERE code = $1 LIMIT 1`, [order.country_code]);
    const items = await query<any>(`SELECT product_name, quantity FROM order_items WHERE order_id = $1`, [data.orderId]);

    const pdfBytes = await generatePackingSlipPdf({
      orderNumber: order.order_number,
      createdAt: order.created_at,
      customerName: order.shipping_full_name,
      customerPhone: order.shipping_phone,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      countryName: country?.name ?? order.country_code,
      notes: order.shipping_notes,
      paymentMethodLabel: order.payment_method ?? "Paiement à la livraison",
      paymentStatus: order.payment_status,
      items: (items ?? []).map((it) => ({
        name: it.product_name,
        quantity: it.quantity,
        unit: "kg",
      })),
    });

    return { pdfBase64: Buffer.from(pdfBytes).toString("base64") };
  });

const checkStatusInputSchema = z.object({ orderId: z.string() });

export const checkOrderPaymentStatusAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => checkStatusInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, total,
              currency_code, payment_method, payment_reference, cinetpay_transaction_id
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Commande introuvable.");

    return verifyAndConfirmPayment(order);
  });
