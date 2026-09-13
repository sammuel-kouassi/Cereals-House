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

// Méthodes de paiement disponibles via Paystack
// En Côte d'Ivoire (CI) : Mobile Money (Wave, Orange, MTN, Moov) + Carte bancaire
// Dans les autres pays (Sénégal, Mali, Burkina, France, etc.) : Carte bancaire internationale (Visa, Mastercard, Apple Pay)
export const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    tagline: "Paiement sécurisé via Orange Money Côte d'Ivoire",
    countries: ["CI"],
    bg: "bg-[#FF7900]",
    fg: "text-white",
    ring: "ring-[#FF7900]",
    badge: "Orange Money",
    logo: orangeLogo,
  },
  {
    id: "wave",
    name: "Wave",
    tagline: "Paiement instantané sans frais via Wave Côte d'Ivoire",
    countries: ["CI"],
    bg: "bg-[#1DC8F2]",
    fg: "text-white",
    ring: "ring-[#1DC8F2]",
    badge: "Wave",
    logo: waveLogo,
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    tagline: "Paiement rapide via MTN MoMo Côte d'Ivoire",
    countries: ["CI"],
    bg: "bg-[#FFCC00]",
    fg: "text-black",
    ring: "ring-[#FFCC00]",
    badge: "MTN MoMo",
    logo: mtnLogo,
  },
  {
    id: "moov_money",
    name: "Moov Money",
    tagline: "Réglez directement avec Moov Money Côte d'Ivoire",
    countries: ["CI"],
    bg: "bg-[#005BAA]",
    fg: "text-white",
    ring: "ring-[#005BAA]",
    badge: "Moov Money",
    logo: moovLogo,
  },
  {
    id: "visa",
    name: "Carte bancaire (Visa, Mastercard, Apple Pay)",
    tagline: "Paiement sécurisé international par carte bancaire",
    countries: ["CI"],
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
