import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { query } from "@/integrations/neon/db.server";
import { getPublicAppUrl } from "@/lib/app-url.server";

const DEFAULT_TEST_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const DEFAULT_TEST_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || "";

function cleanEnvVal(val: string | undefined | null): string {
  if (!val) return "";
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function readEnvKey(key: string): string {
  // 1. Essai depuis process.env nettoyé
  const fromProcess = cleanEnvVal(process.env[key]);
  if (fromProcess) {
    if (key === "PAYSTACK_SECRET_KEY" && fromProcess.startsWith("sk_")) return fromProcess;
    if (key === "PAYSTACK_PUBLIC_KEY" && fromProcess.startsWith("pk_")) return fromProcess;
  }

  // 2. Essai depuis les fichiers .env sur le disque
  try {
    const candidates = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "cereals-house", ".env"),
      "c:\\Users\\sammu\\Cereals House\\cereals-house\\.env",
      "c:\\Users\\sammu\\Cereals House\\.env",
    ];
    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
        if (match) {
          const val = cleanEnvVal(match[1]);
          if (key === "PAYSTACK_SECRET_KEY" && val.startsWith("sk_")) return val;
          if (key === "PAYSTACK_PUBLIC_KEY" && val.startsWith("pk_")) return val;
          if (val) return val;
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Clés de test par défaut si non trouvées
  if (key === "PAYSTACK_SECRET_KEY") return DEFAULT_TEST_SECRET_KEY;
  if (key === "PAYSTACK_PUBLIC_KEY") return DEFAULT_TEST_PUBLIC_KEY;
  return "";
}

export function getPaystackSecretKey(): string {
  const k = cleanEnvVal(readEnvKey("PAYSTACK_SECRET_KEY"));
  return k.startsWith("sk_") ? k : DEFAULT_TEST_SECRET_KEY;
}

export function getPaystackPublicKey(): string {
  const k = cleanEnvVal(readEnvKey("PAYSTACK_PUBLIC_KEY"));
  return k.startsWith("pk_") ? k : DEFAULT_TEST_PUBLIC_KEY;
}

export function isPaystackConfigured(): boolean {
  const key = getPaystackSecretKey();
  return !!key && key.startsWith("sk_");
}

export type InitializePaystackParams = {
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
};

export type InitializePaystackResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

/**
 * Initialise une transaction Paystack sécurisée
 */
export async function initializePaystackTransaction(
  params: InitializePaystackParams,
): Promise<InitializePaystackResult> {
  const { order, email } = params;
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    throw new Error("Clé secrète Paystack manquante.");
  }

  const reference = `ch_${order.order_number}_${Date.now().toString(36)}`;
  const returnBaseUrl = getPublicAppUrl();
  const callbackUrl =
    params.callbackUrl ||
    `${returnBaseUrl}/orders/${order.id}?reference=${reference}&payment_provider=paystack`;

  // Montant en sous-unités (pour XOF, USD, EUR, etc. : montant * 100)
  const amountInSubunits = Math.round(Number(order.total) * 100);
  const currency = (order.currency_code || "XOF").toUpperCase();

  // Appel de l'API officielle Paystack
  const payload: Record<string, any> = {
    email: email || "client@cerealshouse.com",
    amount: amountInSubunits,
    currency,
    reference,
    callback_url: callbackUrl,
    metadata: {
      order_id: order.id,
      order_number: order.order_number,
      country_code: order.country_code,
      customer_name: order.shipping_full_name,
      customer_phone: order.shipping_phone,
    },
  };

  // En Côte d'Ivoire, activation des canaux Mobile Money et Carte
  if (order.country_code === "CI") {
    payload.channels = ["mobile_money", "card", "apple_pay"];
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as any;

  if (!res.ok || !data.status || !data.data?.authorization_url) {
    console.error("[Paystack Init Error]", data);
    throw new Error(
      data.message || "Erreur lors de l'initialisation du paiement Paystack.",
    );
  }

  // Mise à jour de la commande avec la référence
  await query(
    `UPDATE orders SET
       payment_reference = $1,
       payment_method = 'paystack',
       updated_at = now()
     WHERE id = $2`,
    [reference, order.id],
  );

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Vérifie le statut d'une transaction directement auprès de l'API Paystack
 */
export async function verifyPaystackTransaction(reference: string) {
  const secretKey = getPaystackSecretKey();

  if (!secretKey) {
    return {
      success: false,
      status: "failed" as const,
      message: "Clé secrète Paystack manquante",
    };
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );

  const data = (await res.json()) as any;

  if (!res.ok || !data.status) {
    console.error("[Paystack Verify Error]", data);
    return {
      success: false,
      status: "failed" as const,
      message: data.message || "Transaction non vérifiable",
    };
  }

  const tx = data.data;
  return {
    success: tx.status === "success",
    status: tx.status as "success" | "failed" | "abandoned" | "pending",
    amount: tx.amount ? tx.amount / 100 : 0,
    currency: tx.currency,
    reference: tx.reference,
    channel: tx.channel,
    raw: tx,
  };
}

/**
 * Vérifie la signature cryptographique du Webhook Paystack (HMAC-SHA512)
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secretKey = getPaystackSecretKey();
  if (!secretKey || !signature) return false;

  try {
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");
    return hash === signature;
  } catch (err) {
    console.error("[Paystack Webhook Signature Error]", err);
    return false;
  }
}
