import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendEmail } from "@/lib/email/resend.server";
import { buildQuoteRequestAdminEmail } from "@/lib/email/templates";
import { getPublicAppUrl } from "@/lib/app-url.server";

const submitQuoteSchema = z.object({
  type: z.string(),
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().min(2),
  quantity: z.string().optional(),
  products: z.string().optional(),
  message: z.string().optional(),
});

export const submitQuoteRequestFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => submitQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Insérer la demande dans la DB
    const quote = await queryOne<any>(
      `INSERT INTO quote_requests (
        type, contact_name, company_name, phone, email, location, volume_estimated, products_requested, message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        data.type,
        data.name,
        data.company || null,
        data.phone,
        data.email || null,
        data.location,
        data.quantity || null,
        data.products || null,
        data.message || null,
      ]
    );

    if (!quote) throw new Error("Erreur lors de l'enregistrement de la demande.");

    // 2. Créer une notification interne
    const title = `Nouveau devis B2B : ${data.name}`;
    const notificationMessage = `Demande de type ${data.type} pour la ville de ${data.location}.`;
    await query(
      `INSERT INTO admin_notifications (type, reference_id, title, message) VALUES ($1, $2, $3, $4)`,
      ['quote_request', quote.id, title, notificationMessage]
    );

    // 3. Envoyer un email à l'admin (fallback vers l'email par défaut ou un mail pro si défini)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "apiahrose8@gmail.com";
    
    // On extrait juste l'adresse email si elle est formatée comme "Nom <email>"
    const toAddress = adminEmail.includes("<") ? adminEmail.match(/<([^>]+)>/)?.[1] || adminEmail : adminEmail;

    const baseAppUrl = getPublicAppUrl();
    const adminUrl = `${baseAppUrl}/admin/quotes/${quote.id}`;

    const { subject, html } = buildQuoteRequestAdminEmail({
      contactName: data.name,
      companyName: data.company,
      phone: data.phone,
      email: data.email,
      location: data.location,
      type: data.type,
      volumeEstimated: data.quantity,
      productsRequested: data.products,
      message: data.message,
      adminUrl,
    });

    await sendEmail({
      to: toAddress,
      subject,
      html,
    });

    return { success: true, quoteId: quote.id };
  });

export const getAdminNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return query(`SELECT * FROM admin_notifications WHERE is_read = false ORDER BY created_at DESC`);
  });

export const getQuoteRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return query(`SELECT * FROM quote_requests ORDER BY created_at DESC`);
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await query(`UPDATE admin_notifications SET is_read = true WHERE id = $1`, [data.id]);
    return { success: true };
  });

// Endpoint pour l'administrateur afin de créer la commande depuis la demande
const createInvoiceSchema = z.object({
  quoteId: z.string(),
  subtotal: z.number(),
  shippingFee: z.number(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    unitPrice: z.number(),
    quantity: z.number()
  }))
});

export const createInvoiceFromQuoteFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => createInvoiceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = context.user;

    const quote = await queryOne<any>(`SELECT * FROM quote_requests WHERE id = $1 LIMIT 1`, [data.quoteId]);
    if (!quote) throw new Error("Devis introuvable.");

    const total = data.subtotal + data.shippingFee;
    
    // Pour une facture pro, la country_code par défaut dépendra de l'adresse, on peut mettre CI pour CinetPay
    const countryCode = "CI"; 
    const currencyCode = "XOF";

    // 1. Créer la commande
    const order = await queryOne<any>(
      `INSERT INTO orders (
        user_id, country_code, currency_code, subtotal, shipping_fee, total,
        status, payment_status,
        shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        admin.id, // On assigne la commande à l'admin créateur
        countryCode,
        currencyCode,
        data.subtotal,
        data.shippingFee,
        total,
        'pending_payment',
        'pending',
        quote.contact_name,
        quote.phone,
        quote.location, // Par défaut la ville du devis
        quote.location, // Par défaut
        `Facture générée suite au devis B2B. Entreprise: ${quote.company_name || 'N/A'}`
      ]
    );

    if (!order) throw new Error("Impossible de créer la commande");

    // 2. Créer les articles
    for (const item of data.items) {
      const lineTotal = item.unitPrice * item.quantity;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId || "");
      const validProductId = isUuid ? item.productId : null;
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, validProductId, item.productName, item.unitPrice, item.quantity, lineTotal]
      );
    }

    // 3. Lier la facture au devis et marquer le devis comme processed
    await query(`UPDATE quote_requests SET status = 'processed', order_id = $1, updated_at = now() WHERE id = $2`, [order.id, quote.id]);

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

    const baseAppUrl = getPublicAppUrl();
    const paymentUrl = `${baseAppUrl}/pay/${order.id}?token=${token}`;

    return { success: true, orderId: order.id, paymentUrl, orderNumber: order.order_number, token };
  });
