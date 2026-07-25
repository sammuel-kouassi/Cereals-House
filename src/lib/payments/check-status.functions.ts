// Vérification ACTIVE du statut de paiement — déclenchée quand le client
// revient sur le site après CinetPay (page de suivi de commande, page de
// paiement invité), plutôt que d'attendre passivement le webhook qui peut
// être retardé ou, en développement local, ne jamais arriver si le tunnel
// ngrok a un souci au mauvais moment. Réutilise la même logique que le
// webhook (payment-confirmation.server.ts) — les deux chemins sont
// idempotents et peuvent se déclencher en même temps sans double traitement.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyAndConfirmPayment } from "@/lib/payments/payment-confirmation.server";

const inputSchema = z.object({ orderId: z.string().uuid() });

export const checkPaymentStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, country_code, total, currency_code, payment_method, cinetpay_transaction_id",
      )
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !order) throw new Error("Commande introuvable.");

    return verifyAndConfirmPayment(order);
  });

const guestInputSchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(10),
});

export const checkGuestPaymentStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => guestInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, country_code, total, currency_code, payment_method, cinetpay_transaction_id",
      )
      .eq("id", data.orderId)
      .eq("payment_link_token", data.token)
      .maybeSingle();
    if (error || !order) throw new Error("Lien de paiement invalide ou expiré.");

    return verifyAndConfirmPayment(order);
  });
