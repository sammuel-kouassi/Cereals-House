// Bon de préparation imprimable — document interne à glisser dans le colis
// ou à garder en entrepôt pendant la préparation. Différent du reçu client
// (generate-receipt.server.ts) : pas de logo ni de ton commercial, axé sur
// ce qu'il faut préparer et où l'envoyer.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const BROWN = rgb(0.239, 0.157, 0.09);
const GOLD = rgb(0.831, 0.686, 0.216);

type SlipItem = { name: string; quantity: number; unit: string };

export async function generatePackingSlipPdf(params: {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  countryName: string;
  notes?: string | null;
  paymentMethodLabel: string;
  paymentStatus: string;
  items: SlipItem[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  page.drawText("BON DE PRÉPARATION", { x: 48, y, size: 20, font: fontBold, color: BROWN });
  y -= 10;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 2, color: GOLD });
  y -= 30;

  page.drawText(`Commande ${params.orderNumber}`, {
    x: 48,
    y,
    size: 14,
    font: fontBold,
    color: BROWN,
  });
  y -= 18;
  page.drawText(`Passée le ${new Date(params.createdAt).toLocaleString("fr-FR")}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 30;

  // Bloc destinataire, encadré pour bien ressortir sur le colis
  page.drawRectangle({
    x: 48,
    y: y - 90,
    width: 499,
    height: 90,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });
  let iy = y - 18;
  page.drawText("LIVRER À", { x: 60, y: iy, size: 9, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
  iy -= 18;
  page.drawText(params.customerName, { x: 60, y: iy, size: 13, font: fontBold, color: BROWN });
  iy -= 16;
  page.drawText(params.customerPhone, { x: 60, y: iy, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
  iy -= 16;
  page.drawText(`${params.shippingAddress}, ${params.shippingCity}`, {
    x: 60,
    y: iy,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  iy -= 14;
  page.drawText(params.countryName, { x: 60, y: iy, size: 11, font, color: rgb(0.2, 0.2, 0.2) });
  y -= 110;

  page.drawText(`Paiement : ${params.paymentMethodLabel} (${params.paymentStatus})`, {
    x: 48,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 30;

  page.drawText("Article", { x: 48, y, size: 10, font: fontBold, color: BROWN });
  page.drawText("Quantité", { x: 420, y, size: 10, font: fontBold, color: BROWN });
  page.drawText("Fait", { x: 512, y, size: 9, font: fontBold, color: BROWN });
  y -= 8;
  page.drawLine({
    start: { x: 48, y },
    end: { x: 547, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 22;

  for (const item of params.items) {
    page.drawText(item.name.slice(0, 50), {
      x: 48,
      y,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    page.drawText(`${item.quantity} ${item.unit}`, {
      x: 420,
      y,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    // Case à cocher manuelle pour la préparation physique.
    page.drawRectangle({
      x: 518,
      y: y - 3,
      width: 12,
      height: 12,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });
    y -= 26;
    if (y < 100) break;
  }

  if (params.notes) {
    y -= 10;
    page.drawText("Notes du client :", { x: 48, y, size: 10, font: fontBold, color: BROWN });
    y -= 16;
    page.drawText(params.notes.slice(0, 200), {
      x: 48,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return doc.save();
}
