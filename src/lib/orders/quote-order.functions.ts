import { getPublicAppUrl } from "@/lib/app-url.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { initializePaystackTransaction } from "@/lib/payments/paystack.server";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";
import { sendEmail } from "@/lib/email/resend.server";
import { query, queryOne } from "@/integrations/neon/db.server";

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
    const country = await queryOne<any>(
      `SELECT code, currency_code FROM countries WHERE code = $1 LIMIT 1`,
      [data.countryCode.toUpperCase()]
    );
    if (!country) throw new Error("Pays introuvable.");

    const subtotal = data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const total = subtotal + data.shippingFee;
    const token = generateToken();

    const order = await queryOne<any>(
      `INSERT INTO orders (
        user_id, country_code, currency_code, subtotal, shipping_fee, total,
        shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_notes
      )
      VALUES (null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, order_number`,
      [
        country.code,
        country.currency_code,
        subtotal,
        data.shippingFee,
        total,
        data.customerName,
        data.phone,
        data.address,
        data.city,
        data.notes || null,
      ]
    );
    if (!order) throw new Error("Échec de la création du devis.");

    for (const it of data.items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, null, $2, $3, $4, $5)`,
        [order.id, it.name, it.unitPrice, it.quantity, it.unitPrice * it.quantity]
      );
    }

    const appUrl = getPublicAppUrl();
    const internalPayUrl = `${appUrl}/pay/${order.id}?token=${token}`;
    const pdfUrl = `${appUrl}/api/invoices/${order.id}.pdf`;

    // Générer la facture PDF
    let pdfBytes: Uint8Array | null = null;
    try {
      pdfBytes = await generateReceiptPdf({
        title: "Facture Commerciale & Devis",
        orderNumber: order.order_number,
        createdAt: new Date().toISOString(),
        customerName: data.customerName,
        shippingAddress: data.address,
        shippingCity: data.city,
        countryName: country.name || data.countryCode,
        currencySymbol: country.currency_code === "XOF" ? "FCFA" : country.currency_code,
        items: data.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          lineTotal: it.unitPrice * it.quantity,
        })),
        subtotal,
        shippingFee: data.shippingFee,
        total,
        paymentMethodLabel: "Paiement en ligne Paystack (Mobile Money / Carte)",
      });
    } catch (pdfErr) {
      console.error("[quote-order] Erreur génération PDF:", pdfErr);
    }

    // Initialiser la transaction Paystack directe
    let directPaystackUrl = "";
    try {
      const clientEmail = (data.email && data.email.includes("@")) ? data.email.trim() : "client@cerealshouse.com";
      const paystackRes = await initializePaystackTransaction({
        order: {
          id: order.id,
          order_number: order.order_number,
          country_code: country.code,
          currency_code: country.currency_code,
          total,
          shipping_full_name: data.customerName,
          shipping_phone: data.phone,
        },
        email: clientEmail,
      });
      directPaystackUrl = paystackRes.authorizationUrl;
    } catch (paystackErr) {
      console.error("[quote-order] Erreur initialisation Paystack direct:", paystackErr);
    }

    const paymentLink = directPaystackUrl || internalPayUrl;

    // Envoi automatique par email si email renseigné
    let emailSent = false;
    if (data.email && data.email.includes("@")) {
      try {
        const formattedTotal = `${total.toLocaleString("fr-FR")} ${country.currency_code === "XOF" ? "FCFA" : country.currency_code}`;
        const attachments = pdfBytes
          ? [
              {
                filename: `facture-${order.order_number}.pdf`,
                content: Buffer.from(pdfBytes).toString("base64"),
              },
            ]
          : [];

        await sendEmail({
          to: data.email.trim(),
          subject: `Votre Facture Cereals House — ${order.order_number}`,
          attachments,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FFFDF9; border-radius: 16px; border: 1px solid #EFE4D2; color: #2C1810;">
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #EFE4D2;">
                <h1 style="color: #BF9024; margin: 0; font-size: 24px; letter-spacing: 1px;">CEREALS HOUSE</h1>
                <p style="margin: 4px 0 0; font-size: 12px; color: #8C7355; text-transform: uppercase; letter-spacing: 2px;">Terroirs & Céréales d'Afrique</p>
              </div>

              <div style="padding: 24px 0;">
                <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                  Bonjour <strong>${data.customerName}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #5C4533; margin: 0 0 20px;">
                  Votre facture officielle <strong>${order.order_number}</strong> d'un montant de <strong>${formattedTotal}</strong> est disponible.
                </p>

                <!-- Bouton de règlement direct Paystack -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentLink}" style="background: #BF9024; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(191,144,36,0.3);">
                    💳 Régler directement sur Paystack
                  </a>
                </div>

                <div style="text-align: center; margin-top: 12px;">
                  <a href="${pdfUrl}" style="color: #7A624E; font-size: 12px; text-decoration: underline;">
                    📄 Télécharger la facture en PDF
                  </a>
                </div>

                <p style="font-size: 12px; color: #8C7355; margin-top: 24px; line-height: 1.5; text-align: center;">
                  <em>Votre facture est également jointe à ce courriel au format PDF.</em><br/>
                  Une question ? Répondez directement à cet email ou contactez notre équipe sur WhatsApp au +225 05 84 63 72 19.
                </p>
              </div>

              <div style="border-top: 1px solid #EFE4D2; padding-top: 16px; text-align: center; font-size: 11px; color: #A89682;">
                Cereals House • Abidjan, Côte d'Ivoire • contact@cereals-house.com
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (mailErr) {
        console.warn("[quote-order] Erreur envoi email client:", mailErr);
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentLink,
      directPaystackUrl,
      pdfUrl,
      emailSent,
    };
  });

const getQuoteInputSchema = z.object({
  orderId: z.string(),
  token: z.string().optional().or(z.literal("")),
});

export const getPublicQuoteOrderFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => getQuoteInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT id, order_number, status, payment_status, country_code, currency_code,
              subtotal, shipping_fee, total, shipping_full_name, shipping_phone,
              shipping_address, shipping_city, shipping_notes, created_at
       FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Lien de paiement invalide ou expiré.");

    const country = await queryOne<any>(
      `SELECT name, currency_symbol FROM countries WHERE code = $1 LIMIT 1`,
      [order.country_code]
    );

    const items = await query<any>(
      `SELECT product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    const canPayOnline = true;

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      customerName: order.shipping_full_name || "Client",
      countryCode: order.country_code,
      countryName: country?.name ?? order.country_code,
      currencyCode: order.currency_code,
      currencySymbol: country?.currency_symbol ?? order.currency_code,
      subtotal: Number(order.subtotal || 0),
      shippingFee: Number(order.shipping_fee || 0),
      total: Number(order.total || 0),
      canPayOnline,
      items: (items ?? []).map((it: any) => ({
        name: it.product_name,
        quantity: it.quantity,
        unitPrice: Number(it.unit_price || 0),
        lineTotal: Number(it.line_total || 0),
      })),
    };
  });

const initiateGuestInputSchema = z.object({
  orderId: z.string(),
  token: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  paymentMethod: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const initiateGuestQuotePaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => initiateGuestInputSchema.parse(data))
  .handler(async ({ data }) => {
    const order = await queryOne<any>(
      `SELECT * FROM orders WHERE id = $1 LIMIT 1`,
      [data.orderId]
    );
    if (!order) throw new Error("Commande introuvable.");

    const clientEmail = (data.email && data.email.includes("@"))
      ? data.email.trim()
      : (order.shipping_email || "client@cerealshouse.com");

    const result = await initializePaystackTransaction({
      order,
      email: clientEmail,
    });

    return { paymentUrl: result.authorizationUrl };
  });
