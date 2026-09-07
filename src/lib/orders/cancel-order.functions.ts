import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentUser } from "@/integrations/neon/auth.server";
import { query, queryOne } from "@/integrations/neon/db.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail, buildOrderCancelledAdminEmail } from "@/lib/email/templates";

const NON_CANCELLABLE_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

const inputSchema = z.object({
  orderId: z.string(),
  reason: z.string().trim().max(500).optional(),
});

export const cancelOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, currency_code, total, payment_method, user_id
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    if (user && order.user_id && order.user_id !== user.id && user.role !== "admin") {
      throw new Error("Action non autorisée.");
    }

    if (NON_CANCELLABLE_STATUSES.has(order.status)) {
      throw new Error("Cette commande ne peut plus être annulée.");
    }

    await query(`UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1`, [order.id]);

    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [order.id, data.reason ? `Annulée par le client : ${data.reason}` : "Annulée par le client", user?.id || null]
    );

    try {
      const appUrl = getPublicAppUrl();
      const emailContent = buildOrderStatusEmail({
        orderNumber: order.order_number,
        status: "cancelled",
        trackingUrl: `${appUrl}/orders/${order.id}`,
      });
      if (user?.email && emailContent) {
        await sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });
      }
    } catch (err) {
      console.error("[orders] échec de l'email de confirmation d'annulation", err);
    }

    if (order.payment_status === "paid") {
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const appUrl = getPublicAppUrl();
          const emailContent = buildOrderCancelledAdminEmail({
            orderNumber: order.order_number,
            amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
            countryCode: order.country_code,
            reason: data.reason,
            adminUrl: `${appUrl}/admin/orders`,
          });
          await sendEmail({
            to: ownerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (err) {
        console.error("[orders] échec de la notification email propriétaire (annulation)", err);
      }
    }

    return { success: true, requiresRefund: order.payment_status === "paid" };
  });
