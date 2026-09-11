import { parseNotification, verifyNotification, ApiError } from "cinetpay-js";
import { verifyAndConfirmPayment } from "@/lib/payments/payment-confirmation.server";
import { queryOne } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";

export async function handleCinetPayNotify(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response("OK", { status: 200 });
  }

  let notification;
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await request.json();
    }
    notification = parseNotification(body);
  } catch (e) {
    console.error("[cinetpay:notify] payload invalide", e);
    return new Response("OK", { status: 200 });
  }

  try {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, payment_notify_token,
              country_code, total, currency_code, payment_method, cinetpay_transaction_id
       FROM orders WHERE payment_reference = $1 LIMIT 1`,
      [notification.merchantTransactionId]
    );

    if (!order) {
      console.error(
        `[cinetpay:notify] Aucune commande pour merchant_transaction_id=${notification.merchantTransactionId}`,
      );
      return new Response("OK", { status: 200 });
    }

    if (
      !order.payment_notify_token ||
      !verifyNotification(order.payment_notify_token, notification.notifyToken)
    ) {
      console.error(`[cinetpay:notify] notifyToken invalide pour la commande ${order.id}`);
      return new Response("Invalid token", { status: 401 });
    }

    await verifyAndConfirmPayment(order);

    return new Response("OK", { status: 200 });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[cinetpay:notify] erreur API CinetPay", error.apiCode, error.description);
    } else {
      console.error("[cinetpay:notify] erreur de traitement", error);
    }
    return new Response("ERROR", { status: 500 });
  }
}

export async function handleCinetPayReturn(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const merchantTransactionId =
    url.searchParams.get("merchant_transaction_id") ??
    url.searchParams.get("merchantTransactionId") ??
    url.searchParams.get("transaction_id");

  let redirectPath = "/orders";
  if (merchantTransactionId) {
    try {
      const order = await queryOne<any>(
        `SELECT id, user_id FROM orders WHERE payment_reference = $1 LIMIT 1`,
        [merchantTransactionId]
      );
      if (order) {
        redirectPath = `/orders/${order.id}`;
      }
    } catch (error) {
      console.error("[cinetpay:return] erreur de lookup", error);
    }
  }

  const baseAppUrl = getPublicAppUrl();
  return Response.redirect(new URL(redirectPath, baseAppUrl).toString(), 303);
}
