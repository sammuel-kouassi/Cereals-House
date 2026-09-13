import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { initializePaystackTransaction } from "@/lib/payments/paystack.server";
import { queryOne } from "@/integrations/neon/db.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";

const initiatePaystackInputSchema = z.object({
  orderId: z.string(),
  emailOverride: z.string().trim().email().optional(),
});

export const initiatePaystackPaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiatePaystackInputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    const order = await queryOne<any>(
      `SELECT id, order_number, country_code, currency_code, total,
              payment_status, payment_method, shipping_full_name, shipping_phone
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId],
    );

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    if (order.payment_status === "paid") {
      throw new Error("Cette commande a déjà été réglée.");
    }

    const email =
      data.emailOverride || user?.email || "client@cerealshouse.com";

    const result = await initializePaystackTransaction({
      order,
      email,
    });

    return {
      paymentUrl: result.authorizationUrl,
      reference: result.reference,
    };
  });
