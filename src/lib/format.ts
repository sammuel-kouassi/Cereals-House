export function formatPrice(amount: number, currency: string, symbol: string) {
  const isWhole = currency === "XOF" || currency === "GHS";
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}
