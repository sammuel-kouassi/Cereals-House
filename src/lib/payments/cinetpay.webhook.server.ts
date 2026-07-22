// Handlers HTTP bruts pour les callbacks CinetPay. Appelés directement depuis
// src/server.ts, EN AMONT du routeur TanStack, car ce sont des requêtes
// serveur-à-serveur (webhook) et navigateur-à-serveur (retour de paiement)
// qui ne passent pas par le mécanisme de "server functions" RPC.
//
// Règles issues du SDK cinetpay-js / de la doc CinetPay :
// - notifyUrl : reçoit un POST JSON avec { notify_token, merchant_transaction_id,
//   transaction_id, user? }. On DOIT vérifier notify_token (timing-safe) avant
//   de faire quoi que ce soit, PUIS reconfirmer le statut réel via
//   client.payment.getStatus() — ne jamais faire confiance au seul webhook.
// - successUrl/failedUrl : redirection navigateur après paiement, purement
//   informative. Aucune écriture en base ne doit s'y produire.
import { parseNotification, verifyNotification, ApiError } from "cinetpay-js";
import { getCinetPayClient, type SupportedCinetPayCountry } from "@/lib/payments/cinetpay.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildPaymentReceivedAdminEmail } from "@/lib/email/templates";

export async function handleCinetPayNotify(request: Request): Promise<Response> {
  if (request.method === "GET") {
    // Ping de disponibilité éventuel.
    return new Response("OK", { status: 200 });
  }

  let notification;
  try {
    const body = await request.json();
    notification = parseNotification(body);
  } catch (e) {
    console.error("[cinetpay:notify] payload invalide", e);
    // On répond 200 quand même : une requête malformée ne doit pas faire
    // boucler CinetPay indéfiniment sur ce webhook.
    return new Response("OK", { status: 200 });
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_notify_token, country_code, total, currency_code, payment_method",
      )
      .eq("payment_reference", notification.merchantTransactionId)
      .maybeSingle();

    if (!order) {
      console.error(
        `[cinetpay:notify] Aucune commande pour merchant_transaction_id=${notification.merchantTransactionId}`,
      );
      return new Response("OK", { status: 200 });
    }

    // Vérification d'authenticité (timing-safe) : le notifyToken reçu doit
    // correspondre à celui généré à l'initialisation pour CETTE commande.
    if (
      !order.payment_notify_token ||
      !verifyNotification(order.payment_notify_token, notification.notifyToken)
    ) {
      console.error(`[cinetpay:notify] notifyToken invalide pour la commande ${order.id}`);
      return new Response("Invalid token", { status: 401 });
    }

    // Anti-rejeu : si déjà marquée payée, inutile de retraiter.
    if (order.payment_status === "paid") {
      return new Response("OK", { status: 200 });
    }

    // On ne fait JAMAIS confiance au statut du webhook lui-même : on reconfirme
    // auprès de CinetPay via l'API de statut, avec le VRAI pays de la commande
    // (et non "CI" en dur — indispensable maintenant que plusieurs pays sont actifs).
    const client = getCinetPayClient();
    const verification = await client.payment.getStatus(
      notification.transactionId,
      order.country_code as SupportedCinetPayCountry,
    );

    if (verification.status === "SUCCESS") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: order.status === "pending_payment" ? "paid" : order.status,
        })
        .eq("id", order.id);

      await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        status: "paid",
        note: "Paiement confirmé par CinetPay",
      });

      // Notification au propriétaire de la boutique — email en attendant que
      // l'API WhatsApp Business soit en place (voir discussion du 22/07/2026).
      // Best effort : ne doit jamais faire échouer le traitement du webhook.
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
          const emailContent = buildPaymentReceivedAdminEmail({
            orderNumber: order.order_number,
            amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
            countryCode: order.country_code,
            paymentMethod: order.payment_method ?? "—",
            adminUrl: `${appUrl}/admin/orders`,
          });
          await sendEmail({
            to: ownerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (err) {
        console.error("[cinetpay:notify] échec de la notification email propriétaire", err);
      }
    } else if (verification.status === "FAILED") {
      await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    }
    // INITIATED / PENDING : statut transitoire, on ne fait rien — CinetPay
    // renverra une nouvelle notification au prochain changement d'état.

    return new Response("OK", { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[cinetpay:notify] erreur API CinetPay", error.apiCode, error.description);
    } else {
      console.error("[cinetpay:notify] erreur de traitement", error);
    }
    // 500 → CinetPay retentera l'envoi de la notification plus tard.
    return new Response("ERROR", { status: 500 });
  }
}

export async function handleCinetPayReturn(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Format exact des paramètres de redirection non garanti à 100% par la doc
  // consultée : on essaie plusieurs noms plausibles par prudence.
  const merchantTransactionId =
    url.searchParams.get("merchant_transaction_id") ??
    url.searchParams.get("merchantTransactionId") ??
    url.searchParams.get("transaction_id");

  let redirectPath = "/orders";
  if (merchantTransactionId) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // Lecture seule : aucune mise à jour ne doit avoir lieu ici.
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("payment_reference", merchantTransactionId)
        .maybeSingle();
      if (order) redirectPath = `/orders/${order.id}`;
    } catch (error) {
      console.error("[cinetpay:return] erreur de lookup", error);
    }
  }

  return Response.redirect(new URL(redirectPath, url.origin).toString(), 303);
}