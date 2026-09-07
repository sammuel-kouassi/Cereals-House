import { getCinetPayClient, type SupportedCinetPayCountry } from "@/lib/payments/cinetpay.server";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildPaymentReceivedAdminEmail } from "@/lib/email/templates";
import { query, queryOne } from "@/integrations/neon/db.server";

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

export async function verifyAndConfirmPayment(
  order: OrderForConfirmation,
): Promise<{ status: "paid" | "failed" | "pending" }> {
  if (order.payment_status === "paid") {
    return { status: "paid" };
  }
  if (!order.cinetpay_transaction_id) {
    return { status: "pending" };
  }

  const client = getCinetPayClient();
  const verification = await client.payment.getStatus(
    order.cinetpay_transaction_id,
    order.country_code as SupportedCinetPayCountry,
  );

  if (verification.status === "SUCCESS") {
    const nextStatus = order.status === "pending_payment" ? "paid" : order.status;
    await query(
      `UPDATE orders SET payment_status = 'paid', status = $1, updated_at = now() WHERE id = $2`,
      [nextStatus, order.id]
    );

    const existingHistory = await queryOne<{ id: string }>(
      `SELECT id FROM order_status_history WHERE order_id = $1 AND status = 'paid' LIMIT 1`,
      [order.id]
    );

    if (!existingHistory) {
      await query(
        `INSERT INTO order_status_history (order_id, status, note)
         VALUES ($1, 'paid', 'Paiement confirmé par CinetPay')`,
        [order.id]
      );

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
    await query(`UPDATE orders SET payment_status = 'failed', updated_at = now() WHERE id = $1`, [order.id]);
    return { status: "failed" };
  }

  return { status: "pending" };
}
