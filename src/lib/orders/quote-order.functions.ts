// Flux "devis pro payé en ligne" : après négociation manuelle sur WhatsApp,
// l'admin crée une commande (createQuoteOrderAdminFn) qui génère un lien de
// paiement unique. Le client ouvre ce lien SANS COMPTE (getPublicQuoteOrderFn
// pour afficher le récapitulatif, initiateGuestQuotePaymentFn pour payer) —
// le jeton dans le lien fait office d'autorisation à la place d'une connexion.
//
// Sécurité : payment_link_token est un secret aléatoire de 32 octets, non
// devinable. Toute commande invité (user_id NULL) reste invisible via les
// policies RLS classiques (orders_view_own compare à auth.uid(), qui ne
// matche jamais NULL) — seul ce jeton donne accès, exclusivement via ces
// server functions (service_role), jamais en lecture directe côté client.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isCinetPayCountryReady } from "@/lib/payments/cinetpay.server";
import { initiateCinetPayForOrder } from "@/lib/payments/cinetpay-core.server";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const createQuoteInputSchema = z.object({
  customerName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional(),
  countryCode: z.string().length(2),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
  shippingFee: z.number().min(0).default(0),
});

export const createQuoteOrderAdminFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => createQuoteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: country, error: countryErr } = await supabaseAdmin
      .from("countries")
      .select("code, currency_code")
      .eq("code", data.countryCode.toUpperCase())
      .maybeSingle();
    if (countryErr || !country) throw new Error("Pays introuvable.");

    const subtotal = data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const total = subtotal + data.shippingFee;
    const token = generateToken();

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: null,
        guest_email: data.email ?? null,
        payment_link_token: token,
        country_code: country.code,
        currency_code: country.currency_code,
        subtotal,
        shipping_fee: data.shippingFee,
        total,
        shipping_full_name: data.customerName,
        shipping_phone: data.phone,
        shipping_address: data.address,
        shipping_city: data.city,
        shipping_notes: data.notes ?? null,
      })
      .select("id, order_number")
      .single();
    if (error || !order) throw new Error(error?.message ?? "Échec de la création de la commande.");

    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(
      data.items.map((it) => ({
        order_id: order.id,
        product_id: null,
        product_name: it.name,
        unit_price: it.unitPrice,
        quantity: it.quantity,
        line_total: it.unitPrice * it.quantity,
      })) as never,
    );
    if (itemsErr) throw new Error(itemsErr.message);

    const appUrl = process.env.APP_URL?.replace(/\/$/, "") ?? "";
    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentLink: `${appUrl}/pay/${order.id}?token=${token}`,
    };
  });

const publicOrderInputSchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(10),
});

// Lecture publique (pas de middleware d'auth) — protégée uniquement par la
// correspondance exacte du jeton.
export const getPublicQuoteOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => publicOrderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, country_code, currency_code, subtotal, shipping_fee, total, shipping_full_name, order_items(product_name, quantity, line_total)",
      )
      .eq("id", data.orderId)
      .eq("payment_link_token", data.token)
      .maybeSingle();
    if (error || !order) throw new Error("Lien de paiement invalide ou expiré.");

    const { data: country } = await supabaseAdmin
      .from("countries")
      .select("name, currency_symbol")
      .eq("code", order.country_code)
      .maybeSingle();

    return {
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      currencyCode: order.currency_code,
      currencySymbol: country?.currency_symbol ?? order.currency_code,
      countryName: country?.name ?? order.country_code,
      countryCode: order.country_code,
      customerName: order.shipping_full_name,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shipping_fee),
      total: Number(order.total),
      items: (order.order_items ?? []).map((it) => ({
        name: it.product_name,
        quantity: it.quantity,
        lineTotal: Number(it.line_total),
      })),
      canPayOnline: isCinetPayCountryReady(order.country_code),
    };
  });

const guestPaymentInputSchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(10),
  paymentMethod: z.string(),
  phoneNumber: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional(),
});

// Paiement invité — même autorisation par jeton, réutilise le cœur CinetPay
// partagé avec le flux authentifié (cinetpay-core.server.ts).
export const initiateGuestQuotePaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => guestPaymentInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, country_code, payment_status, payment_method, shipping_full_name, shipping_phone, total, guest_email",
      )
      .eq("id", data.orderId)
      .eq("payment_link_token", data.token)
      .maybeSingle();
    if (error || !order) throw new Error("Lien de paiement invalide ou expiré.");

    const email = data.email ?? order.guest_email ?? undefined;
    if (!email) {
      throw new Error("Un email est nécessaire pour recevoir la confirmation de paiement.");
    }

    return initiateCinetPayForOrder({
      order,
      email,
      phoneNumberOverride: data.phoneNumber,
      paymentMethodOverride: data.paymentMethod,
    });
  });
