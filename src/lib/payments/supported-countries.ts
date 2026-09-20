// Gestion des pays où le paiement en ligne direct GeniusPay est actif.
// GeniusPay / PawaPay supporte les pays africains suivants :
// - Côte d'Ivoire (CI, +225) : Wave, Orange Money, MTN MoMo, Moov Money, Carte bancaire
// - Sénégal (SN, +221) : Orange Money (ORANGE_SEN), Free Money (FREE_SEN), Wave, Carte bancaire
// - Bénin (BJ, +229) : MTN Mobile Money (MTN_MOMO_BEN), Moov Money (MOOV_BEN), Carte bancaire
// - Burkina Faso (BF, +226) : Orange Money, Moov Money, Carte bancaire
// - Mali (ML, +223) : Orange Money, Moov Money, Carte bancaire
// - Togo (TG, +228) : Moov Money, T-Money, Carte bancaire
// - Ghana (GH, +233) : MTN Mobile Money, Vodafone Cash, Carte bancaire

export const ONLINE_PAYMENT_SUPPORTED_COUNTRIES = [
  "CI",
  "SN",
  "BJ",
  "BF",
  "ML",
  "TG",
  "GH",
] as const;

export type OnlinePaymentSupportedCountry =
  (typeof ONLINE_PAYMENT_SUPPORTED_COUNTRIES)[number];

export function isOnlinePaymentSupported(
  code: string | undefined | null,
): boolean {
  if (!code) return false;
  const upper = code.toUpperCase().trim();
  return (ONLINE_PAYMENT_SUPPORTED_COUNTRIES as readonly string[]).includes(upper);
}

export type CountryPaymentOperator = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  mmoProvider?: string; // Code officiel GeniusPay / PawaPay (ex: ORANGE_SEN, FREE_SEN, MTN_MOMO_BEN...)
  paymentMethod?: string; // ex: pawapay, wave, orange_money
  color: string;
  badgeBg: string;
  badgeText: string;
  recommended?: boolean;
};

export type CountryPaymentChannels = {
  countryCode: string;
  countryName: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  dialCode: string;
  description: string;
  operators: CountryPaymentOperator[];
  badges: Array<{ label: string; bg: string; text: string }>;
};

export type CountryDialInfo = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
  example: string;
};

export const COUNTRY_DIAL_DATA: Record<string, CountryDialInfo> = {
  CI: {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    dialCode: "+225",
    placeholder: "07 00 00 00 00",
    example: "+225 07 12 34 56 78",
  },
  SN: {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    dialCode: "+221",
    placeholder: "77 000 00 00",
    example: "+221 77 123 45 67",
  },
  BJ: {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    dialCode: "+229",
    placeholder: "97 00 00 00",
    example: "+229 97 12 34 56",
  },
  BF: {
    code: "BF",
    name: "Burkina Faso",
    flag: "🇧🇫",
    dialCode: "+226",
    placeholder: "70 00 00 00",
    example: "+226 70 12 34 56",
  },
  ML: {
    code: "ML",
    name: "Mali",
    flag: "🇲🇱",
    dialCode: "+223",
    placeholder: "70 00 00 00",
    example: "+223 70 12 34 56",
  },
  TG: {
    code: "TG",
    name: "Togo",
    flag: "🇹🇬",
    dialCode: "+228",
    placeholder: "90 00 00 00",
    example: "+228 90 12 34 56",
  },
  GH: {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    dialCode: "+233",
    placeholder: "24 000 0000",
    example: "+233 24 123 4567",
  },
  FR: {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    dialCode: "+33",
    placeholder: "6 00 00 00 00",
    example: "+33 6 12 34 56 78",
  },
  US: {
    code: "US",
    name: "États-Unis",
    flag: "🇺🇸",
    dialCode: "+1",
    placeholder: "202 555 0100",
    example: "+1 202 555 0100",
  },
};

/**
 * Détecte le pays à partir de l'indicatif dans un numéro de téléphone saisi
 * Gère les formats : +221..., 00221..., 221...
 */
