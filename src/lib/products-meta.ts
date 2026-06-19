import riz from "@/assets/product-riz.jpg";
import mil from "@/assets/product-mil.jpg";
import mais from "@/assets/product-mais.jpg";
import fonio from "@/assets/product-fonio.jpg";
import sorgho from "@/assets/product-sorgho.jpg";
import ble from "@/assets/product-ble.jpg";
import arachide from "@/assets/product-arachide.jpg";
import niebe from "@/assets/product-niebe.jpg";

export const productImages: Record<string, string> = {
  "riz-parfume": riz,
  "mil-petit": mil,
  "mais-jaune": mais,
  "fonio-precieux": fonio,
  "sorgho-rouge": sorgho,
  "ble-tendre": ble,
  "arachide-decortiquee": arachide,
  "niebe": niebe,
};

export function imageFor(slug: string) {
  return productImages[slug] ?? riz;
}
