import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAndConfirmPayment } from "@/lib/payments/payment-confirmation.server";
import { queryOne } from "@/integrations/neon/db.server";

const inputSchema = z.object({ orderId: z.string() });

export const checkPaymentStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, total,
              currency_code, payment_method, payment_reference, cinetpay_transaction_id
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );

    if (!order) throw new Error("Commande introuvable.");

    return verifyAndConfirmPayment(order);
  });

const guestInputSchema = z.object({
  orderId: z.string(),
  token: z.string().optional().or(z.literal("")),
});

export const checkGuestPaymentStatusFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => guestInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, total,
              currency_code, payment_method, payment_reference, cinetpay_transaction_id
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );

    if (!order) throw new Error("Lien de paiement invalide ou expiré.");

    return verifyAndConfirmPayment(order);
  });
