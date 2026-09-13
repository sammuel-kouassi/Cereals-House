import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";

const createOrderSchema = z.object({
  countryCode: z.string().length(2),
  currencyCode: z.string().min(1).max(10),
  subtotal: z.coerce.number().positive(),
  shippingFee: z.coerce.number().min(0),
  total: z.coerce.number().positive(),
  paymentMethod: z.enum(["orange_money", "wave", "mtn_money", "moov_money", "visa", "cash_on_delivery", "paystack"]),
  shippingFullName: z.string().min(2),
  shippingPhone: z.string().min(5),
  shippingAddress: z.string().min(3),
  shippingCity: z.string().min(2),
  shippingNotes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().optional().nullable(),
      productName: z.string(),
      productImage: z.string().optional().nullable(),
      unitPrice: z.coerce.number().positive(),
      quantity: z.coerce.number().int().positive(),
      lineTotal: z.coerce.number().positive(),
    })
  ).min(1),
});

export const createOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    // 1. Insérer la commande
    const order = await queryOne<any>(
      `INSERT INTO orders (
        user_id, country_code, currency_code, subtotal, shipping_fee, total,
        payment_method, payment_status, status,
        shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'pending_payment', $8, $9, $10, $11, $12)
      RETURNING id, order_number, total, currency_code, status, payment_status, created_at`,
      [
        user?.id || null,
        data.countryCode,
        data.currencyCode,
        data.subtotal,
        data.shippingFee,
        data.total,
        data.paymentMethod,
        data.shippingFullName,
        data.shippingPhone,
        data.shippingAddress,
        data.shippingCity,
        data.shippingNotes || null,
      ]
    );

    if (!order) {
      // Mode fallback en local si base non encore connectée
      const fallbackId = "order-" + Date.now();
      const fallbackNumber = "CH-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      return {
        id: fallbackId,
        orderNumber: fallbackNumber,
        total: data.total,
        currencyCode: data.currencyCode,
        status: "pending_payment",
      };
    }

    // 2. Insérer les articles de commande et décrémenter le stock
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of data.items) {
      let resolvedProductId: string | null = null;
      if (item.productId) {
        if (UUID_REGEX.test(item.productId)) {
          resolvedProductId = item.productId;
        } else {
          // Si le productId est un slug (ex: "bouillie-maman-bebe"), on recherche son ID réel
          const found = await queryOne<{ id: string }>(
            `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
            [item.productId]
          ).catch(() => null);
          if (found?.id) {
            resolvedProductId = found.id;
          }
        }
      }

      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          resolvedProductId,
          item.productName,
          item.productImage || null,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );

      if (resolvedProductId) {
        try {
          await query(`SELECT decrement_product_stock($1, $2)`, [resolvedProductId, item.quantity]);
        } catch (e) {
          console.warn("[Stock decrement error]", e);
        }
      }
    }

    // 3. Historique initial
    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, 'pending_payment', 'Commande initiée par le client', $2)`,
      [order.id, user?.id || null]
    );

    return {
      id: order.id,
      orderNumber: order.order_number,
      total: order.total,
      currencyCode: order.currency_code,
      status: order.status,
    };
  });

export const getOrderByIdFn = createServerFn({ method: "POST" })
  .validator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT o.*, c.name as country_name, c.currency_symbol, c.flag_emoji
       FROM orders o
       LEFT JOIN countries c ON c.code = o.country_code
       WHERE o.id::text = $1 OR o.order_number = $1
       LIMIT 1`,
      [data.orderId]
    );

    if (!order) return null;

    const items = await query<any>(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    const history = await query<any>(
      `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [order.id]
    );

    return { order, items, history };
  });

export const listUserOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const orders = await query<any>(
    `SELECT o.*, c.currency_symbol,
            (SELECT count(*) FROM order_items WHERE order_id = o.id) as items_count
     FROM orders o
     LEFT JOIN countries c ON c.code = o.country_code
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [user.id]
  );

  return orders;
});