export function detectCountryFromPhone(rawPhone: string): string | null {
  if (!rawPhone) return null;
  const clean = rawPhone.trim().replace(/[\s\-\(\)]/g, "");

  // Formats internationaux avec + ou 00
  const normalized = clean.startsWith("00")
    ? "+" + clean.slice(2)
    : clean.startsWith("+")
    ? clean
    : "+" + clean;

  const prefixes: Array<{ prefix: string; code: string }> = [
    { prefix: "+225", code: "CI" },
    { prefix: "+221", code: "SN" },
    { prefix: "+229", code: "BJ" },
    { prefix: "+226", code: "BF" },
    { prefix: "+223", code: "ML" },
    { prefix: "+228", code: "TG" },
    { prefix: "+233", code: "GH" },
    { prefix: "+33", code: "FR" },
    { prefix: "+1", code: "US" },
  ];

  for (const { prefix, code } of prefixes) {
    if (normalized.startsWith(prefix) && normalized.length > prefix.length) {
      return code;
    }
  }

  return null;
}

export function getCountryDialInfo(countryCode?: string | null): CountryDialInfo {
  const code = (countryCode || "CI").toUpperCase().trim();
  return (
    COUNTRY_DIAL_DATA[code] || {
      code,
      name: code,
      flag: "🌍",
      dialCode: "+225",
      placeholder: "00 00 00 00 00",
      example: "+225 00 00 00 00",
    }
  );
}

