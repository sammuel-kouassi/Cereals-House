import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { sendEmail } from "@/lib/email/resend.server";
import { buildLowStockAdminEmail } from "@/lib/email/templates";

const LOW_STOCK_THRESHOLD = 15;

const inputSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export const decrementStockAfterOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const lowStockProducts: { name: string; stock: number }[] = [];

    for (const item of data.items) {
      try {
        if (item.productId.startsWith("fallback-")) continue;

        const res = await queryOne<{ decrement_product_stock: number }>(
          `SELECT decrement_product_stock($1, $2)`,
          [item.productId, item.quantity]
        );

        const newStock = res?.decrement_product_stock;

        if (typeof newStock === "number" && newStock <= LOW_STOCK_THRESHOLD) {
          const product = await queryOne<{ name: string }>(
            `SELECT name FROM products WHERE id = $1 LIMIT 1`,
            [item.productId]
          );
          lowStockProducts.push({ name: product?.name ?? item.productId, stock: newStock });
        }
      } catch (error) {
        console.error(`[stock] échec de la décrémentation pour ${item.productId}`, error);
      }
    }

    // Alerte email
    if (lowStockProducts.length > 0) {
      try {
        const ownerEmail = process.env.SHOP_OWNER_EMAIL;
        if (ownerEmail) {
          const appUrl = getPublicAppUrl();
          const emailContent = buildLowStockAdminEmail({
            products: lowStockProducts,
            adminUrl: `${appUrl}/admin/products`,
          });
          await sendEmail({
            to: ownerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
          });
        }
      } catch (err) {
        console.error("[stock] échec de la notification email stock bas", err);
      }
    }

    return { success: true };
  });
