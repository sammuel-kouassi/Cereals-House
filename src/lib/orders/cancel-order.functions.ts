import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentUser } from "@/integrations/neon/auth.server";
import { query, queryOne } from "@/integrations/neon/db.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail, buildOrderCancelledAdminEmail } from "@/lib/email/templates";

const CLIENT_CANCELLABLE_STATUSES = new Set(["pending_payment", "paid", "preparing"]);
const TERMINAL_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

const inputSchema = z.object({
  orderId: z.string(),
  reason: z.string().trim().max(500).optional(),
});

export const cancelOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    const order = await queryOne<any>(
      `SELECT o.*, c.name as country_name, c.currency_symbol
       FROM orders o
       LEFT JOIN countries c ON c.code = o.country_code
       WHERE o.id::text = $1 OR o.order_number = $1
       LIMIT 1`,
      [data.orderId]
    );

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    // Vérification d'autorisation : le client doit être le propriétaire ou l'admin
    if (user && order.user_id && order.user_id !== user.id && !isAdmin) {
      throw new Error("Vous n'êtes pas autorisé à modifier cette commande.");
    }

    // Statuts terminaux non annulables
    if (TERMINAL_STATUSES.has(order.status)) {
      throw new Error("Cette commande est déjà clôturée ou annulée.");
    }

    // Si le client annule, vérifier qu'elle n'est pas déjà expédiée
    if (!isAdmin) {
      if (order.status === "shipped" || order.status === "in_transit") {
        throw new Error(
          "Cette commande est déjà en cours d'acheminement et ne peut plus être annulée directement. Veuillez contacter notre service client pour organiser un retour ou un refus."
        );
      }
      if (!CLIENT_CANCELLABLE_STATUSES.has(order.status)) {
        throw new Error("Cette commande ne peut plus être annulée à ce stade.");
      }
    }

    const cancelledBy = isAdmin ? "admin" : "customer";
    const cancellationReason = data.reason?.trim() || (isAdmin ? "Annulée par l'administrateur" : "Annulée par le client");

    // 1. Réintégration automatique du stock des articles commandés
    const items = await query<any>(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL`,
      [order.id]
    );

    for (const item of (items ?? [])) {
      try {
        await query(`SELECT increment_product_stock($1, $2)`, [item.product_id, item.quantity]);
      } catch (e) {
        await query(
          `UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        ).catch(() => null);
      }
    }

    // 2. Mise à jour de la commande
    await query(
      `UPDATE orders 
       SET status = 'cancelled', 
           cancellation_reason = $1, 
           cancelled_at = now(), 
           cancelled_by = $2, 
           updated_at = now() 
       WHERE id = $3`,
      [cancellationReason, cancelledBy, order.id]
    );

    // 3. Traçabilité dans l'historique de statut
    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [
        order.id,
        `${isAdmin ? "Annulée par l'administrateur" : "Annulée par le client"} : ${cancellationReason}`,
        user?.id || null,
      ]
    );

    // 4. Notification email au client
    let customerEmail: string | undefined;
    if (order.user_id) {
      const u = await queryOne<{ email: string }>(
        `SELECT email FROM users WHERE id = $1 LIMIT 1`,
        [order.user_id]
      );
      customerEmail = u?.email;
    }
    if (!customerEmail && user?.email) {
      customerEmail = user.email;
    }

    const appUrl = getPublicAppUrl();
    const trackingUrl = `${appUrl}/orders/${order.id}`;

    if (customerEmail) {
      try {
        const emailContent = buildOrderStatusEmail({
          orderNumber: order.order_number,
          status: "cancelled",
          trackingUrl,
          customerName: order.shipping_full_name,
          shippingAddress: order.shipping_address,
          shippingCity: order.shipping_city,
          total: order.total,
          currencySymbol: order.currency_symbol || order.currency_code,
          cancellationReason,
          requiresRefund: order.payment_status === "paid",
        });

        if (emailContent) {
          await sendEmail({
            to: customerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (err) {
        console.error("[orders] Échec de l'envoi de l'email d'annulation client", err);
      }
    }

    // 5. Alerte prioritaire au propriétaire si un remboursement en ligne est requis
    if (order.payment_status === "paid") {
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const emailContent = buildOrderCancelledAdminEmail({
            orderNumber: order.order_number,
            amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
            countryCode: order.country_code,
            reason: cancellationReason,
            adminUrl: `${appUrl}/admin/orders`,
          });
          await sendEmail({
            to: ownerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (err) {
        console.error("[orders] Échec de la notification email propriétaire pour remboursement", err);
      }
    }

    return {
      success: true,
      status: "cancelled",
      requiresRefund: order.payment_status === "paid",
      cancellationReason,
      cancelledBy,
    };
  });
