// Server functions d'administration pour les commandes. Toutes utilisent
// supabaseAdmin (service_role) pour les lectures/écritures cross-utilisateurs,
// car les policies RLS actuelles ne permettent à un utilisateur (même admin)
// de voir que ses PROPRES commandes côté client — voir require-admin.ts pour
// le détail de cette décision d'architecture.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";

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

    return { success: true };
  });
