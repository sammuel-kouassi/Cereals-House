// Server function permettant à un CLIENT d'annuler sa propre commande (par
// opposition à updateOrderStatusAdminFn, réservée aux admins). Utilise le
// client Supabase scopé RLS de requireSupabaseAuth : impossible d'annuler la
// commande de quelqu'un d'autre.
//
// ⚠️ CinetPay n'expose AUCUNE API de remboursement automatique (vérifié dans
// leur documentation : un remboursement se fait manuellement depuis leur
// back-office, après validation KYC). Donc pour une commande déjà payée en
// ligne, annuler ne rembourse PAS automatiquement l'argent — ça notifie
// simplement le propriétaire de la boutique par email pour qu'il traite le
// remboursement côté CinetPay, puis marque la commande "remboursée" dans
// /admin/orders une fois fait (ce qui déclenche l'email de confirmation au
// client, déjà en place).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail, buildOrderCancelledAdminEmail } from "@/lib/email/templates";

// Une fois la commande livrée (ou déjà annulée/remboursée), l'annulation n'a
// plus de sens.
const NON_CANCELLABLE_STATUSES = new Set(["delivered", "cancelled", "refunded"]);

const inputSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const cancelOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, country_code, currency_code, total, payment_method",
      )
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !order) {
      throw new Error("Commande introuvable.");
    }
    if (NON_CANCELLABLE_STATUSES.has(order.status)) {
      throw new Error("Cette commande ne peut plus être annulée.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    if (updateErr) throw new Error(updateErr.message);

    await supabaseAdmin.from("order_status_history").insert({
      order_id: order.id,
      status: "cancelled",
      note: data.reason ? `Annulée par le client : ${data.reason}` : "Annulée par le client",
      created_by: userId,
    });

    // Email de confirmation au client — best effort, ne doit jamais faire
    // échouer l'annulation elle-même.
    try {
      const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
      const emailContent = buildOrderStatusEmail({
        orderNumber: order.order_number,
        status: "cancelled",
        trackingUrl: `${appUrl}/orders/${order.id}`,
      });
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userRes?.user?.email;
      if (email && emailContent) {
        await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
      }
    } catch (err) {
      console.error("[orders] échec de l'email de confirmation d'annulation", err);
    }

    // Si la commande était déjà payée, le propriétaire doit être alerté pour
    // traiter le remboursement manuellement sur CinetPay — rien n'est
    // automatique ici, voir l'avertissement en haut du fichier.
    if (order.payment_status === "paid") {
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
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