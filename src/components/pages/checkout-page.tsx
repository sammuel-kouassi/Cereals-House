import { Link, useRouter, Navigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Lock,
  ShieldCheck,
  Loader2,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
  MapPin,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Smartphone,
  Shield,
  HelpCircle,
  MessageCircle,
  Plane,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { createOrderFn } from "@/lib/orders/orders.functions";
import { listPublicCityShippingRatesFn } from "@/lib/shipping/shipping.functions";
import { initiatePaystackPaymentFn } from "@/lib/payments/paystack.functions";
import { PageLoader } from "@/components/page-loader";
import { isOnlinePaymentSupported } from "@/lib/payments/supported-countries";
import { useLanguageNavigation } from "@/lib/i18n-routing";

export function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const { country } = useCountry();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const orderPlacedRef = useRef(false);

  const [paymentMode, setPaymentMode] = useState<"online" | "cod">("online");
  const [selectedOperator, setSelectedOperator] = useState<string>("all");
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    address: "",
    city: "",
    notes: "",
  });

  const { data: cityRatesData } = useQuery({
    queryKey: ["city-shipping-rates"],
    queryFn: () => listPublicCityShippingRatesFn(),
  });

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";
  const currencyCode = country?.currency_code ?? "XOF";

  const COUNTRY_METADATA: Record<string, { name: string; flag: string; phoneCode: string; placeholder: string }> = {
    CI: { name: "Côte d'Ivoire", flag: "🇨🇮", phoneCode: "+225", placeholder: "+225 07 00 00 00 00" },
    SN: { name: "Sénégal", flag: "🇸🇳", phoneCode: "+221", placeholder: "+221 77 000 00 00" },
    ML: { name: "Mali", flag: "🇲🇱", phoneCode: "+223", placeholder: "+223 70 00 00 00" },
    BF: { name: "Burkina Faso", flag: "🇧🇫", phoneCode: "+226", placeholder: "+226 70 00 00 00" },
    TG: { name: "Togo", flag: "🇹🇬", phoneCode: "+228", placeholder: "+228 90 00 00 00" },
    BJ: { name: "Bénin", flag: "🇧🇯", phoneCode: "+229", placeholder: "+229 97 00 00 00" },
    GH: { name: "Ghana", flag: "🇬🇭", phoneCode: "+233", placeholder: "+233 24 000 0000" },
    FR: { name: "France & Europe", flag: "🇫🇷", phoneCode: "+33", placeholder: "+33 6 00 00 00 00" },
    US: { name: "États-Unis", flag: "🇺🇸", phoneCode: "+1", placeholder: "+1 202 555 0100" },
  };

  const currentCountryMeta = COUNTRY_METADATA[currentCountryCode] || {
    name: country?.name || currentCountryCode,
    flag: "🌍",
    phoneCode: "+225",
    placeholder: "+225 00 00 00 00 00",
  };

  const isCodAvailable = currentCountryCode === "CI";

  useEffect(() => {
    if (!isCodAvailable && paymentMode === "cod") {
      setPaymentMode("online");
    }
  }, [currentCountryCode, isCodAvailable, paymentMode]);

  // Tarifs spécifiques aux villes pour ce pays
  const availableCityRates = (cityRatesData?.rates ?? []).filter(
    (r) => r.country_code === currentCountryCode
  );

  const matchedCityRate = availableCityRates.find(
    (r) => r.city_name.trim().toLowerCase() === form.city.trim().toLowerCase()
  );

  const baseShipping = Number(country?.base_shipping_fee ?? 1500);
  const shipping = matchedCityRate ? Number(matchedCityRate.shipping_fee) : baseShipping;

  // Calcul du sous-total
  const subtotal = items.reduce((acc, it) => {
    const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
    const unitPrice = Number(priceObj?.price ?? it.unitPrice ?? 0);
    return acc + unitPrice * Number(it.quantity || 1);
  }, 0);

  const total = Number(subtotal) + Number(shipping);

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("checkout.signInTitle", "Finaliser votre commande")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "checkout.signInDesc",
            "Veuillez vous connecter ou créer un compte pour sécuriser votre commande et suivre la livraison."
          )}
        </p>
        <Link
          to={getLocalizedPath("/auth")}
          search={{ redirect: getLocalizedPath("/checkout") }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5"
        >
          {t("checkout.signIn", "Se connecter / S'inscrire")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !submitting && !redirecting && !orderPlacedRef.current) {
    return <Navigate to={getLocalizedPath("/cart") as any} replace />;
  }

  const WHATSAPP_NUMBER = "2250584637219";

  function handleWhatsAppExport() {
    if (!form.full_name.trim() || !form.phone.trim() || !form.city.trim()) {
      toast.error(t("checkout.errorFields", "Veuillez renseigner votre nom, téléphone et ville de destination."));
      return;
    }
    const itemsLines = items.map((it) => `• ${it.quantity}x ${it.name}`).join("\n");
    const msg =
      `Bonjour Cereals House 🌾\n\n` +
      `Je souhaite finaliser ma commande export pour une livraison vers : *${currentCountryMeta.name}* ${currentCountryMeta.flag}\n\n` +
      `📋 *Articles sélectionnés :*\n${itemsLines}\n\n` +
      `💰 *Total articles :* ${formatPrice(subtotal, currencySymbol)}\n\n` +
      `👤 *Destinataire :* ${form.full_name}\n` +
      `📞 *Téléphone / WhatsApp :* ${form.phone}\n` +
      `📍 *Ville & Pays :* ${form.city}, ${currentCountryMeta.name}\n` +
      `🏠 *Adresse / Quartier :* ${form.address || "À convenir"}\n` +
      (form.notes ? `📝 *Consignes :* ${form.notes}\n` : "") +
      `\nMerci de me transmettre le devis d'expédition et les modalités de paiement adaptées.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success(
      `Votre commande export pour le ${currentCountryMeta.name} a été préparée sur WhatsApp ! Notre équipe vous répond immédiatement.`
    );
  }

  async function handleSubmit(e?: React.FormEvent, chosenMode?: "online" | "cod") {
    if (e) e.preventDefault();
    if (!country) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error(t("checkout.errorFields", "Veuillez renseigner tous les champs obligatoires (nom, téléphone, adresse, ville)."));
      return;
    }

    // Commandes export hors Côte d'Ivoire : prise en charge personnalisée via WhatsApp
    if (currentCountryCode !== "CI") {
      handleWhatsAppExport();
      return;
    }

    const selectedMode = chosenMode || paymentMode;
    if (chosenMode) {
      setPaymentMode(chosenMode);
    }

    setSubmitting(true);
    try {
      const orderPayloadItems = items.map((it) => {
        const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
        const unitPrice = Number(priceObj?.price ?? it.unitPrice ?? 0);
        const quantity = Number(it.quantity || 1);
        return {
          productId: it.productId || it.slug,
          productName: it.name,
          productImage: it.imageUrl ?? it.image ?? null,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
        };
      });

      const effectivePaymentMethod = selectedMode === "cod" ? "cash_on_delivery" : "paystack";

      const orderRes = await createOrderFn({
        data: {
          countryCode: currentCountryCode,
          currencyCode,
          subtotal: Number(subtotal),
          shippingFee: Number(shipping),
          total: Number(total),
          paymentMethod: effectivePaymentMethod,
          shippingFullName: form.full_name.trim(),
          shippingPhone: form.phone.trim(),
          shippingAddress: form.address.trim(),
          shippingCity: form.city.trim(),
          notes: form.notes.trim() || null,
          items: orderPayloadItems,
        },
      });

      if (!orderRes?.id) {
        throw new Error("Identifiant de commande manquant après création");
      }

      const orderId = orderRes.id;
      orderPlacedRef.current = true;
      clearCart();

      // Paiement à la livraison
      if (selectedMode === "cod") {
        toast.success(t("checkout.successToast", "Commande enregistrée ! Vous allez être redirigé vers le suivi."));
        router.navigate({ href: getLocalizedPath(`/orders/${orderId}`), replace: true });
        return;
      }

      // Paiement en ligne sécurisé via Paystack (Mobile Money & Carte)
      setRedirecting(true);
      const paymentRes = await initiatePaystackPaymentFn({
        data: {
          orderId,
          emailOverride: user?.email || undefined,
        },
      });

      if (paymentRes.paymentUrl) {
        toast.info("Redirection vers la passerelle sécurisée de paiement Paystack…");
        window.location.href = paymentRes.paymentUrl;
      } else {
        throw new Error("Lien de paiement introuvable");
      }
    } catch (err: any) {
      console.error("[Checkout error]", err);
      let message = t("checkout.errorToast", "Une erreur est survenue lors de l'enregistrement de votre commande.");
      if (err?.message) {
        try {
          const parsed = JSON.parse(err.message);
          message = parsed.error || err.message;
        } catch {
          message = err.message;
        }
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (redirecting) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-gold/25 blur-2xl animate-pulse" />
          <div className="relative grid h-24 w-24 place-items-center rounded-3xl border-2 border-gold/40 bg-card shadow-gold">
            <Lock className="h-10 w-10 text-gold animate-pulse" />
          </div>
        </div>
        <div className="space-y-3 max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gold">
            <ShieldCheck className="h-4 w-4" /> {t("checkout.secureHeader", "Passerelle Agréée & Chiffrée")}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            {t("checkout.redirectingTitle", "Ouverture de l'espace de paiement…")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("checkout.redirectingDesc", "Nous initialisons votre session sécurisée. Vous allez être redirigé(e) vers la passerelle de paiement pour valider votre commande.")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" />
          <span>{t("checkout.sslAssurance", "Protection SSL 256 bits · Zéro donnée bancaire stockée")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* En-tête de la page */}
      <div className="border-b border-border/80 pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
              <Sparkles className="h-3.5 w-3.5" /> {t("checkout.stepEyebrow", "Étape Finale")}
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-primary tracking-tight">
              {t("checkout.title", "Finaliser votre commande")}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{t("checkout.secureHeader", "Paiement 100% Garanti & Sécurisé")}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
        {/* Formulaire Principal (Gauche) */}
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          {/* Section 1 : Adresse de livraison */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-primary">
                  {t("checkout.shippingSection", "1. Adresse & Coordonnées de Livraison")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("checkout.shippingSubtitle", "Où souhaitez-vous recevoir votre colis ?")}</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.fullName", "Nom & Prénom du destinataire *")}
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="ex : Marie Koné"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.phone", "Numéro de téléphone / WhatsApp *")}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={currentCountryMeta.placeholder}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.city", "Ville de destination *")}
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="ex : Abidjan / Accra / Dakar..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.address", "Quartier, rue ou repère précis *")}
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="ex : Cocody Angré 8ème Tranche"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.notes", "Consignes particulières de livraison (optionnel)")}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ex : Livrer de préférence l'après-midi, appeler à l'arrivée..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Section 2 : Mode de règlement (Côte d'Ivoire) */}
          {currentCountryCode === "CI" ? (
            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-md p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                    <CreditCard className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-primary">
                      2. Mode de Règlement
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Choisissez comment vous souhaitez régler votre commande
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/20 px-3 py-1 text-xs font-semibold text-gold">
                  <span>🇨🇮</span>
                  <span>Côte d'Ivoire</span>
                </span>
              </div>

              {/* Sélection simple et élégante du mode de règlement */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                {/* Option 1 : Mobile Money & Carte */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setPaymentMode("online")}
                  className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                    paymentMode === "online"
                      ? "border-gold bg-gold/[0.08] shadow-xs"
                      : "border-border/70 bg-background/50 hover:border-gold/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                        paymentMode === "online"
                          ? "bg-gold text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Smartphone className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-primary">
                          Mobile Money & Carte
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gold bg-gold/15 px-1.5 py-0.5 rounded-md">
                          En ligne
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Wave, Orange, MTN, Moov, Carte (Paystack)
                      </span>
                    </div>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      paymentMode === "online"
                        ? "border-gold bg-gold text-white"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {paymentMode === "online" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* Option 2 : Espèces à la livraison */}
                {isCodAvailable ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setPaymentMode("cod")}
                    className={`flex items-center justify-between rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                      paymentMode === "cod"
                        ? "border-gold bg-gold/[0.08] shadow-xs"
                        : "border-border/70 bg-background/50 hover:border-gold/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
                          paymentMode === "cod"
                            ? "bg-gold text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Banknote className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-primary">
                            Espèces à la livraison
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                            Abidjan
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Règlement auprès du livreur à la réception
                        </span>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        paymentMode === "cod"
                          ? "border-gold bg-gold text-white"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {paymentMode === "cod" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Badges de sécurité et réseaux */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Paiement sécurisé · Chiffrement SSL</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="rounded bg-[#1BAEF4]/10 text-[#0084C7] font-bold px-1.5 py-0.5">Wave</span>
                  <span className="rounded bg-[#FF6600]/10 text-[#E65100] font-bold px-1.5 py-0.5">Orange</span>
                  <span className="rounded bg-[#FFCC00]/15 text-[#8A6D00] font-bold px-1.5 py-0.5">MTN</span>
                  <span className="rounded bg-[#006699]/10 text-[#006699] font-bold px-1.5 py-0.5">Moov</span>
                  <span className="rounded bg-muted text-foreground font-medium px-1.5 py-0.5">Carte</span>
                </div>
              </div>
            </section>
          ) : (
            /* Section 2 Export : Pour les pays hors Côte d'Ivoire */
            <section className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-card/60 backdrop-blur-md p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-primary">
                      2. Expédition & Commande Export
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Acheminement sur-mesure vers le <strong className="text-foreground">{currentCountryMeta.name}</strong>
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-700">
                  <span>{currentCountryMeta.flag}</span>
                  <span>{currentCountryMeta.name}</span>
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-background/50 p-5 space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Plane className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">
                      Prise en charge dédiée hors Côte d'Ivoire
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Pour les livraisons vers le <strong>{currentCountryMeta.name}</strong>, notre service export coordonne l'acheminement (fret aérien express ou groupage) et met à votre disposition un mode de règlement sans frontières.
                    </p>
                  </div>
                </div>

                {/* 3 piliers épurés style WorkHub */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Plane className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Fret & Transport</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Calcul optimisé selon le volume et votre ville ({form.city.trim() || currentCountryMeta.name}).
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Règlement Souple</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Wave International, Orange Money, virement bancaire ou transfert direct.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Conseiller Dédié</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Votre panier est transmis en 1 clic sur WhatsApp pour préparation express.
                    </p>
                  </div>
                </div>

                {/* Grand bouton WhatsApp d'action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppExport}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-4 text-xs sm:text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                    <span>Finaliser ma Commande pour le {currentCountryMeta.name} sur WhatsApp</span>
                  </button>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Ligne officielle du service export : <strong>+225 05 84 63 72 19</strong>
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Récapitulatif Commande (Droite) */}
        <aside className="space-y-6 lg:col-span-5 xl:col-span-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-md space-y-5 lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold text-primary border-b border-border/80 pb-4">
              {t("checkout.orderSummarySection", "Récapitulatif de la Commande")}
            </h3>

            {/* Liste des articles */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => {
                const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
                const unitPrice = priceObj?.price ?? it.unitPrice ?? 0;
                return (
                  <div key={it.slug} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-bold text-gold shrink-0">{it.quantity}×</span>
                      <span className="truncate text-foreground font-medium">{it.name}</span>
                    </div>
                    <span className="font-semibold text-foreground shrink-0">
                      {formatPrice(unitPrice * it.quantity, currencySymbol)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totaux */}
            <div className="border-t border-border/80 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("checkout.subtotal", "Sous-total des articles")}</span>
                <span className="font-semibold text-foreground">{formatPrice(subtotal, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("checkout.shipping", "Frais de livraison")}</span>
                <span className="font-semibold text-foreground">{formatPrice(shipping, currencySymbol)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-primary">
                <span>{t("checkout.total", "Montant total TTC")}</span>
                <span className="text-gold font-display text-xl">{formatPrice(total, currencySymbol)}</span>
              </div>
            </div>

            {/* Bouton de confirmation unique */}
            {currentCountryCode === "CI" ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold py-4 text-sm font-bold text-gold-foreground shadow-gold transition-all duration-200 hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("checkout.submitting", "Traitement de votre commande…")}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Commander ({formatPrice(total, currencySymbol)})</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Commander via WhatsApp Export</span>
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Transfert instantané de votre commande pour le {currentCountryMeta.name}
                </p>
              </div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
