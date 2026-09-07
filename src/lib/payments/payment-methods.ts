import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import orangeLogo from "@/assets/om.png";
import waveLogo from "@/assets/waveci.jpg";
import mtnLogo from "@/assets/mtn.jpg";
import moovLogo from "@/assets/moov.png";
import visaLogo from "@/assets/visa.png";

export type PaymentId =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "moov_money"
  | "tmoney"
  | "visa"
  | "cash_on_delivery";

export type PaymentMethodDef = {
  id: Exclude<PaymentId, "cash_on_delivery">;
  name: string;
  tagline?: string;
  countries: string[];
  bg: string;
  fg: string;
  ring: string;
  badge: string;
  logo?: string;
};

// Les pays disponibles par opérateur reflètent exactement ce que CinetPay
// prend en charge (PAYMENT_METHODS_BY_COUNTRY du SDK cinetpay-js) : chaque
// opérateur n'existe pas partout (ex : pas de Wave au Mali, pas d'Orange
// Money au Togo/Bénin). Le Ghana n'apparaît volontairement dans AUCUNE liste
// : CinetPay ne le prend en charge sur aucun opérateur pour l'instant.
export const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    tagline: "Paiement sécurisé via Orange Money",
    countries: ["CI", "BF", "ML"],
    bg: "bg-[#FF7900]",
    fg: "text-white",
    ring: "ring-[#FF7900]",
    badge: "orange",
    logo: orangeLogo,
  },
  {
    id: "wave",
    name: "Wave",
    tagline: "Paiement instantané sans frais",
    countries: ["CI", "BF"],
    bg: "bg-[#1DC8F2]",
    fg: "text-white",
    ring: "ring-[#1DC8F2]",
    badge: "wave~",
    logo: waveLogo,
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    tagline: "Paiement rapide via MoMo",
    countries: ["CI", "BJ"],
    bg: "bg-[#FFCC00]",
    fg: "text-black",
    ring: "ring-[#FFCC00]",
    badge: "MTN",
    logo: mtnLogo,
  },
  {
    id: "moov_money",
    name: "Moov Money",
    tagline: "Réglez directement avec Flooz / Moov",
    countries: ["CI", "BF", "ML", "TG", "BJ"],
    bg: "bg-[#005BAA]",
    fg: "text-white",
    ring: "ring-[#005BAA]",
    badge: "moov",
    logo: moovLogo,
  },
  {
    id: "tmoney",
    name: "TMoney",
    tagline: "Paiement via Togocom TMoney",
    countries: ["TG"],
    bg: "bg-[#F5A623]",
    fg: "text-white",
    ring: "ring-[#F5A623]",
    badge: "TMoney",
  },
  {
    id: "visa",
    name: "Carte bancaire (Visa / Mastercard)",
    tagline: "Paiement sécurisé par carte",
    countries: ["CI", "BF", "ML", "TG", "BJ"],
    bg: "bg-gradient-to-br from-slate-800 to-slate-900",
    fg: "text-white",
    ring: "ring-slate-800",
    badge: "VISA",
    logo: visaLogo,
  },
];

// Un opérateur n'est proposable que s'il existe dans le pays du client ET que
// l'intégration CinetPay est réellement active pour ce pays (voir
// CINETPAY_SUPPORTED_COUNTRIES).
export function methodAvailableIn(m: PaymentMethodDef, countryCode: string): boolean {
  return (
    (m.countries as readonly string[]).includes(countryCode) &&
    isCinetPaySupportedCountry(countryCode)
  );
}
