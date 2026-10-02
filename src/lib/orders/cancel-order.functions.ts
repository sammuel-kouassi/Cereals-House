import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCurrentUser } from "@/integrations/neon/auth.server";
import { query, queryOne, ensureCancellationColumns } from "@/integrations/neon/db.server";
import { sendEmail } from "@/lib/email/resend.server";
import {
  buildOrderStatusEmail,
  buildOrderCancelledAdminEmail,
  buildCustomerCancellationRequestAdminEmail,
  buildCustomerCancellationRequestReceivedEmail,
} from "@/lib/email/templates";

const CLIENT_CANCELLABLE_STATUSES = new Set(["pending_payment", "paid", "preparing"]);
const TERMINAL_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

const requestCancellationSchema = z.object({
  orderId: z.string(),
  reason: z.string().trim().max(500).optional(),
});

/**
 * 1. Demande d'annulation par le client.
 * Enregistre la requête sans annuler directement la commande : seul l'administrateur
 * peut ensuite finaliser et valider l'annulation.
 */
export const requestOrderCancellationFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => requestCancellationSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureCancellationColumns();

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

    // Vérification de sécurité : propriétaire ou admin
    if (order.user_id) {
      if (!user || (order.user_id !== user.id && !isAdmin)) {
        throw new Error("Vous n'êtes pas autorisé à modifier cette commande. Veuillez vous connecter au compte approprié.");
      }
    }

    // Statuts terminaux
    if (TERMINAL_STATUSES.has(order.status)) {
      throw new Error("Cette commande est déjà clôturée ou déjà annulée.");
    }

    // Si expédiée ou en transit
    if (order.status === "shipped" || order.status === "in_transit") {
      throw new Error(
        "Cette commande est déjà en cours d'acheminement. Veuillez contacter notre service client pour convenir d'un retour ou d'un refus à la livraison."
      );
    }

    if (!CLIENT_CANCELLABLE_STATUSES.has(order.status)) {
      throw new Error("Cette commande ne peut plus faire l'objet d'une demande d'annulation à ce stade.");
    }

    if (order.cancellation_requested && order.status !== "cancelled") {
      throw new Error("Une demande d'annulation est déjà en cours d'examen par l'administrateur pour cette commande.");
    }

    const fullReason = data.reason?.trim() || "Demande d'annulation formulée par le client";

    // 1. Enregistrement de la demande d'annulation
    await query(
      `UPDATE orders 
       SET cancellation_requested = true, 
           cancellation_request_reason = $1, 
           cancellation_requested_at = now(), 
           cancellation_request_status = 'pending', 
           updated_at = now() 
       WHERE id = $2`,
      [fullReason, order.id]
    );

    // 2. Traçabilité dans l'historique
    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, $2, $3, $4)`,
      [
        order.id,
        order.status,
        `Demande d'annulation client soumise (en attente de validation administrateur) : ${fullReason}`,
        user?.id || null,
      ]
    );

    const appUrl = getPublicAppUrl();

    // 3. Notification interne dans admin_notifications
    try {
      const notifTitle = `Demande d'annulation : ${order.order_number}`;
      const notifMessage = `Le client ${order.shipping_full_name} (${order.shipping_phone}) demande l'annulation de la commande ${order.order_number}. Motif : ${fullReason}`;
      
      // On tente d'insérer avec le type 'cancellation_request', sinon repli sur 'quote_request'
      try {
        await query(
          `INSERT INTO admin_notifications (type, reference_id, title, message) VALUES ($1, $2, $3, $4)`,
          ["cancellation_request", order.id, notifTitle, notifMessage]
        );
      } catch {
        await query(
          `INSERT INTO admin_notifications (type, reference_id, title, message) VALUES ($1, $2, $3, $4)`,
          ["quote_request", order.id, notifTitle, notifMessage]
        );
      }
    } catch (err) {
      console.error("[orders] Échec de l'insertion dans admin_notifications", err);
    }

    // 4. Email prioritaire à l'administrateur / propriétaire
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SHOP_OWNER_EMAIL || "lucettedossou@gmail.com";
      const toAdmin = adminEmail.includes("<") ? adminEmail.match(/<([^>]+)>/)?.[1] || adminEmail : adminEmail;

      const adminEmailContent = buildCustomerCancellationRequestAdminEmail({
        orderNumber: order.order_number,
        customerName: order.shipping_full_name,
        phone: order.shipping_phone,
        amount: `${Number(order.total).toLocaleString("fr-FR")} ${order.currency_code}`,
        paymentStatus: order.payment_status,
        reason: fullReason,
        adminUrl: `${appUrl}/admin/orders`,
      });

      await sendEmail({
        to: toAdmin,
        subject: adminEmailContent.subject,
        html: adminEmailContent.html,
      });
    } catch (err) {
      console.error("[orders] Échec de la notification email administrateur pour demande d'annulation", err);
    }

    // 5. Email de confirmation de prise en compte au client
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

    if (customerEmail) {
      try {
        const clientEmailContent = buildCustomerCancellationRequestReceivedEmail({
          orderNumber: order.order_number,
          customerName: order.shipping_full_name,
          reason: fullReason,
          trackingUrl: `${appUrl}/orders/${order.id}`,
        });

        await sendEmail({
          to: customerEmail,
          subject: clientEmailContent.subject,
          html: clientEmailContent.html,
        });
      } catch (err) {
        console.error("[orders] Échec de l'envoi de l'email accusé de réception client", err);
      }
    }

    return {
      success: true,
      status: "cancellation_requested",
      message: "Votre demande d'annulation a bien été transmise à notre administration. Vous serez notifié dès sa finalisation.",
    };
  });

