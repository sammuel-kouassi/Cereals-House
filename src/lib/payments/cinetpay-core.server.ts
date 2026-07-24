// Cœur de l'initiation de paiement CinetPay, extrait de cinetpay.functions.ts
// pour être partagé entre deux points d'entrée :
//   - le client authentifié (checkout.tsx, orders.$id.tsx)
//   - le client "invité" via un lien de paiement (devis pro négocié sur
//     WhatsApp, voir quote-order.functions.ts) — même logique de paiement,
//     juste une autorisation différente en amont.
import {
  getCinetPayClient,
  isCinetPayCountryReady,
  CINETPAY_MIN_AMOUNT,
  CINETPAY_MAX_AMOUNT,
} from "@/lib/payments/cinetpay.server";
import { ApiError, ValidationError } from "cinetpay-js";
import type { PaymentMethod } from "cinetpay-js";
import { getAppUrl } from "@/lib/app-url.server";

// Correspondance (pays, moyen de paiement de notre UI) → code opérateur exact
// attendu par CinetPay. Gardée pour TOUS les pays UEMOA visés (même ceux
// actuellement inactifs, voir supported-countries.ts) afin de ne pas perdre
// ce travail de correspondance pour quand on les réactivera.
export const PAYMENT_METHOD_MAP: Partial<Record<string, Partial<Record<string, PaymentMethod>>>> = {
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

type OrderForPayment = {
  id: string;
  order_number: string;
  country_code: string;
  payment_status: string;
  payment_method: string | null;
  shipping_full_name: string;
  shipping_phone: string;
  total: number | string;
};

export async function initiateCinetPayForOrder(params: {
  order: OrderForPayment;
  email: string;
  phoneNumberOverride?: string;
  paymentMethodOverride?: string; // utilisé par le flux invité, choisi au moment de payer
}): Promise<{ paymentUrl: string }> {
  const { order, email } = params;
  const country = order.country_code;

  if (!isCinetPayCountryReady(country)) {
    throw new Error("Le paiement en ligne automatique n'est pas encore disponible pour ce pays.");
  }
  if (order.payment_status === "paid") {
    throw new Error("Cette commande est déjà payée.");
  }

  const chosenMethod = params.paymentMethodOverride ?? order.payment_method;

  // "visa" est un cas particulier : il n'existe aucun code PaymentMethod
  // dédié à la carte bancaire dans cette API — en omettant le champ,
  // CinetPay affiche automatiquement l'univers carte bancaire (3D Secure)
  // sur sa page hébergée, en plus du mobile money.
  let paymentMethod: PaymentMethod | undefined;
  if (chosenMethod === "visa") {
    paymentMethod = undefined;
  } else if (chosenMethod) {
    paymentMethod = PAYMENT_METHOD_MAP[country]?.[chosenMethod];
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
  if (!email) {
    throw new Error("Un email valide est nécessaire pour payer en ligne.");
  }

  // merchant_transaction_id unique par tentative : on peut relancer un
  // paiement plusieurs fois sur la même commande (ex : après un échec) sans
  // collision (max 30 caractères imposé par CinetPay).
  const merchantTransactionId = `${order.order_number}-${Date.now().toString(36)}`.slice(0, 30);
  const { firstName, lastName } = splitName(order.shipping_full_name);
  // Normalisation minimale : CinetPay exige un format international sans
  // espaces (+XXXXXXXXXXXX).
  const phoneNumber = (params.phoneNumberOverride ?? order.shipping_phone).replace(/\s+/g, "");
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
      country as never,
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

    // On enregistre la référence, le notifyToken ET le moyen de paiement
    // choisi (utile pour le flux invité où il n'était pas encore fixé) AVANT
    // de rediriger l'utilisateur : le webhook doit pouvoir retrouver la
    // commande et vérifier l'authenticité de la notification.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({
        payment_reference: merchantTransactionId,
        payment_token: result.paymentToken,
        payment_notify_token: result.notifyToken,
        ...(params.paymentMethodOverride
          ? { payment_method: params.paymentMethodOverride as never }
          : {}),
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
}
