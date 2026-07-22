// Server functions d'administration pour les commandes. Toutes utilisent
// supabaseAdmin (service_role) pour les lectures/écritures cross-utilisateurs,
// car les policies RLS actuelles ne permettent à un utilisateur (même admin)
// de voir que ses PROPRES commandes côté client — voir require-admin.ts pour
// le détail de cette décision d'architecture.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendEmail } from "@/lib/email/resend.server";
import { buildOrderStatusEmail } from "@/lib/email/templates";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const listInputSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  countryCode: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listOrdersAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => listInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (data.status) query = query.eq("status", data.status);
    if (data.countryCode) query = query.eq("country_code", data.countryCode);
    if (data.search) query = query.ilike("order_number", `%${data.search}%`);

    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;
    if (error) throw new Error(error.message);

    return { orders: orders ?? [], total: count ?? 0 };
  });

const updateStatusInputSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const updateOrderStatusAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => updateStatusInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (updateErr) throw new Error(updateErr.message);

    const { error: historyErr } = await supabaseAdmin.from("order_status_history").insert({
      order_id: data.orderId,
      status: data.status,
      note: data.note ?? null,
      created_by: context.userId,
    });
    if (historyErr) throw new Error(historyErr.message);

    // Notification email au client — best effort : un échec d'envoi ne doit
    // jamais faire échouer la mise à jour de statut elle-même.
    try {
      await notifyCustomerOfStatusChange(data.orderId, data.status);
    } catch (err) {
      console.error("[orders] échec de la notification email client", err);
    }

    return { success: true };
  });

async function notifyCustomerOfStatusChange(orderId: string, status: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, user_id, status, created_at, country_code, currency_code, subtotal, shipping_fee, total, payment_method, shipping_full_name, shipping_address, shipping_city",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
  const email = userRes?.user?.email;
  if (!email) return;

  const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
  const trackingUrl = `${appUrl}/orders/${order.id}`;
  const emailContent = buildOrderStatusEmail({
    orderNumber: order.order_number,
    status,
    trackingUrl,
  });
  if (!emailContent) return; // statut sans notification prévue (ex: pending_payment)

  let attachments: { filename: string; content: string }[] | undefined;

  if (status === "delivered") {
    try {
      const { data: country } = await supabaseAdmin
        .from("countries")
        .select("name, currency_symbol")
        .eq("code", order.country_code)
        .maybeSingle();
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_name, quantity, line_total")
        .eq("order_id", order.id);

      const pdfBytes = await generateReceiptPdf({
        orderNumber: order.order_number,
        createdAt: order.created_at,
        customerName: order.shipping_full_name,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        countryName: country?.name ?? order.country_code,
        currencySymbol: country?.currency_symbol ?? order.currency_code,
        items: (items ?? []).map((it) => ({
          name: it.product_name,
          quantity: it.quantity,
          lineTotal: Number(it.line_total),
        })),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shipping_fee),
        total: Number(order.total),
        paymentMethodLabel: order.payment_method ?? "Paiement à la livraison",
      });

      attachments = [
        {
          filename: `recu-${order.order_number}.pdf`,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ];
    } catch (err) {
      console.error("[orders] échec de la génération du reçu PDF", err);
    }
  }

  await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    attachments,
  });
}