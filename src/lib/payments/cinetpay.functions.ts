// Server function appelée depuis le client (checkout.tsx, orders.$id.tsx) pour
// démarrer un paiement CinetPay. Le middleware requireSupabaseAuth vérifie le
// token de l'utilisateur et fournit un client Supabase scopé RLS
// (context.supabase) : impossible d'initier un paiement pour la commande de
// quelqu'un d'autre.
//
// Portée actuelle : Côte d'Ivoire, Burkina Faso, Mali, Togo, Bénin (tous en
// XOF). Le Ghana n'est pas supporté par cette API CinetPay (ni le pays, ni sa
// devise GHS) — il faudra un autre agrégateur (Paystack/Flutterwave) pour ce
// marché plus tard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getCinetPayClient,
  isCinetPayCountryReady,
  CINETPAY_MIN_AMOUNT,
  CINETPAY_MAX_AMOUNT,
} from "@/lib/payments/cinetpay.server";
import { ApiError, ValidationError } from "cinetpay-js";
import type { PaymentMethod } from "cinetpay-js";

const inputSchema = z.object({
  orderId: z.string().uuid(),
  // Numéro saisi par le client dans le champ spécifique à l'opérateur choisi
  // au moment du paiement. S'il est fourni, il prime sur le téléphone de
  // livraison, car c'est celui que le client vient de confirmer pour CE
  // moyen de paiement précis (ex: un numéro Wave différent du téléphone de
  // contact habituel).
  phoneNumber: z.string().trim().min(8).max(20).optional(),
});

function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) {
    throw new Error(
      "Variable d'environnement APP_URL manquante (ex: https://cerealshouse.com). " +
        "Nécessaire pour construire les URLs successUrl/failedUrl/notifyUrl envoyées à CinetPay.",
    );
  }
  return url.replace(/\/$/, "");
}

// Correspondance (pays, moyen de paiement de notre UI) → code opérateur exact
// attendu par CinetPay. Gardée pour TOUS les pays UEMOA visés (même ceux
// actuellement inactifs, voir supported-countries.ts) afin de ne pas perdre
// ce travail de correspondance pour quand on les réactivera — d'où le typage
// en `Record<string, ...>` plutôt que `SupportedCinetPayCountry` (qui, lui,
// ne liste que les pays réellement actifs aujourd'hui).
const PAYMENT_METHOD_MAP: Partial<Record<string, Partial<Record<string, PaymentMethod>>>> = {
  CI: { orange_money: "OM_CI", wave: "WAVE_CI", mtn_money: "MTN_CI", moov_money: "MOOV_CI" },
  BF: { orange_money: "OM_BF", wave: "WAVE_BF", moov_money: "MOOV_BF" },
  ML: { orange_money: "OM_ML", moov_money: "MOOV_ML" },
  TG: { moov_money: "MOOV_TG", tmoney: "TMONEY_TG" },
  BJ: { moov_money: "MOOV_BJ", mtn_money: "MTN_BJ" },
};

// Découpe grossière "Prénom Nom" en (prénom, nom) — CinetPay exige les deux
// séparément.
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts.slice(1).join(" "), lastName: parts[0] };
}

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

    const country = order.country_code;
    if (!isCinetPayCountryReady(country)) {
      throw new Error("Le paiement en ligne automatique n'est pas encore disponible pour ce pays.");
    }
    if (order.payment_status === "paid") {
      throw new Error("Cette commande est déjà payée.");
    }

    // "visa" est un cas particulier : il n'existe aucun code PaymentMethod
    // dédié à la carte bancaire dans cette API — en omettant le champ,
    // CinetPay affiche automatiquement l'univers carte bancaire (3D Secure)
    // sur sa page hébergée, en plus du mobile money.
    let paymentMethod: PaymentMethod | undefined;
    if (order.payment_method === "visa") {
      paymentMethod = undefined;
    } else if (order.payment_method) {
      paymentMethod = PAYMENT_METHOD_MAP[country]?.[order.payment_method];
      if (!paymentMethod) {
        throw new Error(
          "Ce moyen de paiement n'est pas disponible pour ce pays via l'intégration en ligne.",
        );
      }
    } else {
      throw new Error("Aucun moyen de paiement sélectionné pour cette commande.");
    }

    const amount = Math.round(Number(order.total));
    if (amount < CINETPAY_MIN_AMOUNT || amount > CINETPAY_MAX_AMOUNT) {
      throw new Error(
        `Le montant (${amount} XOF) est hors des limites acceptées par CinetPay (${CINETPAY_MIN_AMOUNT} - ${CINETPAY_MAX_AMOUNT}).`,
      );
    }

    const email = (claims as Record<string, unknown>)?.email as string | undefined;
    if (!email) {
      throw new Error("Votre compte doit avoir un email valide pour payer en ligne.");
    }

    // merchant_transaction_id unique par tentative : on peut relancer un
    // paiement plusieurs fois sur la même commande (ex : après un échec) sans
    // collision (max 30 caractères imposé par CinetPay).
    const merchantTransactionId = `${order.order_number}-${Date.now().toString(36)}`.slice(0, 30);
    const { firstName, lastName } = splitName(order.shipping_full_name);
    // Normalisation minimale : CinetPay exige un format international sans
    // espaces (+XXXXXXXXXXXX). Le champ de livraison est déjà propre, mais le
    // champ opérateur (démo) peut contenir des espaces tapés par l'utilisateur.
    const phoneNumber = (data.phoneNumber ?? order.shipping_phone).replace(/\s+/g, "");
    const appUrl = getAppUrl();

    try {
      const client = getCinetPayClient();
      const result = await client.payment.initialize(
        {
          currency: "XOF",
          merchantTransactionId,
          amount,
          lang: "fr",
          designation: `Commande ${order.order_number} — Cereals House`,
          clientEmail: email,
          clientFirstName: firstName,
          clientLastName: lastName,
          successUrl: `${appUrl}/api/cinetpay/return?status=success`,
          failedUrl: `${appUrl}/api/cinetpay/return?status=failed`,
          notifyUrl: `${appUrl}/api/cinetpay/notify`,
          channel: "PUSH",
          paymentMethod,
          clientPhoneNumber: phoneNumber,
        },
        country,
      );

      // Garde-fou : si CinetPay répond 200 sans fournir d'URL de paiement
      // (ex: paiement refusé immédiatement pour ce pays/opérateur), on lève
      // une erreur claire plutôt que de rediriger silencieusement vers
      // "undefined" (qui atterrit sur le 404 de notre propre site).
      if (!result.paymentUrl) {
        throw new Error(
          result.details?.message ||
            "CinetPay n'a renvoyé aucune URL de paiement pour cette commande.",
        );
      }

      // On enregistre la référence et le notifyToken AVANT de rediriger
      // l'utilisateur : le webhook doit pouvoir retrouver la commande et
      // vérifier l'authenticité de la notification.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("orders")
        .update({
          payment_reference: merchantTransactionId,
          payment_token: result.paymentToken,
          payment_notify_token: result.notifyToken,
        })
        .eq("id", order.id);

      return { paymentUrl: result.paymentUrl };
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new Error(`Données de paiement invalides : ${err.message}`);
      }
      if (err instanceof ApiError) {
        throw new Error(err.description || err.apiStatus);
      }
      throw err;
    }
  });