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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { createOrderFn } from "@/lib/orders/orders.functions";
import { listPublicCityShippingRatesFn } from "@/lib/shipping/shipping.functions";
import { initiateCinetPayPaymentFn } from "@/lib/payments/cinetpay.functions";
import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import { PageLoader } from "@/components/page-loader";
import {
  PAYMENT_METHODS,
  methodAvailableIn,
} from "@/lib/payments/payment-methods";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error(t("checkout.errorFields", "Veuillez renseigner tous les champs obligatoires (nom, téléphone, adresse, ville)."));
      return;
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

      const effectivePaymentMethod = paymentMode === "cod" ? "cash_on_delivery" : "visa";

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
      if (paymentMode === "cod") {
        toast.success(t("checkout.successToast", "Commande enregistrée ! Vous allez être redirigé vers le suivi."));
        router.navigate({ href: getLocalizedPath(`/orders/${orderId}`), replace: true });
        return;
      }

      // Paiement en ligne
      const isOnlineSupported = isCinetPaySupportedCountry(currentCountryCode);
      if (!isOnlineSupported) {
        toast.success(
          `Commande #${orderId.slice(0, 8)} enregistrée ! Notre équipe vous contactera pour finaliser le règlement en ${country.name}.`
        );
        router.navigate({ href: getLocalizedPath(`/orders/${orderId}`), replace: true });
        return;
      }

      // Initialisation CinetPay
      setRedirecting(true);
      const paymentRes = await initiateCinetPayPaymentFn({
        data: {
          orderId,
          operator: selectedOperator === "all" ? undefined : selectedOperator,
        },
      });

      if (paymentRes.paymentUrl) {
        toast.info("Redirection vers la passerelle sécurisée de paiement…");
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
                  placeholder="ex : +225 07 00 00 00 00"
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

          {/* Section 2 : Mode de paiement */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-primary">
                  {t("checkout.paymentSection", "2. Mode de Règlement Sécurisé")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("checkout.paymentSubtitle", "Choisissez votre moyen de paiement privilégié")}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMode("online")}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition cursor-pointer ${
                  paymentMode === "online"
                    ? "border-gold bg-gold/10 ring-2 ring-gold/40 shadow-xs"
                    : "border-border bg-secondary/30 hover:bg-secondary/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm font-bold text-primary">
                      {t("checkout.paymentModeOnline", "Paiement Mobile Money / Carte")}
                    </span>
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Wave, Orange Money, MTN, Moov ou Carte Visa / Mastercard. Traitement instantané.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("cod")}
                className={`flex flex-col justify-between rounded-2xl border p-5 text-left transition cursor-pointer ${
                  paymentMode === "cod"
                    ? "border-gold bg-gold/10 ring-2 ring-gold/40 shadow-xs"
                    : "border-border bg-secondary/30 hover:bg-secondary/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm font-bold text-primary">
                      {t("checkout.paymentModeCod", "Paiement en espèces à la livraison")}
                    </span>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("checkout.codDesc", "Payez en main propre à notre livreur partenaire au moment du dépôt de votre colis.")}
                  </p>
                </div>
              </button>
            </div>
          </section>
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

            {/* Bouton de confirmation */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gold py-4 text-sm font-bold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("checkout.submitting", "Traitement de votre commande…")}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>{t("checkout.confirm", "Valider & Procéder au Règlement")}</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
