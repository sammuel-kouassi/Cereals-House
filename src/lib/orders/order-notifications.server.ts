import { query, queryOne } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail } from "@/lib/email/templates";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";

export async function notifyCustomerOfStatusChange(orderId: string, status: string) {
  const order = await queryOne<any>(
    `SELECT id, order_number, user_id, status, created_at, country_code, currency_code,
            subtotal, shipping_fee, total, payment_method, payment_status, shipping_full_name,
            shipping_address, shipping_city, cancellation_reason
     FROM orders WHERE id = $1 LIMIT 1`,
    [orderId]
  );
  if (!order) return;

  let email: string | undefined;
  if (order.user_id) {
    const u = await queryOne<{ email: string }>(
      `SELECT email FROM users WHERE id = $1 LIMIT 1`,
      [order.user_id]
    );
    email = u?.email;
  }
  if (!email) {
    console.warn(`[orders] Aucun email trouvé pour la commande ${order.order_number}`);
    return;
  }

  const country = await queryOne<any>(
    `SELECT name, currency_symbol FROM countries WHERE code = $1 LIMIT 1`,
    [order.country_code]
  );
  const items = await query<any>(
    `SELECT product_name, quantity, line_total FROM order_items WHERE order_id = $1`,
    [order.id]
  );

  const appUrl = getPublicAppUrl();
  const trackingUrl = `${appUrl}/orders/${order.id}`;

  const emailContent = buildOrderStatusEmail({
    orderNumber: order.order_number,
    status,
    trackingUrl,
    customerName: order.shipping_full_name,
    shippingAddress: order.shipping_address,
    shippingCity: order.shipping_city,
    total: order.total,
    currencySymbol: country?.currency_symbol ?? order.currency_code,
    cancellationReason: order.cancellation_reason,
    requiresRefund: order.payment_status === "paid",
    items: (items ?? []).map((it) => ({
      name: it.product_name,
      quantity: Number(it.quantity),
      lineTotal: Number(it.line_total),
    })),
  });

  if (!emailContent) return;

  let attachments: { filename: string; content: string }[] | undefined;

  // À l'étape "Livré" (ou "delivered"), joindre la facture/reçu officiel en PDF
  if (status === "delivered") {
    try {
      const pdfBytes = await generateReceiptPdf({
        orderNumber: order.order_number,
        createdAt: order.created_at,
        customerName: order.shipping_full_name,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        countryName: country?.name ?? order.country_code,
        currencySymbol: country?.currency_symbol ?? order.currency_code,
        items: (items ?? []).map((it) => ({
          name: it.product_name,
          quantity: Number(it.quantity),
          lineTotal: Number(it.line_total),
        })),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shipping_fee),
        total: Number(order.total),
        paymentMethodLabel: order.payment_method ?? "Paiement en ligne",
      });

      attachments = [
        {
          filename: `facture-${order.order_number}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ];
    } catch (err) {
      console.error("[orders] échec de la génération de la facture PDF", err);
    }
  }

  const result = await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    attachments,
  });

  if (result.sent) {
    console.log(
      `[orders] Email pro statut "${status}" envoyé avec succès à ${email} pour la commande ${order.order_number}${
        attachments ? " (avec facture PDF jointe)" : ""
      }`
    );
  } else {
    console.warn(`[orders] Erreur lors de l'envoi email pro statut "${status}" à ${email}:`, result.error);
  }
}
