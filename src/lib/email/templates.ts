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