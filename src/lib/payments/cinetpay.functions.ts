// Server function appelée depuis le client authentifié (checkout.tsx,
// orders.$id.tsx) pour démarrer un paiement CinetPay. Le middleware
// requireSupabaseAuth vérifie le token de l'utilisateur et fournit un client
// Supabase scopé RLS (context.supabase) : impossible d'initier un paiement
// pour la commande de quelqu'un d'autre.
//
// Pour le flux "invité" (devis pro négocié sur WhatsApp, payé via un lien
// sans compte), voir quote-order.functions.ts qui réutilise le même cœur
// (cinetpay-core.server.ts) avec une autorisation différente (jeton au lieu
// d'authentification).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCinetPayCountryReady } from "@/lib/payments/cinetpay.server";
import { initiateCinetPayForOrder } from "@/lib/payments/cinetpay-core.server";

const inputSchema = z.object({
  orderId: z.string().uuid(),
  // Numéro saisi par le client dans le champ spécifique à l'opérateur choisi
  // au moment du paiement. S'il est fourni, il prime sur le téléphone de
  // livraison, car c'est celui que le client vient de confirmer pour CE
  // moyen de paiement précis (ex: un numéro Wave différent du téléphone de
  // contact habituel).
  phoneNumber: z.string().trim().min(8).max(20).optional(),
});

export const initiateCinetPayPaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !order) {
      throw new Error("Commande introuvable.");
    }
    if (!isCinetPayCountryReady(order.country_code)) {
      throw new Error("Le paiement en ligne automatique n'est pas encore disponible pour ce pays.");
    }

    const email = (claims as Record<string, unknown>)?.email as string | undefined;
    if (!email) {
      throw new Error("Votre compte doit avoir un email valide pour payer en ligne.");
    }

    return initiateCinetPayForOrder({
      order,
      email,
      phoneNumberOverride: data.phoneNumber,
    });
  });
