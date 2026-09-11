// Génère le sujet + HTML des emails envoyés au client à chaque changement de
// statut de commande. Couleurs alignées sur la charte du site (brun/or).
// Pas d'image logo ici (nécessiterait une URL publique stable) — le logo
// n'apparaît que sur le reçu PDF final (voir generate-receipt.server.ts), où
// il est embarqué directement depuis le fichier, sans dépendre d'une URL.

const GOLD = "#D4AF37";
const BROWN = "#3D2817";
const CREAM = "#FDF6EC";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded";

const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; title: string; body: string }>> =
  {
    paid: {
      subject: "Paiement confirmé — commande {orderNumber}",
      title: "Paiement confirmé ✓",
      body: "Nous avons bien reçu votre paiement. Votre commande passe en préparation.",
    },
    preparing: {
      subject: "Votre commande {orderNumber} est en préparation",
      title: "En préparation",
      body: "Votre commande est en cours de préparation dans nos entrepôts.",
    },
    shipped: {
      subject: "Votre commande {orderNumber} a été expédiée",
      title: "Commande expédiée",
      body: "Votre commande a quitté nos entrepôts et est en route.",
    },
    in_transit: {
      subject: "Votre commande {orderNumber} est en cours de livraison",
      title: "En cours de livraison",
      body: "Votre commande sera bientôt chez vous.",
    },
    delivered: {
      subject: "Votre commande {orderNumber} a été livrée",
      title: "Livrée ✓",
      body: "Votre commande a été livrée. Merci pour votre confiance ! Votre reçu est joint à cet email.",
    },
    cancelled: {
      subject: "Votre commande {orderNumber} a été annulée",
      title: "Commande annulée",
      body: "Votre commande a été annulée. Contactez-nous si vous avez des questions.",
    },
    refunded: {
      subject: "Votre commande {orderNumber} a été remboursée",
      title: "Commande remboursée",
      body: "Le remboursement de votre commande a été effectué.",
    },
  };

export function buildOrderStatusEmail(params: {
  orderNumber: string;
  status: string;
  trackingUrl: string;
}): { subject: string; html: string } | null {
  const copy = STATUS_COPY[params.status as OrderStatus];
  if (!copy) return null;

  const subject = copy.subject.replace("{orderNumber}", params.orderNumber);

  const html = `
  <div style="background:${CREAM};padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
      <div style="background:${BROWN};padding:24px 28px;">
        <span style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Cereals House</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;color:${BROWN};font-size:22px;">${copy.title}</h1>
        <p style="margin:0 0 8px;color:#555;font-size:13px;">Commande <strong>${params.orderNumber}</strong></p>
        <p style="margin:16px 0;color:#333;font-size:15px;line-height:1.6;">${copy.body}</p>
        <a href="${params.trackingUrl}" style="display:inline-block;margin-top:12px;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;font-size:14px;">
          Suivre ma commande
        </a>
      </div>
      <div style="padding:16px 28px;background:${CREAM};text-align:center;">
        <span style="font-size:11px;color:#999;">Cereals House — Céréales africaines premium</span>
      </div>
    </div>
  </div>`;

  return { subject, html };
}

export function buildPaymentReceivedAdminEmail(params: {
  orderNumber: string;
  amount: string;
  countryCode: string;
  paymentMethod: string;
  adminUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `💰 Paiement reçu — commande ${params.orderNumber}`,
    html: `
    <div style="font-family:Georgia,'Times New Roman',serif;padding:24px;background:${CREAM};">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #eee;">
        <h1 style="color:${BROWN};font-size:20px;margin:0 0 12px;">Nouveau paiement reçu</h1>
        <p style="color:#333;font-size:14px;line-height:1.7;">
          Commande <strong>${params.orderNumber}</strong><br/>
          Montant : <strong>${params.amount}</strong><br/>
          Pays : ${params.countryCode}<br/>
          Moyen de paiement : ${params.paymentMethod}
        </p>
        <a href="${params.adminUrl}" style="display:inline-block;margin-top:12px;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:999px;font-size:13px;">
          Voir la commande
        </a>
      </div>
    </div>`,
  };
}

// Alerte propriétaire quand un CLIENT annule une commande DÉJÀ PAYÉE.
// Rappel important : CinetPay n'a pas d'API de remboursement automatique —
// ce mail signale juste qu'un remboursement manuel est à traiter côté
// CinetPay, puis à confirmer en marquant la commande "remboursée" dans
// /admin/orders (ce qui déclenchera l'email de confirmation au client).
export function buildOrderCancelledAdminEmail(params: {
  orderNumber: string;
  amount: string;
  countryCode: string;
  reason?: string;
  adminUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `⚠️ Commande annulée par le client — remboursement à traiter (${params.orderNumber})`,
    html: `
    <div style="font-family:Georgia,'Times New Roman',serif;padding:24px;background:${CREAM};">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #eee;">
        <h1 style="color:${BROWN};font-size:20px;margin:0 0 12px;">Commande annulée — remboursement à traiter</h1>
        <p style="color:#333;font-size:14px;line-height:1.7;">
          Le client a annulé une commande <strong>déjà payée en ligne</strong>.<br/><br/>
          Commande <strong>${params.orderNumber}</strong><br/>
          Montant à rembourser : <strong>${params.amount}</strong><br/>
          Pays : ${params.countryCode}
          ${params.reason ? `<br/>Motif indiqué : ${params.reason}` : ""}
        </p>
        <p style="color:#555;font-size:13px;line-height:1.6;background:${CREAM};padding:12px;border-radius:8px;">
          CinetPay ne rembourse pas automatiquement : traite la demande de reversement depuis ton dashboard CinetPay, puis marque cette commande "Remboursée" dans l'admin une fois fait.
        </p>
        <a href="${params.adminUrl}" style="display:inline-block;margin-top:8px;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:999px;font-size:13px;">
          Voir la commande
        </a>
      </div>
    </div>`,
  };
}

