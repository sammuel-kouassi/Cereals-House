// Génère le reçu PDF final envoyé par email quand une commande passe au
// statut "delivered". Utilise pdf-lib (pur JS, aucune dépendance native) —
// compatible avec l'environnement Cloudflare Workers, contrairement à la
// plupart des générateurs PDF basés sur un navigateur headless.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { LOGO_JPEG_BASE64 } from "@/lib/receipt/logo-base64";

const GOLD = rgb(0.831, 0.686, 0.216); // #D4AF37
const BROWN = rgb(0.239, 0.157, 0.09); // #3D2817

// toLocaleString("fr-FR") insère une espace insécable fine (U+202F) comme
// séparateur de milliers, que la police standard WinAnsi de pdf-lib ne sait
// pas encoder (plantage garanti dès qu'un montant dépasse 999). On la
// remplace par une espace normale, seul caractère que la police accepte.
function formatAmount(n: number): string {
  return n.toLocaleString("fr-FR").replace(/\u202f/g, " ");
}

type ReceiptItem = { name: string; quantity: number; lineTotal: number };

export async function generateReceiptPdf(params: {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  countryName: string;
  currencySymbol: string;
  items: ReceiptItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethodLabel: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = Uint8Array.from(Buffer.from(LOGO_JPEG_BASE64, "base64"));
  const logoImage = await doc.embedJpg(logoBytes);
  const logoDims = logoImage.scale(48 / logoImage.width);

  let y = 792;
  page.drawImage(logoImage, {
    x: 48,
    y: y - logoDims.height,
    width: logoDims.width,
    height: logoDims.height,
  });
  page.drawText("Cereals House", {
    x: 48 + logoDims.width + 12,
    y: y - logoDims.height / 2 - 6,
    size: 16,
    font: fontBold,
    color: BROWN,
  });
  y -= logoDims.height + 24;

  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1.5, color: GOLD });
  y -= 28;

  page.drawText("Reçu de commande", { x: 48, y, size: 18, font: fontBold, color: BROWN });
  y -= 22;
  page.drawText(`Commande ${params.orderNumber}`, {
    x: 48,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 16;
  page.drawText(`Date : ${new Date(params.createdAt).toLocaleDateString("fr-FR")}`, {
    x: 48,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  page.drawText("Livré à", { x: 48, y, size: 10, font: fontBold, color: BROWN });
  y -= 14;
  page.drawText(params.customerName, { x: 48, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 14;
  page.drawText(`${params.shippingAddress}, ${params.shippingCity}`, {
    x: 48,
    y,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 14;
  page.drawText(params.countryName, { x: 48, y, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 30;

  // En-tête tableau des articles
  page.drawText("Article", { x: 48, y, size: 10, font: fontBold, color: BROWN });
  page.drawText("Qté", { x: 380, y, size: 10, font: fontBold, color: BROWN });
  page.drawText("Total", { x: 460, y, size: 10, font: fontBold, color: BROWN });
  y -= 8;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 547, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;

  for (const item of params.items) {
    page.drawText(item.name.slice(0, 45), { x: 48, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(String(item.quantity), { x: 380, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`${formatAmount(item.lineTotal)} ${params.currencySymbol}`, {
      x: 460,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;
    if (y < 120) break; // garde-fou simple contre un débordement de page
  }

  y -= 10;
  page.drawLine({
    start: { x: 300, y },
    end: { x: 547, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 18;

  const drawTotalLine = (label: string, value: string, bold = false) => {
    page.drawText(label, { x: 380, y, size: 10, font: bold ? fontBold : font, color: BROWN });
    page.drawText(value, { x: 460, y, size: 10, font: bold ? fontBold : font, color: BROWN });
    y -= 16;
  };
  drawTotalLine("Sous-total", `${formatAmount(params.subtotal)} ${params.currencySymbol}`);
  drawTotalLine("Livraison", `${formatAmount(params.shippingFee)} ${params.currencySymbol}`);
  drawTotalLine("Total", `${formatAmount(params.total)} ${params.currencySymbol}`, true);
  y -= 10;
  page.drawText(`Paiement : ${params.paymentMethodLabel}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText("Merci pour votre confiance — Cereals House", {
    x: 48,
    y: 60,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}