import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query, queryOne } from "@/integrations/neon/db.server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { sendEmail } from "@/lib/email/resend.server";
import { buildQuoteRequestAdminEmail } from "@/lib/email/templates";
import { getPublicAppUrl } from "@/lib/app-url.server";
import { initializeGeniusPayTransaction } from "@/lib/payments/geniuspay.server";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";

const submitQuoteSchema = z.object({
  type: z.string(),
  name: z.string().min(2),
  company: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().min(2),
  quantity: z.string().optional(),
  products: z.string().optional(),
  message: z.string().optional(),
});

export const submitQuoteRequestFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => submitQuoteSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Insérer la demande dans la DB
    const quote = await queryOne<any>(
      `INSERT INTO quote_requests (
        type, contact_name, company_name, phone, email, location, volume_estimated, products_requested, message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        data.type,
        data.name,
        data.company || null,
        data.phone,
        data.email || null,
        data.location,
        data.quantity || null,
        data.products || null,
        data.message || null,
      ]
    );

    if (!quote) throw new Error("Erreur lors de l'enregistrement de la demande.");

    // 2. Créer une notification interne
    const title = `Nouveau devis B2B : ${data.name}`;
    const notificationMessage = `Demande de type ${data.type} pour la ville de ${data.location}.`;
    await query(
      `INSERT INTO admin_notifications (type, reference_id, title, message) VALUES ($1, $2, $3, $4)`,
      ['quote_request', quote.id, title, notificationMessage]
    );

    // 3. Envoyer un email à l'admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SHOP_OWNER_EMAIL || "sammuel.kouassi2026@gmail.com";
    
    // On extrait juste l'adresse email si elle est formatée comme "Nom <email>"
    const toAddress = adminEmail.includes("<") ? adminEmail.match(/<([^>]+)>/)?.[1] || adminEmail : adminEmail;

    const baseAppUrl = getPublicAppUrl();
    const adminUrl = `${baseAppUrl}/admin/quotes/${quote.id}`;

    const { subject, html } = buildQuoteRequestAdminEmail({
      contactName: data.name,
      companyName: data.company,
      phone: data.phone,
      email: data.email,
      location: data.location,
      type: data.type,
      volumeEstimated: data.quantity,
      productsRequested: data.products,
      message: data.message,
      adminUrl,
    });

    await sendEmail({
      to: toAddress,
      subject,
      html,
    });

    // 4. Envoyer un accusé de réception automatique au client s'il a renseigné un email
    if (data.email) {
      try {
        await sendEmail({
          to: data.email,
          subject: "Demande de devis bien reçue — Cereals House",
          html: `
            <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; padding: 28px; background: #FDF6EC; border-radius: 16px; border: 1px solid #EEE;">
              <div style="background: #3D2817; padding: 20px 24px; text-align: center; border-radius: 12px; margin-bottom: 20px;">
                <span style="color: #D4AF37; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">Cereals House B2B</span>
              </div>
              <div style="background: #FFF; padding: 24px; border-radius: 12px; border: 1px solid #EEE;">
                <h2 style="color: #3D2817; margin-top: 0; font-size: 20px;">Demande de devis bien reçue ✓</h2>
                <p style="color: #333; font-size: 14px; line-height: 1.6;">
                  Bonjour <strong>${data.name}</strong>,<br/><br/>
                  Nous avons bien reçu votre demande de devis pour <strong>${data.location}</strong>.
                  Notre équipe commerciale étudie vos besoins avec attention et vous recontactera sous 24h avec une proposition tarifaire sur mesure.
                </p>
                <div style="margin: 16px 0; padding: 12px; background: #FDF6EC; border-radius: 8px; font-size: 13px; color: #555;">
                  <strong>Récapitulatif de votre demande :</strong><br/>
                  • Type : ${data.type === "wholesale" ? "Commande en gros" : data.type === "distributor" ? "Distribution" : "Projet spécifique"}<br/>
                  • Téléphone : ${data.phone}<br/>
                  ${data.quantity ? `• Volume estimé : ${data.quantity}<br/>` : ""}
                  ${data.products ? `• Produits : ${data.products}<br/>` : ""}
                </div>
                <p style="color: #666; font-size: 13px; line-height: 1.5;">
                  Pour toute urgence ou question complémentaire, vous pouvez nous joindre directement par téléphone au +225 05 84 63 72 19 ou en écrivant à <a href="mailto:contact@cereals-house.com" style="color: #3D2817; font-weight: bold;">contact@cereals-house.com</a>.
                </p>
              </div>
              <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #999;">
                Cereals House • Meunerie & Terroirs d'Afrique • contact@cereals-house.com
              </div>
            </div>
          `,
        });
      } catch (clientMailErr) {
        console.warn("[quotes] échec de l'email accusé de réception client", clientMailErr);
      }
    }

    return { success: true, quoteId: quote.id };
  });

export const getAdminNotificationsFn = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return query(`SELECT * FROM admin_notifications WHERE is_read = false ORDER BY created_at DESC`);
  });

export const getQuoteRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    return query(`SELECT * FROM quote_requests ORDER BY created_at DESC`);
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await query(`UPDATE admin_notifications SET is_read = true WHERE id = $1`, [data.id]);
    return { success: true };
  });

// Endpoint pour l'administrateur afin de créer la commande depuis la demande
const createInvoiceSchema = z.object({
  quoteId: z.string(),
  subtotal: z.number(),
  shippingFee: z.number(),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    unitPrice: z.number(),
    quantity: z.number()
  }))
});

export const createInvoiceFromQuoteFn = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((data: unknown) => createInvoiceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const admin = context.user;

    const quote = await queryOne<any>(`SELECT * FROM quote_requests WHERE id = $1 LIMIT 1`, [data.quoteId]);
    if (!quote) throw new Error("Devis introuvable.");

    const total = data.subtotal + data.shippingFee;
    
    // Pour une facture pro, la country_code par défaut dépendra de l'adresse, on peut mettre CI pour CinetPay
    const countryCode = "CI"; 
    const currencyCode = "XOF";

    // 1. Créer la commande
    const order = await queryOne<any>(
      `INSERT INTO orders (
        user_id, country_code, currency_code, subtotal, shipping_fee, total,
        status, payment_status,
        shipping_full_name, shipping_phone, shipping_address, shipping_city, shipping_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        admin.id, // On assigne la commande à l'admin créateur
        countryCode,
        currencyCode,
        data.subtotal,
        data.shippingFee,
        total,
        'pending_payment',
        'pending',
        quote.contact_name,
        quote.phone,
        quote.location, // Par défaut la ville du devis
        quote.location, // Par défaut
        `Facture générée suite au devis B2B. Entreprise: ${quote.company_name || 'N/A'}`
      ]
    );

    if (!order) throw new Error("Impossible de créer la commande");

    // 2. Créer les articles
    for (const item of data.items) {
      const lineTotal = item.unitPrice * item.quantity;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId || "");
      const validProductId = isUuid ? item.productId : null;
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, validProductId, item.productName, item.unitPrice, item.quantity, lineTotal]
      );
    }

    // 3. Lier la facture au devis et marquer le devis comme processed
    await query(`UPDATE quote_requests SET status = 'processed', order_id = $1, updated_at = now() WHERE id = $2`, [order.id, quote.id]);

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

    const baseAppUrl = getPublicAppUrl();
    const internalPayUrl = `${baseAppUrl}/pay/${order.id}?token=${token}`;
    const pdfUrl = `${baseAppUrl}/api/invoices/${order.id}.pdf`;

    // 4. Générer la facture au format PDF
    let pdfBytes: Uint8Array | null = null;
    try {
      pdfBytes = await generateReceiptPdf({
        title: "Facture Commerciale Proforma",
        orderNumber: order.order_number,
        createdAt: order.created_at || new Date().toISOString(),
        customerName: quote.contact_name || "Client",
        shippingAddress: quote.location || "Abidjan",
        shippingCity: quote.location || "Abidjan",
        countryName: "Côte d'Ivoire",
        currencySymbol: "FCFA",
        items: data.items.map((it) => ({
          name: it.productName,
          quantity: it.quantity,
          lineTotal: it.unitPrice * it.quantity,
        })),
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        total,
        paymentMethodLabel: "Paiement en ligne GeniusPay (Mobile Money / Carte)",
      });
    } catch (pdfErr) {
      console.error("[quotes] Erreur génération PDF facture:", pdfErr);
    }

    // 5. Initialiser directement la session GeniusPay pour obtenir le lien direct
    let directGeniusPayUrl = "";
    try {
      const clientEmail = (quote.email && quote.email.includes("@")) ? quote.email.trim() : "client@cerealshouse.com";
      const geniusRes = await initializeGeniusPayTransaction({
        order: {
          id: order.id,
          order_number: order.order_number,
          country_code: countryCode,
          currency_code: currencyCode,
          total,
          shipping_full_name: quote.contact_name,
          shipping_phone: quote.phone,
        },
        email: clientEmail,
      });
      directGeniusPayUrl = geniusRes.checkoutUrl;
    } catch (geniusErr) {
      console.error("[quotes] Erreur initialisation GeniusPay direct:", geniusErr);
    }

    // Le lien de paiement prioritaire est l'URL GeniusPay directe
    const paymentUrl = directGeniusPayUrl || internalPayUrl;

    // 6. Envoi automatique de l'email avec la facture PDF en pièce jointe
    let emailSent = false;
    if (quote.email && quote.email.includes("@")) {
      try {
        const formattedTotal = new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "XOF",
          maximumFractionDigits: 0,
        }).format(total);

        const attachments = pdfBytes
          ? [
              {
                filename: `facture-${order.order_number}.pdf`,
                content: Buffer.from(pdfBytes).toString("base64"),
              },
            ]
          : [];

        await sendEmail({
          to: quote.email.trim(),
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
                  Bonjour <strong>${quote.contact_name}</strong>,
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #5C4533; margin: 0 0 20px;">
                  Suite à votre demande, votre facture commerciale proforma <strong>${order.order_number}</strong> d'un montant de <strong>${formattedTotal}</strong> a été établie.
                </p>

                <div style="background: #F8F3EA; border-radius: 12px; padding: 18px; margin-bottom: 24px; border: 1px solid #EADDC8;">
                  <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; color: #7A624E;">Numéro de facture :</td>
                      <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2C1810;">${order.order_number}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #7A624E;">Montant total :</td>
                      <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #BF9024; font-size: 15px;">${formattedTotal}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #7A624E;">Mode de règlement :</td>
                      <td style="padding: 6px 0; text-align: right; color: #2C1810;">Mobile Money & Carte (Paystack)</td>
                    </tr>
                  </table>
                </div>

                <!-- Bouton de règlement direct Paystack -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentUrl}" style="background: #BF9024; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(191,144,36,0.3);">
                    💳 Procéder au paiement sécurisé sur Paystack
                  </a>
                </div>

                <div style="text-align: center; margin-top: 12px;">
                  <a href="${pdfUrl}" style="color: #7A624E; font-size: 12px; text-decoration: underline;">
                    📄 Télécharger la facture en version PDF
                  </a>
                </div>

                <p style="font-size: 12px; color: #8C7355; margin-top: 24px; line-height: 1.5; text-align: center;">
                  <em>Votre facture est également jointe à ce courriel au format PDF.</em><br/>
                  Une question ou une modification ? Répondez directement à cet email ou contactez-nous par WhatsApp au +225 05 84 63 72 19.
                </p>
              </div>

              <div style="border-top: 1px solid #EFE4D2; padding-top: 16px; text-align: center; font-size: 11px; color: #A89682;">
                Cereals House • Abidjan, Côte d'Ivoire • contact@cereals-house.com
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (clientMailErr) {
        console.warn("[quotes] Échec de l'envoi de l'email facture au client:", clientMailErr);
      }
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      paymentUrl,
      directGeniusPayUrl,
      directPaystackUrl: directGeniusPayUrl,
      pdfUrl,
      token,
      emailSent,
    };
  });
