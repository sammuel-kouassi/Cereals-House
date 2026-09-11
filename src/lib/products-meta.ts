import riz from "@/assets/product-riz.jpg";
import mil from "@/assets/product-mil.jpg";
import mais from "@/assets/product-mais.jpg";
import fonio from "@/assets/product-fonio.jpg";
import sorgho from "@/assets/product-sorgho.jpg";
import ble from "@/assets/product-ble.jpg";
import arachide from "@/assets/product-arachide.jpg";
import niebe from "@/assets/product-niebe.jpg";
import bouillie from "@/assets/product-bouillie-maman-bebe.jpg";

export const productImages: Record<string, string> = {
  "riz-parfume": riz,
  "mil-petit": mil,
  "mais-jaune": mais,
  "fonio-precieux": fonio,
  "sorgho-rouge": sorgho,
  "ble-tendre": ble,
  "arachide-decortiquee": arachide,
  "niebe": niebe,
  "bouillie-maman-bebe": bouillie,
  "delice-maman-bebe": bouillie,
  "farine-infantile-enrichie": bouillie,
};

export function imageFor(slug: string, currentImageUrl?: string | null) {
  // Remplacer l'ancienne photo de livres par la bouillie gastronomique
  if (currentImageUrl?.includes("1517673132405") || slug.includes("maman") || slug.includes("bouillie")) {
    return bouillie;
  }
  return currentImageUrl || productImages[slug] || riz;
}