export function getCountryPaymentChannels(countryCode?: string | null): CountryPaymentChannels {
  const code = (countryCode || "CI").toUpperCase().trim();

  switch (code) {
    case "SN":
      return {
        countryCode: "SN",
        countryName: "Sénégal",
        flag: "🇸🇳",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+221",
        description: "Orange Money, Free Money, Wave Sénégal & Carte bancaire",
        badges: [
          { label: "Orange SN", bg: "bg-[#FF6600]/15", text: "text-[#E65100]" },
          { label: "Free SN", bg: "bg-red-500/15", text: "text-red-600" },
          { label: "Wave SN", bg: "bg-[#1BAEF4]/15", text: "text-[#0084C7]" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro sénégalais (+221)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "orange_money_sn",
            name: "Orange Money Sénégal",
            shortName: "Orange Money",
            tagline: "Réglez directement avec votre compte Orange Money Sénégal",
            mmoProvider: "ORANGE_SEN",
            paymentMethod: "pawapay",
            color: "#FF6600",
            badgeBg: "bg-[#FF6600]/10",
            badgeText: "text-[#E65100]",
          },
          {
            id: "free_money_sn",
            name: "Free Money Sénégal",
            shortName: "Free Money",
            tagline: "Paiement direct via Free Money Sénégal",
            mmoProvider: "FREE_SEN",
            paymentMethod: "pawapay",
            color: "#E11D48",
            badgeBg: "bg-rose-500/10",
            badgeText: "text-rose-600",
          },
          {
            id: "wave_sn",
            name: "Wave Sénégal",
            shortName: "Wave",
            tagline: "Paiement instantané via Wave",
            paymentMethod: "pawapay",
            color: "#1BAEF4",
            badgeBg: "bg-[#1BAEF4]/10",
            badgeText: "text-[#0084C7]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "BJ":
      return {
        countryCode: "BJ",
        countryName: "Bénin",
        flag: "🇧🇯",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+229",
        description: "MTN Mobile Money, Moov Money Bénin & Carte bancaire",
        badges: [
          { label: "MTN BJ", bg: "bg-[#FFCC00]/20", text: "text-[#8A6D00]" },
          { label: "Moov BJ", bg: "bg-[#006699]/15", text: "text-[#006699]" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro béninois (+229)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "mtn_momo_bj",
            name: "MTN Mobile Money Bénin",
            shortName: "MTN MoMo",
            tagline: "Paiement instantané via votre compte MTN Bénin",
            mmoProvider: "MTN_MOMO_BEN",
            paymentMethod: "pawapay",
            color: "#FFCC00",
            badgeBg: "bg-[#FFCC00]/20",
            badgeText: "text-[#8A6D00]",
          },
          {
            id: "moov_money_bj",
            name: "Moov Money Bénin",
            shortName: "Moov Money",
            tagline: "Réglez directement avec votre compte Moov Bénin",
            mmoProvider: "MOOV_BEN",
            paymentMethod: "pawapay",
            color: "#006699",
            badgeBg: "bg-[#006699]/10",
            badgeText: "text-[#006699]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "BF":
      return {
        countryCode: "BF",
        countryName: "Burkina Faso",
        flag: "🇧🇫",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+226",
        description: "Orange Money BF, Moov Money BF & Carte bancaire",
        badges: [
          { label: "Orange BF", bg: "bg-[#FF6600]/15", text: "text-[#E65100]" },
          { label: "Moov BF", bg: "bg-[#006699]/15", text: "text-[#006699]" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro burkinabè (+226)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "orange_bf",
            name: "Orange Money Burkina Faso",
            shortName: "Orange Money",
            tagline: "Réglez avec votre compte Orange Money Burkina",
            paymentMethod: "pawapay",
            color: "#FF6600",
            badgeBg: "bg-[#FF6600]/10",
            badgeText: "text-[#E65100]",
          },
          {
            id: "moov_bf",
            name: "Moov Money Burkina Faso",
            shortName: "Moov Money",
            tagline: "Paiement direct via Moov Money Burkina",
            paymentMethod: "pawapay",
            color: "#006699",
            badgeBg: "bg-[#006699]/10",
            badgeText: "text-[#006699]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "ML":
      return {
        countryCode: "ML",
        countryName: "Mali",
        flag: "🇲🇱",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+223",
        description: "Orange Money Mali, Moov Money Mali & Carte bancaire",
        badges: [
          { label: "Orange ML", bg: "bg-[#FF6600]/15", text: "text-[#E65100]" },
          { label: "Moov ML", bg: "bg-[#006699]/15", text: "text-[#006699]" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro malien (+223)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "orange_ml",
            name: "Orange Money Mali",
            shortName: "Orange Money",
            tagline: "Réglez avec votre compte Orange Money Mali",
            paymentMethod: "pawapay",
            color: "#FF6600",
            badgeBg: "bg-[#FF6600]/10",
            badgeText: "text-[#E65100]",
          },
          {
            id: "moov_ml",
            name: "Moov Money Mali",
            shortName: "Moov Money",
            tagline: "Paiement direct via Moov Money Mali",
            paymentMethod: "pawapay",
            color: "#006699",
            badgeBg: "bg-[#006699]/10",
            badgeText: "text-[#006699]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "TG":
      return {
        countryCode: "TG",
        countryName: "Togo",
        flag: "🇹🇬",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+228",
        description: "Moov Money Togo, T-Money & Carte bancaire",
        badges: [
          { label: "Moov TG", bg: "bg-[#006699]/15", text: "text-[#006699]" },
          { label: "T-Money", bg: "bg-emerald-500/15", text: "text-emerald-700" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro togolais (+228)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "tmoney_tg",
            name: "T-Money Togo",
            shortName: "T-Money",
            tagline: "Réglez directement via votre compte T-Money Togocom",
            paymentMethod: "pawapay",
            color: "#10B981",
            badgeBg: "bg-emerald-500/10",
            badgeText: "text-emerald-700",
          },
          {
            id: "moov_tg",
            name: "Moov Money Togo",
            shortName: "Moov Money",
            tagline: "Paiement direct via Moov Money Togo",
            paymentMethod: "pawapay",
            color: "#006699",
            badgeBg: "bg-[#006699]/10",
            badgeText: "text-[#006699]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "GH":
      return {
        countryCode: "GH",
        countryName: "Ghana",
        flag: "🇬🇭",
        currency: "GHS",
        currencySymbol: "GH₵",
        dialCode: "+233",
        description: "MTN Mobile Money Ghana, Vodafone Cash & Carte bancaire",
        badges: [
          { label: "MTN MoMo GH", bg: "bg-[#FFCC00]/20", text: "text-[#8A6D00]" },
          { label: "Vodafone Cash", bg: "bg-red-500/15", text: "text-red-600" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro ghanéen (+233)",
            paymentMethod: "pawapay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "mtn_gh",
            name: "MTN Mobile Money Ghana",
            shortName: "MTN MoMo",
            tagline: "Instant payment with your MTN MoMo Ghana account",
            paymentMethod: "pawapay",
            color: "#FFCC00",
            badgeBg: "bg-[#FFCC00]/20",
            badgeText: "text-[#8A6D00]",
          },
          {
            id: "vodafone_gh",
            name: "Telecel / Vodafone Cash",
            shortName: "Vodafone Cash",
            tagline: "Pay directly with Telecel / Vodafone Cash Ghana",
            paymentMethod: "pawapay",
            color: "#E11D48",
            badgeBg: "bg-rose-500/10",
            badgeText: "text-rose-600",
          },
          {
            id: "card",
            name: "Debit/Credit Card (Visa / Mastercard)",
            shortName: "Bank Card",
            tagline: "Secure card payment with 3D Secure",
            paymentMethod: "pawapay",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };

    case "CI":
    default:
      return {
        countryCode: "CI",
        countryName: "Côte d'Ivoire",
        flag: "🇨🇮",
        currency: "XOF",
        currencySymbol: "FCFA",
        dialCode: "+225",
        description: "Wave, Orange Money, MTN MoMo, Moov Money & Carte bancaire",
        badges: [
          { label: "Wave", bg: "bg-[#1BAEF4]/15", text: "text-[#0084C7]" },
          { label: "Orange", bg: "bg-[#FF6600]/15", text: "text-[#E65100]" },
          { label: "MTN", bg: "bg-[#FFCC00]/20", text: "text-[#8A6D00]" },
          { label: "Moov", bg: "bg-[#006699]/15", text: "text-[#006699]" },
          { label: "Carte", bg: "bg-muted", text: "text-foreground" },
        ],
        operators: [
          {
            id: "auto",
            name: "Routage Automatique",
            shortName: "Auto-détection",
            tagline: "Détection automatique selon votre numéro ivoirien (+225)",
            paymentMethod: "geniuspay",
            color: "#6366F1",
            badgeBg: "bg-indigo-500/10",
            badgeText: "text-indigo-600",
            recommended: true,
          },
          {
            id: "wave_ci",
            name: "Wave Côte d'Ivoire",
            shortName: "Wave",
            tagline: "Paiement instantané à 0% de frais via Wave",
            paymentMethod: "wave",
            color: "#1BAEF4",
            badgeBg: "bg-[#1BAEF4]/10",
            badgeText: "text-[#0084C7]",
          },
          {
            id: "orange_ci",
            name: "Orange Money Côte d'Ivoire",
            shortName: "Orange Money",
            tagline: "Réglez directement avec votre compte Orange Money",
            mmoProvider: "ORANGE_CIV",
            paymentMethod: "orange_money",
            color: "#FF6600",
            badgeBg: "bg-[#FF6600]/10",
            badgeText: "text-[#E65100]",
          },
          {
            id: "mtn_ci",
            name: "MTN Mobile Money Côte d'Ivoire",
            shortName: "MTN MoMo",
            tagline: "Paiement rapide via MTN MoMo",
            mmoProvider: "MTN_MOMO_CIV",
            paymentMethod: "mtn_money",
            color: "#FFCC00",
            badgeBg: "bg-[#FFCC00]/20",
            badgeText: "text-[#8A6D00]",
          },
          {
            id: "moov_ci",
            name: "Moov Money Côte d'Ivoire",
            shortName: "Moov Money",
            tagline: "Réglez avec votre compte Moov Money",
            paymentMethod: "moov_money",
            color: "#006699",
            badgeBg: "bg-[#006699]/10",
            badgeText: "text-[#006699]",
          },
          {
            id: "card",
            name: "Carte bancaire (Visa / Mastercard)",
            shortName: "Carte bancaire",
            tagline: "Paiement international sécurisé 3D Secure",
            paymentMethod: "visa",
            color: "#1E293B",
            badgeBg: "bg-slate-700/10",
            badgeText: "text-slate-800 dark:text-slate-200",
          },
        ],
      };
  }
}

// Alias de rétro-compatibilité
export const CINETPAY_SUPPORTED_COUNTRIES = ["CI"] as const;
export type CinetPaySupportedCountry = (typeof CINETPAY_SUPPORTED_COUNTRIES)[number];
export function isCinetPaySupportedCountry(
  code: string | undefined | null,
): boolean {
  if (!code) return false;
  return code.toUpperCase().trim() === "CI";
}


