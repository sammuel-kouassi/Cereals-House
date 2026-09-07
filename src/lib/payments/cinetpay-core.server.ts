import {
  getCinetPayClient,
  isCinetPayCountryReady,
  CINETPAY_MIN_AMOUNT,
  CINETPAY_MAX_AMOUNT,
} from "@/lib/payments/cinetpay.server";
import { ApiError, ValidationError } from "cinetpay-js";
import type { PaymentMethod } from "cinetpay-js";
import { getAppUrl } from "@/lib/app-url.server";
import { query } from "@/integrations/neon/db.server";

export const PAYMENT_METHOD_MAP: Partial<Record<string, Partial<Record<string, PaymentMethod>>>> = {
  CI: { orange_money: "OM_CI", wave: "WAVE_CI", mtn_money: "MTN_CI", moov_money: "MOOV_CI" },
  BF: { orange_money: "OM_BF", wave: "WAVE_BF", moov_money: "MOOV_BF" },
  ML: { orange_money: "OM_ML", moov_money: "MOOV_ML" },
  TG: { moov_money: "MOOV_TG", tmoney: "TMONEY_TG" },
  BJ: { moov_money: "MOOV_BJ", mtn_money: "MTN_BJ" },
};

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
  paymentMethodOverride?: string;
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

  const merchantTransactionId = `${order.order_number}-${Date.now().toString(36)}`.slice(0, 30);
  const { firstName, lastName } = splitName(order.shipping_full_name);
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

    if (!result.paymentUrl) {
      throw new Error(
        result.details?.message ||
          "CinetPay n'a renvoyé aucune URL de paiement pour cette commande.",
      );
    }

    await query(
      `UPDATE orders SET
         payment_reference = $1,
         cinetpay_transaction_id = $2,
         payment_token = $3,
         payment_notify_token = $4,
         payment_method = COALESCE($5, payment_method),
         updated_at = now()
       WHERE id = $6`,
      [
        merchantTransactionId,
        result.transactionId,
        result.paymentToken,
        result.notifyToken,
        params.paymentMethodOverride || null,
        order.id,
      ]
    );

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
