import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";
import { getLivePromotions } from "@/lib/promotions/promotions.server";
import { currencyDecimals, discountedPrice } from "@/lib/promotions/pricing";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createOrderSchema = z.object({
  countryCode: z.string().length(2),
  currencyCode: z.string().min(1).max(10),
  subtotal: z.coerce.number().positive(),
  shippingFee: z.coerce.number().min(0),
  total: z.coerce.number().positive(),
  paymentMethod: z.enum(["orange_money", "wave", "mtn_money", "moov_money", "visa", "cash_on_delivery", "paystack", "geniuspay"]),
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

    // Le prix fait foi côté serveur : prix de base du pays (repli CI) moins la
    // promotion en cours. Un panier resté ouvert après la fin d'une promo ne peut
    // donc pas être payé à l'ancien prix remisé.
    const promotions = await getLivePromotions();
    const resolvedIds = new Map<string, string | null>();
    for (const item of data.items) {
      if (!item.productId) continue;
      let productId: string | null = null;
      if (UUID_REGEX.test(item.productId)) {
        productId = item.productId;
      } else {
        // Si le productId est un slug (ex: "bouillie-maman-bebe"), on recherche son ID réel
        const found = await queryOne<{ id: string }>(
          `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
          [item.productId]
        ).catch(() => null);
        productId = found?.id ?? null;
      }
      resolvedIds.set(item.productId, productId);
      if (!productId) continue;

      const priceRow = await queryOne<{ price: string }>(
        `SELECT price FROM product_prices
         WHERE product_id = $1 AND country_code IN ($2, 'CI')
         ORDER BY (country_code = $2) DESC
         LIMIT 1`,
        [productId, data.countryCode]
      ).catch(() => null);
      if (!priceRow) continue;

      const promo = promotions.get(productId);
      const basePrice = Number(priceRow.price);
      item.unitPrice = promo
        ? discountedPrice(basePrice, promo.percent_off, currencyDecimals(data.currencyCode))
        : basePrice;
      item.lineTotal = item.unitPrice * item.quantity;
    }

    const calculatedSubtotal = data.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice,
      0
    );
    const calculatedTotal = calculatedSubtotal + data.shippingFee;
    if (Math.abs(calculatedTotal - data.total) > 2) {
      throw new Error(
        "Les prix de votre panier ont été mis à jour (promotion terminée ou modifiée). Vérifiez le nouveau montant puis validez à nouveau."
      );
    }
    const finalSubtotal = calculatedSubtotal;
    const finalTotal = calculatedTotal;

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
        finalSubtotal,
        data.shippingFee,
        finalTotal,
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
    for (const item of data.items) {
      const resolvedProductId = item.productId ? (resolvedIds.get(item.productId) ?? null) : null;

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

    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    // Si la commande est liée à un compte utilisateur enregistré, seul ce compte (ou un admin) peut y accéder
    if (order.user_id && (!user || (user.id !== order.user_id && !isAdmin))) {
      throw new Error("Accès non autorisé à cette commande.");
    }

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
