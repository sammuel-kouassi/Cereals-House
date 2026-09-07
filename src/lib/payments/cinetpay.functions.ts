import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isCinetPayCountryReady } from "@/lib/payments/cinetpay.server";
import { initiateCinetPayForOrder } from "@/lib/payments/cinetpay-core.server";
import { queryOne } from "@/integrations/neon/db.server";
import { getCurrentUser } from "@/integrations/neon/auth.server";

const inputSchema = z.object({
  orderId: z.string(),
  phoneNumber: z.string().trim().min(8).max(20).optional(),
});

export const initiateCinetPayPaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    const order = await queryOne<any>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );

    if (!order) {
      throw new Error("Commande introuvable.");
    }

    if (!isCinetPayCountryReady(order.country_code)) {
      throw new Error("Le paiement en ligne automatique n'est pas encore disponible pour ce pays.");
    }

    const email = user?.email || "client@cerealshouse.com";

    return initiateCinetPayForOrder({
      order,
      email,
      phoneNumberOverride: data.phoneNumber,
    });
  });
