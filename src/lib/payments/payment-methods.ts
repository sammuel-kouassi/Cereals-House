import { isOnlinePaymentSupported } from "@/lib/payments/supported-countries";
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
  | "cash_on_delivery"
  | "paystack"
  | "geniuspay";

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

// Méthodes de paiement disponibles via GeniusPay selon le pays :
// - CI : Wave, Orange Money, MTN MoMo, Moov Money, Carte bancaire
// - SN : Wave, Orange Money, Free Money, Carte bancaire
// - BJ : MTN Mobile Money, Moov Money, Carte bancaire
// - BF : Orange Money, Moov Money, Carte bancaire
// - ML : Orange Money, Moov Money, Carte bancaire
// - TG : Moov Money, T-Money, Carte bancaire
// - GH : MTN Mobile Money, Vodafone Cash, Carte bancaire
export const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    tagline: "Paiement sécurisé via Orange Money",
    countries: ["CI", "SN", "BF", "ML"],
    bg: "bg-[#FF7900]",
    fg: "text-white",
    ring: "ring-[#FF7900]",
    badge: "Orange Money",
    logo: orangeLogo,
  },
  {
    id: "wave",
    name: "Wave",
    tagline: "Paiement instantané sans frais via Wave",
    countries: ["CI", "SN"],
    bg: "bg-[#1DC8F2]",
    fg: "text-white",
    ring: "ring-[#1DC8F2]",
    badge: "Wave",
    logo: waveLogo,
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    tagline: "Paiement rapide via MTN MoMo",
    countries: ["CI", "BJ", "GH"],
    bg: "bg-[#FFCC00]",
    fg: "text-black",
    ring: "ring-[#FFCC00]",
    badge: "MTN MoMo",
    logo: mtnLogo,
  },
  {
    id: "moov_money",
    name: "Moov Money",
    tagline: "Réglez directement avec Moov Money",
    countries: ["CI", "BJ", "BF", "ML", "TG"],
    bg: "bg-[#005BAA]",
    fg: "text-white",
    ring: "ring-[#005BAA]",
    badge: "Moov Money",
    logo: moovLogo,
  },
  {
    id: "visa",
    name: "Carte bancaire (Visa, Mastercard)",
    tagline: "Paiement sécurisé international par carte bancaire",
    countries: ["CI", "SN", "BJ", "BF", "ML", "TG", "GH"],
    bg: "bg-gradient-to-br from-slate-800 to-slate-900",
    fg: "text-white",
    ring: "ring-slate-800",
    badge: "Carte Bancaire",
    logo: visaLogo,
  },
];

export function methodAvailableIn(m: PaymentMethodDef, countryCode: string): boolean {
  return (
    (m.countries as readonly string[]).includes(countryCode) &&
    isOnlinePaymentSupported(countryCode)
  );
}
