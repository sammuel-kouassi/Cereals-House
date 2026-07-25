// Logique partagée pour confirmer qu'une commande est payée, une fois
// vérifiée auprès de CinetPay (jamais à partir du seul webhook — voir
// cinetpay.webhook.server.ts). Utilisée par DEUX points d'entrée :
//   1. Le webhook CinetPay (notification serveur-à-serveur, passive —
//      peut être retardée, perdue, ou jamais reçue si le tunnel de
//      développement tombe entre l'initiation et le paiement).
//   2. La vérification active (checkPaymentStatusFn / checkGuestPaymentStatusFn)
//      déclenchée quand le client revient sur le site après paiement — ne
//      dépend d'aucune notification externe, donc plus fiable en pratique.
import { getCinetPayClient, type SupportedCinetPayCountry } from "@/lib/payments/cinetpay.server";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildPaymentReceivedAdminEmail } from "@/lib/email/templates";

type OrderForConfirmation = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  country_code: string;
  total: number | string;
  currency_code: string;
  payment_method: string | null;
  cinetpay_transaction_id: string | null;
};

/**
 * Vérifie le statut réel auprès de CinetPay et met à jour la commande en
 * conséquence. Idempotent : si déjà payée, ne fait rien et retourne
 * immédiatement — peut donc être appelée autant de fois que nécessaire
 * (webhook ET vérification active peuvent toutes les deux y arriver en
 * même temps sans risque de double-traitement).
 */
export async function verifyAndConfirmPayment(
  order: OrderForConfirmation,
): Promise<{ status: "paid" | "failed" | "pending" }> {
  if (order.payment_status === "paid") {
    return { status: "paid" };
  }
  if (!order.cinetpay_transaction_id) {
    return { status: "pending" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const client = getCinetPayClient();
  const verification = await client.payment.getStatus(
    order.cinetpay_transaction_id,
    order.country_code as SupportedCinetPayCountry,
  );

  if (verification.status === "SUCCESS") {
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: order.status === "pending_payment" ? "paid" : (order.status as never),
      })
      .eq("id", order.id);

    // Anti-doublon : n'insère l'entrée d'historique et n'envoie l'email
    // que si ce n'est pas déjà fait (webhook et vérification active
    // pourraient sinon créer deux entrées pour le même événement).
    const { data: existingHistory } = await supabaseAdmin
      .from("order_status_history")
      .select("id")
      .eq("order_id", order.id)
      .eq("status", "paid")
      .maybeSingle();

    if (!existingHistory) {
      await supabaseAdmin.from("order_status_history").insert({
        order_id: order.id,
        status: "paid",
        note: "Paiement confirmé par CinetPay",
      });

      // Notification au propriétaire de la boutique — best effort.
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const appUrl = getPublicAppUrl();
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
        console.error("[payment] échec de la notification email propriétaire", err);
      }
    }

    return { status: "paid" };
  }

  if (verification.status === "FAILED") {
    await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    return { status: "failed" };
  }

  // INITIATED / PENDING : toujours en cours côté CinetPay.
  return { status: "pending" };
}
