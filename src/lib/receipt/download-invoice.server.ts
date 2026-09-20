import { query, queryOne } from "@/integrations/neon/db.server";
import { generateReceiptPdf } from "@/lib/receipt/generate-receipt.server";

export async function handleInvoicePdfDownload(orderIdOrNumber: string): Promise<Response> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);

  const order = await queryOne<any>(
    isUuid
      ? `SELECT * FROM orders WHERE id = $1 LIMIT 1`
      : `SELECT * FROM orders WHERE order_number = $1 LIMIT 1`,
    [orderIdOrNumber]
  );

  if (!order) {
    return new Response("Facture introuvable", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const country = await queryOne<any>(
    `SELECT name, currency_symbol FROM countries WHERE code = $1 LIMIT 1`,
    [order.country_code]
  );

  const items = await query<any>(
    `SELECT product_name, quantity, unit_price, line_total FROM order_items WHERE order_id = $1`,
    [order.id]
  );

  const pdfBytes = await generateReceiptPdf({
    title: "Facture Commerciale & Reçu",
    orderNumber: order.order_number,
    createdAt: order.created_at || new Date().toISOString(),
    customerName: order.shipping_full_name || "Client",
    shippingAddress: order.shipping_address || "Abidjan",
    shippingCity: order.shipping_city || "Abidjan",
    countryName: country?.name ?? "Côte d'Ivoire",
    currencySymbol: country?.currency_symbol ?? "FCFA",
    items: (items || []).map((it) => ({
      name: it.product_name,
      quantity: Number(it.quantity),
      lineTotal: Number(it.line_total),
    })),
    subtotal: Number(order.subtotal || 0),
    shippingFee: Number(order.shipping_fee || 0),
    total: Number(order.total || 0),
    paymentMethodLabel:
      order.payment_method === "geniuspay"
        ? "Paiement en ligne GeniusPay"
        : order.payment_method || "Paiement sécurisé GeniusPay",
  });

  return new Response(pdfBytes as any, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="facture-${order.order_number}.pdf"`,
      "cache-control": "no-cache",
    },
  });
}
