import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isCinetPayCountryReady } from "@/lib/payments/cinetpay.server";
import { initiateCinetPayForOrder } from "@/lib/payments/cinetpay-core.server";
import { query, queryOne } from "@/integrations/neon/db.server";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const createQuoteInputSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional(),
  countryCode: z.string().length(2),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
  shippingFee: z.number().min(0).default(0),
});

export const createQuoteOrderAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => createQuoteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const country = await queryOne<any>(
      `SELECT code, currency_code FROM countries WHERE code = $1 LIMIT 1`,
      [data.countryCode.toUpperCase()]
    );
    if (!country) throw new Error("Pays introuvable.");

    const subtotal = data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const total = subtotal + data.shippingFee;
    const token = generateToken();

    const order = await queryOne<any>(
      `INSERT INTO orders (
        user_id, country_code, currency_code, subtotal, shipping_fee, total,
        shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_notes
      )
      VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, order_number`,
      [
        country.code,
        country.currency_code,
        subtotal,
        data.shippingFee,
        total,
        data.customerName,
        data.phone,
        data.address,
        data.city,
        data.notes || null,
      ]
    );
    if (!order) throw new Error("Échec de la création du devis.");

    for (const it of data.items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, null, $2, $3, $4, $5)`,
        [order.id, it.name, it.unitPrice, it.quantity, it.unitPrice * it.quantity]
      );
    }

    const appUrl = getPublicAppUrl();
    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentLink: `${appUrl}/pay/${order.id}?token=${token}`,
    };
  });

const getQuoteInputSchema = z.object({
  orderId: z.string(),
  token: z.string().min(5),
});

export const getPublicQuoteOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => getQuoteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, currency_code,
              subtotal, shipping_fee, total, shipping_full_name, shipping_phone,
              shipping_address, shipping_city, shipping_notes, created_at
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Lien de paiement invalide ou expiré.");

    const country = await queryOne<any>(
      `SELECT name, currency_symbol FROM countries WHERE code = $1 LIMIT 1`,
      [order.country_code]
    );

    const items = await query<any>(
      `SELECT product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    const canPayOnline = isCinetPayCountryReady(order.country_code);

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      customerName: order.shipping_full_name || "Client",
      countryCode: order.country_code,
      countryName: country?.name ?? order.country_code,
      currencyCode: order.currency_code,
      currencySymbol: country?.currency_symbol ?? order.currency_code,
      subtotal: Number(order.subtotal || 0),
      shippingFee: Number(order.shipping_fee || 0),
      total: Number(order.total || 0),
      canPayOnline,
      items: (items ?? []).map((it: any) => ({
        name: it.product_name,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price || 0),
        lineTotal: Number(it.line_total || 0),
      })),
    };
  });

const initiateGuestInputSchema = z.object({
  orderId: z.string(),
  token: z.string().min(5),
  email: z.string().email(),
  paymentMethod: z.string(),
  phoneNumber: z.string().optional(),
});

export const initiateGuestQuotePaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiateGuestInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Commande introuvable.");

    return initiateCinetPayForOrder({
      order,
      email: data.email,
      paymentMethodOverride: data.paymentMethod,
      phoneNumberOverride: data.phoneNumber,
    });
  });
