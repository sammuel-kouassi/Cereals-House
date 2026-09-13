import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack.server";
import { query, queryOne } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildPaymentReceivedAdminEmail } from "@/lib/email/templates";
import { notifyCustomerOfStatusChange } from "@/lib/orders/order-notifications.server";

export async function handlePaystackWebhook(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response("Paystack Webhook Endpoint Active", { status: 200 });
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[Paystack Webhook] Impossible de lire le corps de la requête :", err);
    return new Response("Invalid Body", { status: 400 });
  }

  const signature = request.headers.get("x-paystack-signature");

  // En production ou si configuré, validation de la signature
  const isSignatureValid = verifyPaystackWebhookSignature(rawBody, signature);
  if (!isSignatureValid && process.env.NODE_ENV === "production") {
    console.error("[Paystack Webhook] Signature invalide rejetée.");
    return new Response("Invalid signature", { status: 401 });
  }

  let eventData: any;
  try {
    eventData = JSON.parse(rawBody);
  } catch (err) {
    console.error("[Paystack Webhook] JSON invalide :", err);
    return new Response("Malformed JSON", { status: 400 });
  }

  console.log(`[Paystack Webhook] Événement reçu : ${eventData.event}`);

  if (eventData.event === "charge.success") {
    const data = eventData.data;
    const reference = data.reference;
    const orderId = data.metadata?.order_id;
    const channel = data.channel || "paystack";

    try {
      // Recherche de la commande associée
      const order = await queryOne<any>(
        `SELECT id, order_number, status, payment_status, country_code,
                total, currency_code, payment_method, shipping_full_name
         FROM orders
         WHERE payment_reference = $1 OR id = $2 LIMIT 1`,
        [reference, orderId || "00000000-0000-0000-0000-000000000000"],
      );

      if (!order) {
        console.warn(`[Paystack Webhook] Commande introuvable pour reference=${reference} / order_id=${orderId}`);
        return new Response("OK", { status: 200 });
      }

      if (order.payment_status === "paid") {
        console.log(`[Paystack Webhook] Commande #${order.order_number} déjà marquée payée.`);
        return new Response("OK", { status: 200 });
      }

      // Mapping sécurisé du canal vers l'enum payment_method
      let mappedMethod = "paystack";
      const c = (channel || "").toLowerCase();
      if (c.includes("wave")) mappedMethod = "wave";
      else if (c.includes("orange")) mappedMethod = "orange_money";
      else if (c.includes("mtn")) mappedMethod = "mtn_money";
      else if (c.includes("moov")) mappedMethod = "moov_money";
      else if (c.includes("card") || c.includes("visa") || c.includes("master") || c.includes("apple")) mappedMethod = "visa";

      // Mise à jour de la commande
      const nextStatus = order.status === "pending_payment" ? "paid" : order.status;
      await query(
        `UPDATE orders SET
           payment_status = 'paid',
           status = $1,
           payment_method = $2,
           payment_reference = COALESCE($3, payment_reference),
           updated_at = now()
         WHERE id = $4`,
        [nextStatus, mappedMethod, reference, order.id],
      );

      // Enregistrement dans l'historique de statut
      const existingHistory = await queryOne<{ id: string }>(
        `SELECT id FROM order_status_history WHERE order_id = $1 AND status = 'paid' LIMIT 1`,
        [order.id],
      );

      if (!existingHistory) {
        await query(
          `INSERT INTO order_status_history (order_id, status, note)
           VALUES ($1, 'paid', $2)`,
          [order.id, `Paiement confirmé par Paystack (${channel.toUpperCase()})`],
        );

        // Notifications email
        try {
          await notifyCustomerOfStatusChange(order.id, "paid");
        } catch (notifyErr) {
          console.error("[Paystack Webhook] Erreur notification email client :", notifyErr);
        }

        try {
          const ownerEmail = process.env.SHOP_OWNER_EMAIL;
          if (ownerEmail) {
            const appUrl = getPublicAppUrl();
            const emailContent = buildPaymentReceivedAdminEmail({
              orderNumber: order.order_number,
              amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
              countryCode: order.country_code,
              paymentMethod: `Paystack (${channel})`,
              adminUrl: `${appUrl}/admin/orders`,
            });

            await sendEmail({
              to: ownerEmail,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }
        } catch (ownerEmailErr) {
          console.error("[Paystack Webhook] Erreur notification email gérant :", ownerEmailErr);
        }
      }

      console.log(`[Paystack Webhook] Succès : Commande #${order.order_number} passée au statut 'paid'.`);
      return new Response("OK", { status: 200 });
    } catch (dbErr) {
      console.error("[Paystack Webhook Error Database]", dbErr);
      return new Response("Database Error", { status: 500 });
    }
  }

  return new Response("Event ignored", { status: 200 });
}
