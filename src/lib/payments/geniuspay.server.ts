import crypto from "node:crypto";
import { query } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";

const DEFAULT_API_URL = "https://geniuspay.ci";

function cleanEnvVal(val: string | undefined | null): string {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function readEnvKey(key: string): string {
  const fromProcess = cleanEnvVal(process.env[key]);
  if (fromProcess) return fromProcess;
  if (key === "GENIUSPAY_API_URL") return DEFAULT_API_URL;
  return "";
}

export function getGeniusPayPublicKey(): string {
  return cleanEnvVal(readEnvKey("GENIUSPAY_PUBLIC_KEY")) || cleanEnvVal(readEnvKey("GENIUSPAY_API_KEY"));
}

export function getGeniusPaySecretKey(): string {
  return cleanEnvVal(readEnvKey("GENIUSPAY_SECRET_KEY")) || cleanEnvVal(readEnvKey("GENIUSPAY_API_SECRET"));
}

export function getGeniusPayApiKey(): string {
  return getGeniusPayPublicKey();
}

export function getGeniusPayApiUrl(): string {
  const u = cleanEnvVal(readEnvKey("GENIUSPAY_API_URL"));
  return u || DEFAULT_API_URL;
}

export function isGeniusPayConfigured(): boolean {
  const key = getGeniusPayPublicKey();
  return !!key && (key.startsWith("pk_") || key.startsWith("sk_"));
}

export type InitializeGeniusPayParams = {
  order: {
    id: string;
    order_number: string;
    country_code: string;
    currency_code?: string | null;
    total: number | string;
    shipping_full_name: string;
    shipping_phone: string;
  };
  email: string;
  callbackUrl?: string;
  mmoProvider?: string;
  channel?: string;
};

export type InitializeGeniusPayResult = {
  checkoutUrl: string;
  reference: string;
  id?: number | string;
};

/**
 * Initialise une transaction de paiement GeniusPay sécurisée
 */
export async function initializeGeniusPayTransaction(
  params: InitializeGeniusPayParams,
): Promise<InitializeGeniusPayResult> {
  const publicKey = getGeniusPayPublicKey();
  const secretKey = getGeniusPaySecretKey();
  const apiUrl = getGeniusPayApiUrl();

  if (!publicKey || !secretKey) {
    throw new Error("Clés API GeniusPay (publique et secrète) manquantes.");
  }

  const returnBaseUrl = getPublicAppUrl();
  const successUrl =
    params.callbackUrl ||
    `${returnBaseUrl}/orders/${order.id}?payment_provider=geniuspay&status=success`;
  const errorUrl = `${returnBaseUrl}/orders/${order.id}?payment_provider=geniuspay&status=failed`;

  // Montant selon la devise (XOF: min 200 FCFA, GHS: min 1 GHS)
  const rawTotal = Number(order.total);
  const currency = (order.currency_code || "XOF").toUpperCase();
  const minAmount = currency === "GHS" ? 1 : 200;
  const amount = Math.max(minAmount, Math.round(rawTotal));

  // Formatage du téléphone avec l'indicatif international du pays
  const countryCode = (order.country_code || "CI").toUpperCase().trim();
  let phone = (order.shipping_phone || "").trim().replace(/[\s\-\(\)]/g, "");

  const COUNTRY_PHONE_PREFIXES: Record<string, string> = {
    CI: "+225",
    SN: "+221",
    BJ: "+229",
    BF: "+226",
    ML: "+223",
    TG: "+228",
    GH: "+233",
  };

  if (phone && !phone.startsWith("+")) {
    const prefix = COUNTRY_PHONE_PREFIXES[countryCode] || "+225";
    if (phone.startsWith("00")) {
      phone = "+" + phone.slice(2);
    } else if (!phone.startsWith(prefix.replace("+", ""))) {
      phone = prefix + phone;
    } else {
      phone = "+" + phone;
    }
  }

  const payload: Record<string, any> = {
    amount,
    currency,
    description: `Commande Cereals House #${order.order_number}`,
    success_url: successUrl,
    error_url: errorUrl,
    country: countryCode,
    customer: {
      name: order.shipping_full_name || "Client Cereals House",
      email: email || "client@cerealshouse.com",
      phone,
      country: countryCode,
    },
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      country_code: countryCode,
      provider: "geniuspay",
      mmo_provider: mmoProvider || "auto",
      channel: channel || "online",
    },
  };

  // Configuration du routage opérateur (PawaPay pour Afrique hors CI, ou Wave/Direct pour CI)
  if (countryCode !== "CI") {
    payload.payment_method = "pawapay";
    if (mmoProvider && mmoProvider !== "auto") {
      payload.mmo_provider = mmoProvider;
    }
  } else {
    // Côte d'Ivoire : si Wave direct
    if (channel === "wave" || channel === "wave_ci") {
      payload.payment_method = "wave";
    } else if (mmoProvider && mmoProvider !== "auto") {
      payload.mmo_provider = mmoProvider;
    }
  }

  const endpoint = `${apiUrl}/api/v1/merchant/payments`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-API-Key": publicKey,
      "X-API-Secret": secretKey,
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(bodyText);
  } catch {
    console.error("[GeniusPay Init Parse Error]", bodyText);
    throw new Error(`Erreur inattendue de GeniusPay (HTTP ${res.status})`);
  }

  if (!res.ok || !data?.success || !data?.data?.checkout_url) {
    console.error("[GeniusPay Init Error]", data);
    throw new Error(
      data?.message || data?.error?.message || "Erreur lors de l'initialisation du paiement GeniusPay.",
    );
  }

  const reference = data.data.reference;
  const checkoutUrl = data.data.checkout_url;

  // Mise à jour de la commande avec la référence GeniusPay
  await query(
    `UPDATE orders SET
       payment_reference = $1,
       payment_method = 'geniuspay',
       updated_at = now()
     WHERE id = $2`,
    [reference, order.id],
  );

  return {
    checkoutUrl,
    reference,
    id: data.data.id,
  };
}

