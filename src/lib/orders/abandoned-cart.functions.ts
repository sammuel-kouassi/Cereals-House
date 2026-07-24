// Synchronisation du panier côté serveur (best-effort) + envoi des relances
// paniers abandonnés.
//
// ⚠️ IMPORTANT sur l'automatisation : sendAbandonedCartRemindersFn ne
// s'exécute pas toute seule — il faut soit cliquer sur le bouton dédié dans
// l'admin, soit configurer un Cloudflare Cron Trigger (dans wrangler.jsonc)
// qui appelle cette fonction périodiquement une fois en production. Ce n'est
// pas testable depuis le développement local/ngrok, donc pour l'instant
// c'est un déclenchement manuel — voir la discussion pour le mettre en
// place plus tard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendEmail } from "@/lib/email/resend.server";
import { buildAbandonedCartEmail } from "@/lib/email/templates";

const syncInputSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      slug: z.string(),
      name: z.string(),
      image: z.string(),
      unitPrice: z.number(),
      quantity: z.number(),
    }),
  ),
});

// Appelée (avec un léger débounce côté client) à chaque changement de
// panier, uniquement si l'utilisateur est connecté. Best effort : un échec
// ici ne doit jamais gêner l'expérience d'achat.
export const syncCartSnapshotFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => syncInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.items.length === 0) {
      // Panier vidé (commande passée ou vidé manuellement) : plus rien à
      // relancer, on supprime le snapshot.
      await supabaseAdmin.from("cart_snapshots").delete().eq("user_id", context.userId);
      return { success: true };
    }

    await supabaseAdmin.from("cart_snapshots").upsert({
      user_id: context.userId,
      items: data.items,
      updated_at: new Date().toISOString(),
      reminder_sent_at: null, // le panier a changé, on redonne une chance avant relance
    });
    return { success: true };
  });

const ABANDONED_AFTER_HOURS = 3;

// Déclenchée manuellement depuis l'admin (ou via un Cron Trigger Cloudflare
// en production, voir avertissement en haut du fichier).
export const sendAbandonedCartRemindersFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 60 * 60 * 1000).toISOString();

    const { data: carts, error } = await supabaseAdmin
      .from("cart_snapshots")
      .select("user_id, items, updated_at")
      .lt("updated_at", cutoff)
      .is("reminder_sent_at", null);
    if (error) throw new Error(error.message);

    let sent = 0;
    const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";

    for (const cart of carts ?? []) {
      try {
        const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(cart.user_id);
        const email = userRes?.user?.email;
        if (!email) continue;

        const items = cart.items as { name: string; quantity: number }[];
        const emailContent = buildAbandonedCartEmail({
          items,
          cartUrl: `${appUrl}/cart`,
        });
        const result = await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (result.sent) {
          await supabaseAdmin
            .from("cart_snapshots")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("user_id", cart.user_id);
          sent += 1;
        }
      } catch (err) {
        console.error(`[cart] échec de la relance pour ${cart.user_id}`, err);
      }
    }

    return { sent, total: carts?.length ?? 0 };
  });