const finalizeCancellationSchema = z.object({
  orderId: z.string(),
  approved: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

/**
 * 2. Finalisation exclusive de l'annulation par l'ADMINISTRATEUR.
 * Si approved = true : réintègre les stocks, passe la commande à 'cancelled'
 * et notifie le client de la confirmation officielle de l'annulation.
 */
export const finalizeOrderCancellationAdminFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => finalizeCancellationSchema.parse(data))
  .handler(async ({ data }) => {
    await ensureCancellationColumns();

    const user = await getCurrentUser();
    if (user?.role !== "admin") {
      throw new Error("Seul un administrateur est autorisé à finaliser ou rejeter une annulation.");
    }

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

    const appUrl = getPublicAppUrl();

    // Cas 1 : L'administrateur REJETTE la demande d'annulation (ex: colis déjà remis au livreur)
    if (!data.approved) {
      const rejectReason = data.note?.trim() || "Demande d'annulation rejetée par l'administrateur";

      await query(
        `UPDATE orders 
         SET cancellation_requested = false, 
             cancellation_request_status = 'rejected', 
             updated_at = now() 
         WHERE id = $1`,
        [order.id]
      );

      await query(
        `INSERT INTO order_status_history (order_id, status, note, created_by)
         VALUES ($1, $2, $3, $4)`,
        [
          order.id,
          order.status,
          `Demande d'annulation rejetée par l'administrateur : ${rejectReason}`,
          user.id,
        ]
      );

      return {
        success: true,
        approved: false,
        message: "La demande d'annulation a été rejetée. La commande reste active.",
      };
    }

    // Cas 2 : L'administrateur VALIDE & FINALISE l'annulation
    const cancellationReason =
      data.note?.trim() ||
      order.cancellation_request_reason ||
      "Annulation validée par l'administrateur";

    // A. Réintégration automatique des stocks
    const items = await query<any>(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL`,
      [order.id]
    );

    for (const item of (items ?? [])) {
      try {
        await query(`SELECT increment_product_stock($1, $2)`, [item.product_id, item.quantity]);
      } catch {
        await query(
          `UPDATE products SET stock = stock + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        ).catch(() => null);
      }
    }

    // B. Mise à jour de la commande en statut 'cancelled'
    await query(
      `UPDATE orders 
       SET status = 'cancelled', 
           cancellation_reason = $1, 
           cancelled_at = now(), 
           cancelled_by = 'admin_confirmed', 
           cancellation_requested = true, 
           cancellation_request_status = 'approved', 
           updated_at = now() 
       WHERE id = $2`,
      [cancellationReason, order.id]
    );

    // C. Traçabilité dans l'historique
    await query(
      `INSERT INTO order_status_history (order_id, status, note, created_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [
        order.id,
        `Annulation officiellement validée et finalisée par l'administrateur : ${cancellationReason}`,
        user.id,
      ]
    );

    // D. Notification email au client pour confirmer que sa commande est bien annulée
    let customerEmail: string | undefined;
    if (order.user_id) {
      const u = await queryOne<{ email: string }>(
        `SELECT email FROM users WHERE id = $1 LIMIT 1`,
        [order.user_id]
      );
      customerEmail = u?.email;
    }

    if (customerEmail) {
      try {
        const trackingUrl = `${appUrl}/orders/${order.id}`;
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

    // E. Si payée, alerter le propriétaire pour traiter le remboursement
    if (order.payment_status === "paid") {
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL || process.env.ADMIN_EMAIL;
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
      approved: true,
      status: "cancelled",
      requiresRefund: order.payment_status === "paid",
      cancellationReason,
      message: `La commande ${order.order_number} a été officiellement annulée. Les stocks ont été réintégrés et le client notifié.`,
    };
  });

/**
 * 3. Point d'entrée legacy cancelOrderFn :
 * Si appelé par un admin : effectue l'annulation directement.
 * Si appelé par un client : redirige vers la demande d'annulation requestOrderCancellationFn
 * pour garantir que seul l'administrateur peut finaliser l'annulation !
 */
export const cancelOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => requestCancellationSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "admin";

    if (!isAdmin) {
      return requestOrderCancellationFn({ data });
    }

    return finalizeOrderCancellationAdminFn({
      data: {
        orderId: data.orderId,
        approved: true,
        note: data.reason,
      },
    });
  });
