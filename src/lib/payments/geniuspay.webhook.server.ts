import { verifyGeniusPayWebhookSignature } from "@/lib/payments/geniuspay.server";
import { query, queryOne } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildPaymentReceivedAdminEmail } from "@/lib/email/templates";
import { notifyCustomerOfStatusChange } from "@/lib/orders/order-notifications.server";

export async function handleGeniusPayWebhook(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response("GeniusPay Webhook Endpoint Active", { status: 200 });
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[GeniusPay Webhook] Impossible de lire le corps de la requête :", err);
    return new Response("Invalid Body", { status: 400 });
  }

  const signature = request.headers.get("x-webhook-signature") || request.headers.get("x-geniuspay-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  const isSignatureValid = verifyGeniusPayWebhookSignature(rawBody, signature, timestamp);
  if (!isSignatureValid && process.env.NODE_ENV === "production" && process.env.GENIUSPAY_WEBHOOK_SECRET) {
    console.error("[GeniusPay Webhook] Signature invalide rejetée.");
    return new Response("Invalid signature", { status: 401 });
  }

  let eventData: any;
  try {
    eventData = JSON.parse(rawBody);
  } catch (err) {
    console.error("[GeniusPay Webhook] JSON invalide :", err);
    return new Response("Malformed JSON", { status: 400 });
  }

  const eventName = (eventData.event || eventData.type || "").toLowerCase();
  console.log(`[GeniusPay Webhook] Événement reçu : ${eventName}`);

  const isSuccessEvent =
    eventName === "payment.success" ||
    eventName === "payment.completed" ||
    eventName === "charge.success" ||
    eventData.status === "success" ||
    eventData.status === "completed";

  if (isSuccessEvent) {
    const data = eventData.data || eventData.payment || eventData;
    const reference = data.reference;
    const orderId = data.metadata?.order_id;
    const gateway = data.payment_method || data.payment_provider || data.gateway || "geniuspay";

    try {
      const order = await queryOne<any>(
        `SELECT id, order_number, status, payment_status, country_code,
                total, currency_code, payment_method, shipping_full_name
         FROM orders
         WHERE payment_reference = $1 OR id = $2 LIMIT 1`,
        [reference, orderId || "00000000-0000-0000-0000-000000000000"],
      );

      if (!order) {
        console.warn(`[GeniusPay Webhook] Commande introuvable pour ref=${reference} / order_id=${orderId}`);
        return new Response("OK", { status: 200 });
      }

      if (order.payment_status === "paid") {
        console.log(`[GeniusPay Webhook] Commande #${order.order_number} déjà marquée payée.`);
        return new Response("OK", { status: 200 });
      }

      const nextStatus = order.status === "pending_payment" ? "paid" : order.status;
      await query(
        `UPDATE orders SET
           payment_status = 'paid',
           status = $1,
           payment_method = 'geniuspay',
           payment_reference = COALESCE($2, payment_reference),
           updated_at = now()
         WHERE id = $3`,
        [nextStatus, reference, order.id],
      );

      const existingHistory = await queryOne<{ id: string }>(
        `SELECT id FROM order_status_history WHERE order_id = $1 AND status = 'paid' LIMIT 1`,
        [order.id],
      );

      if (!existingHistory) {
        await query(
          `INSERT INTO order_status_history (order_id, status, note)
           VALUES ($1, 'paid', $2)`,
          [order.id, `Paiement confirmé par GeniusPay (${String(gateway).toUpperCase()})`],
        );

        try {
          await notifyCustomerOfStatusChange(order.id, "paid");
        } catch (notifyErr) {
          console.error("[GeniusPay Webhook] Erreur email client :", notifyErr);
        }

        try {
          const ownerEmail = process.env.SHOP_OWNER_EMAIL;
          if (ownerEmail) {
            const appUrl = getPublicAppUrl();
            const emailContent = buildPaymentReceivedAdminEmail({
              orderNumber: order.order_number,
              amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
              countryCode: order.country_code,
              paymentMethod: `GeniusPay (${gateway})`,
              adminUrl: `${appUrl}/admin/orders`,
            });

            await sendEmail({
              to: ownerEmail,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }
        } catch (ownerEmailErr) {
          console.error("[GeniusPay Webhook] Erreur email gérant :", ownerEmailErr);
        }
      }

      console.log(`[GeniusPay Webhook] Succès : Commande #${order.order_number} passée au statut 'paid'.`);
      return new Response("OK", { status: 200 });
    } catch (dbErr) {
      console.error("[GeniusPay Webhook Error Database]", dbErr);
      return new Response("Database Error", { status: 500 });
    }
  }

  return new Response("Event ignored", { status: 200 });
}