/**
 * Vérifie le statut d'une transaction directement auprès de l'API GeniusPay
 */
export async function verifyGeniusPayTransaction(reference: string) {
  const publicKey = getGeniusPayPublicKey();
  const secretKey = getGeniusPaySecretKey();
  const apiUrl = getGeniusPayApiUrl();

  if (!publicKey || !secretKey) {
    return {
      success: false,
      status: "failed" as const,
      message: "Clés API GeniusPay manquantes",
    };
  }

  const endpoint = `${apiUrl}/api/v1/merchant/payments/${encodeURIComponent(reference)}`;
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        "X-API-Key": publicKey,
        "X-API-Secret": secretKey,
        Authorization: `Bearer ${publicKey}`,
        Accept: "application/json",
      },
    });

    const data = (await res.json()) as any;

    if (!res.ok || !data?.success || !data?.data) {
      console.error("[GeniusPay Verify Error]", data);
      return {
        success: false,
        status: "pending" as const,
        message: data?.message || "Transaction GeniusPay non vérifiable",
      };
    }

    const tx = data.data;
    const rawStatus = (tx.status || "").toLowerCase();
    const isSuccess = rawStatus === "success" || rawStatus === "completed" || rawStatus === "paid";
    const isFailed = rawStatus === "failed" || rawStatus === "cancelled" || rawStatus === "expired";

    return {
      success: isSuccess,
      status: isSuccess ? ("success" as const) : isFailed ? ("failed" as const) : ("pending" as const),
      amount: tx.amount,
      currency: tx.currency,
      reference: tx.reference,
      gateway: tx.payment_method || tx.payment_provider || tx.gateway || "mobile_money",
      raw: tx,
    };
  } catch (err: any) {
    console.error("[GeniusPay Verify Exception]", err);
    return {
      success: false,
      status: "pending" as const,
      message: err.message || "Erreur de connexion avec GeniusPay",
    };
  }
}

/**
 * Vérifie la signature du Webhook GeniusPay (HMAC-SHA256)
 */
export function verifyGeniusPayWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  const webhookSecret = cleanEnvVal(readEnvKey("GENIUSPAY_WEBHOOK_SECRET"));
  const apiKey = getGeniusPayApiKey();
  const isSandbox = !apiKey || apiKey.startsWith("sk_sandbox_") || process.env.GENIUSPAY_ENVIRONMENT === "sandbox";

  if (!webhookSecret) {
    console.warn("[GeniusPay Webhook] GENIUSPAY_WEBHOOK_SECRET non défini : la vérification stricte s'effectuera directement via l'API GeniusPay.");
    return true;
  }

  if (!signature) return false;

  try {
    const message = timestamp ? `${timestamp}.${rawBody}` : rawBody;
    const computed = crypto
      .createHmac("sha256", webhookSecret)
      .update(message)
      .digest("hex");

    const computedBuf = Buffer.from(computed, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    if (computedBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, sigBuf);
  } catch (err) {
    console.error("[GeniusPay Webhook Signature Error]", err);
    return false;
  }
}
