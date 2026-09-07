export function formatPrice(amount: number | string, currencyOrSymbol?: string, symbol?: string): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount)) || 0;
  
  // Si 3 arguments passés : formatPrice(amount, currencyCode, currencySymbol)
  // Si 2 arguments passés : formatPrice(amount, currencySymbol)
  let effectiveSymbol = symbol || currencyOrSymbol || "FCFA";
  let currencyCode = symbol ? currencyOrSymbol : "";

  if (!currencyCode) {
    if (effectiveSymbol === "FCFA" || effectiveSymbol === "XOF" || effectiveSymbol.includes("CFA")) {
      currencyCode = "XOF";
      effectiveSymbol = "FCFA";
    } else if (effectiveSymbol === "€" || effectiveSymbol === "EUR") {
      currencyCode = "EUR";
      effectiveSymbol = "€";
    } else if (effectiveSymbol === "$" || effectiveSymbol === "USD") {
      currencyCode = "USD";
      effectiveSymbol = "$";
    } else {
      currencyCode = "XOF";
    }
  }

  const isWhole = currencyCode === "XOF" || currencyCode === "FCFA" || currencyCode === "GHS";
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(num);

  return `${formatted} ${effectiveSymbol}`;
}
