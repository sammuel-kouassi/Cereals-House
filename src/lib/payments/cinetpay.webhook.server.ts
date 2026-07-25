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
import { verifyAndConfirmPayment } from "@/lib/payments/payment-confirmation.server";

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
        "id, order_number, status, payment_status, payment_notify_token, country_code, total, currency_code, payment_method, cinetpay_transaction_id",
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

    // On ne fait JAMAIS confiance au statut du webhook lui-même : on
    // reconfirme toujours auprès de CinetPay (voir payment-confirmation.server.ts,
    // partagée avec la vérification active déclenchée au retour du client).
    await verifyAndConfirmPayment(order);

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
        .select("id, user_id, payment_link_token")
        .eq("payment_reference", merchantTransactionId)
        .maybeSingle();
      if (order) {
        // Commande invité (devis pro payé via lien, pas de compte) : la page
        // /orders/$id est inaccessible sans connexion (RLS), il faut
        // renvoyer vers la même page de paiement publique, qui affichera
        // "déjà payée" une fois le statut confirmé.
        redirectPath = order.user_id
          ? `/orders/${order.id}`
          : `/pay/${order.id}?token=${order.payment_link_token}`;
      }
    } catch (error) {
      console.error("[cinetpay:return] erreur de lookup", error);
    }
  }

  return Response.redirect(new URL(redirectPath, url.origin).toString(), 303);
}
