// Décrémente le stock des produits commandés — appelée depuis checkout.tsx
// juste après la création de la commande + de ses lignes. Volontairement
// séparée de l'insertion des commandes (qui reste côté client via RLS) car
// l'écriture sur products.stock nécessite service_role.
//
// Si le stock d'un produit passe sous le seuil bas après décrément, un email
// récapitulatif est envoyé au propriétaire — un seul email même si plusieurs
// produits de la même commande sont concernés, pour éviter de le spammer.
import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendEmail } from "@/lib/email/resend.server";
import { buildLowStockAdminEmail } from "@/lib/email/templates";

const LOW_STOCK_THRESHOLD = 15;

const inputSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export const decrementStockAfterOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const lowStockProducts: { name: string; stock: number }[] = [];

    for (const item of data.items) {
      const { data: newStock, error } = await supabaseAdmin.rpc("decrement_product_stock", {
        p_product_id: item.productId,
        p_qty: item.quantity,
      });
      if (error) {
        console.error(`[stock] échec de la décrémentation pour ${item.productId}`, error);
        continue;
      }
      if (typeof newStock === "number" && newStock <= LOW_STOCK_THRESHOLD) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("name")
          .eq("id", item.productId)
          .maybeSingle();
        lowStockProducts.push({ name: product?.name ?? item.productId, stock: newStock });
      }
    }

    // Alerte email — best effort, ne doit jamais faire échouer la commande.
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