// Alerte stock bas — envoyée après une commande si un ou plusieurs produits
// passent sous le seuil. Un seul email récapitulatif même si plusieurs
// produits sont concernés par la même commande.
export function buildLowStockAdminEmail(params: {
  products: { name: string; stock: number }[];
  adminUrl: string;
}): { subject: string; html: string } {
  const rows = params.products
    .map(
      (p) =>
        `<li style="margin-bottom:4px;">${p.name} — <strong>${p.stock} kg restants</strong></li>`,
    )
    .join("");

  return {
    subject: `📉 Stock bas — ${params.products.length} produit(s) à réapprovisionner`,
    html: `
    <div style="font-family:Georgia,'Times New Roman',serif;padding:24px;background:${CREAM};">
      <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #eee;">
        <h1 style="color:${BROWN};font-size:20px;margin:0 0 12px;">Stock bas détecté</h1>
        <p style="color:#333;font-size:14px;line-height:1.6;">Ces produits ont besoin d'être réapprovisionnés :</p>
        <ul style="color:#333;font-size:14px;padding-left:20px;">${rows}</ul>
        <a href="${params.adminUrl}" style="display:inline-block;margin-top:12px;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:999px;font-size:13px;">
          Gérer les produits
        </a>
      </div>
    </div>`,
  };
}

// Relance panier abandonné — envoyée quelques heures après la dernière
// modification du panier si aucune commande n'a suivi.
export function buildAbandonedCartEmail(params: {
  items: { name: string; quantity: number }[];
  cartUrl: string;
}): { subject: string; html: string } {
  const rows = params.items
    .map((it) => `<li style="margin-bottom:4px;">${it.name} × ${it.quantity}</li>`)
    .join("");

  return {
    subject: "Vous avez oublié quelque chose dans votre panier 🌾",
    html: `
    <div style="background:${CREAM};padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
        <div style="background:${BROWN};padding:24px 28px;">
          <span style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Cereals House</span>
        </div>
        <div style="padding:28px;">
          <h1 style="margin:0 0 12px;color:${BROWN};font-size:22px;">Votre panier vous attend</h1>
          <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.6;">
            Vous avez laissé ces articles dans votre panier :
          </p>
          <ul style="color:#333;font-size:14px;padding-left:20px;">${rows}</ul>
          <a href="${params.cartUrl}" style="display:inline-block;margin-top:16px;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;font-size:14px;">
            Reprendre ma commande
          </a>
        </div>
      </div>
    </div>`,
  };
}

// Alerte administrateur pour une nouvelle demande de devis B2B
export function buildQuoteRequestAdminEmail(params: {
  contactName: string;
  companyName?: string;
  phone: string;
  email?: string;
  location: string;
  type: string;
  volumeEstimated?: string;
  productsRequested?: string;
  message?: string;
  adminUrl: string;
}): { subject: string; html: string } {
  const typeLabel =
    params.type === "wholesale"
      ? "Commande en gros"
      : params.type === "distributor"
        ? "Distribution"
        : "Autre projet";

  return {
    subject: `📋 Nouvelle demande de devis B2B — ${params.contactName}`,
    html: `
    <div style="font-family:Georgia,'Times New Roman',serif;padding:24px;background:${CREAM};">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;border:1px solid #eee;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="color:${GOLD};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Cereals House B2B</span>
        </div>
        <h1 style="color:${BROWN};font-size:20px;margin:0 0 16px;text-align:center;">Nouvelle Demande de Devis</h1>
        
        <table style="width:100%;color:#333;font-size:14px;line-height:1.6;border-collapse:collapse;">
          <tr><td style="padding:4px 0;width:40%;color:#777;">Type</td><td style="padding:4px 0;font-weight:bold;">${typeLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#777;">Contact</td><td style="padding:4px 0;font-weight:bold;">${params.contactName}</td></tr>
          ${params.companyName ? `<tr><td style="padding:4px 0;color:#777;">Entreprise</td><td style="padding:4px 0;font-weight:bold;">${params.companyName}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#777;">Téléphone</td><td style="padding:4px 0;font-weight:bold;">${params.phone}</td></tr>
          ${params.email ? `<tr><td style="padding:4px 0;color:#777;">Email</td><td style="padding:4px 0;font-weight:bold;">${params.email}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#777;">Localisation</td><td style="padding:4px 0;font-weight:bold;">${params.location}</td></tr>
          ${params.volumeEstimated ? `<tr><td style="padding:4px 0;color:#777;">Volume estimé</td><td style="padding:4px 0;font-weight:bold;">${params.volumeEstimated}</td></tr>` : ""}
          ${params.productsRequested ? `<tr><td style="padding:4px 0;color:#777;">Produits</td><td style="padding:4px 0;font-weight:bold;">${params.productsRequested}</td></tr>` : ""}
        </table>
        
        ${params.message ? `
        <div style="margin-top:16px;background:${CREAM};padding:12px;border-radius:8px;font-size:13px;color:#444;">
          <strong>Message :</strong><br/>
          ${params.message.replace(/\n/g, "<br/>")}
        </div>` : ""}

        <div style="text-align:center;margin-top:24px;">
          <a href="${params.adminUrl}" style="display:inline-block;background:${GOLD};color:${BROWN};text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px;font-size:14px;">
            Créer la facture personnalisée
          </a>
        </div>
      </div>
    </div>`,
  };
}

