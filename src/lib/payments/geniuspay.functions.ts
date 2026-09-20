import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { initializeGeniusPayTransaction } from "@/lib/payments/geniuspay.server";
import { queryOne } from "@/integrations/neon/db.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";

const initiateGeniusPayInputSchema = z.object({
  orderId: z.string(),
  emailOverride: z.string().trim().email().optional(),
  mmoProvider: z.string().trim().optional(),
  channel: z.string().trim().optional(),
});

export const initiateGeniusPayPaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiateGeniusPayInputSchema.parse(data))
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

    const result = await initializeGeniusPayTransaction({
      order,
      email,
      mmoProvider: data.mmoProvider,
      channel: data.channel,
    });

    return {
      paymentUrl: result.checkoutUrl,
      reference: result.reference,
    };
  });
