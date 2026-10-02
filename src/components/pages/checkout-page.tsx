import { Link, useRouter, Navigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Lock,
  ShieldCheck,
  Loader2,
  Truck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { createOrderFn } from "@/lib/orders/orders.functions";
import { listPublicCityShippingRatesFn } from "@/lib/shipping/shipping.functions";
import { initiateGeniusPayPaymentFn } from "@/lib/payments/geniuspay.functions";
import { PageLoader } from "@/components/page-loader";
import {
  getCountryPaymentChannels,
  getCountryDialInfo,
} from "@/lib/payments/supported-countries";
import { useLanguageNavigation } from "@/lib/i18n-routing";

import logoWave from "@/assets/wave.png";
import logoOM from "@/assets/om.png";
import logoMTN from "@/assets/mtn.jpg";
import logoMoov from "@/assets/moov.png";
import logoVisa from "@/assets/visa.png";

export function CheckoutPage() {
  const { items, clearCart } = useCart();
  const { country } = useCountry();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const orderPlacedRef = useRef(false);

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

  const currentCountryCode = "CI";
  const currencySymbol = "FCFA";
  const currencyCode = "XOF";

  const isOnlineSupported = true;
  const countryPaymentChannels = getCountryPaymentChannels("CI");
  const currentDialInfo = getCountryDialInfo("CI");

  const currentCountryMeta = {
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    phoneCode: "+225",
    placeholder: "+225 07 00 00 00 00",
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, phone: e.target.value }));
  };

  // Tarifs spécifiques aux villes pour la Côte d'Ivoire
  const availableCityRates = (cityRatesData?.rates ?? []).filter(
    (r) => r.country_code === "CI"
  );

  const matchedCityRate = availableCityRates.find(
    (r) => r.city_name.trim().toLowerCase() === form.city.trim().toLowerCase()
  );

  const baseShipping = Number(country?.base_shipping_fee ?? 1500);
  const shipping = matchedCityRate ? Number(matchedCityRate.shipping_fee) : baseShipping;

  // Calcul du sous-total
  const subtotal = items.reduce((acc, it) => {
    const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
    const fallbackPrice = it.prices?.find((p) => p.country_code === "CI")?.price ?? it.unitPrice ?? 0;
    const unitPrice = Number(priceObj?.price ?? fallbackPrice);
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

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error(t("checkout.errorFields", "Veuillez renseigner tous les champs obligatoires (nom, téléphone, adresse, ville)."));
      return;
    }

    setSubmitting(true);
    try {
      const orderPayloadItems = items.map((it) => {
        const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
        const fallbackPrice = it.prices?.find((p) => p.country_code === "CI")?.price ?? it.unitPrice ?? 0;
        const unitPrice = Number(priceObj?.price ?? fallbackPrice);
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

      const orderRes = await createOrderFn({
        data: {
          countryCode: currentCountryCode,
          currencyCode,
          subtotal: Number(subtotal),
          shippingFee: Number(shipping),
          total: Number(total),
          paymentMethod: "geniuspay",
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

      // Paiement en ligne sécurisé obligatoire via GeniusPay
      setRedirecting(true);
      const paymentRes = await initiateGeniusPayPaymentFn({
        data: {
          orderId,
          emailOverride: user?.email || undefined,
        },
      });

      if (paymentRes.paymentUrl) {
        toast.info("Redirection vers la passerelle sécurisée GeniusPay…");
        window.location.href = paymentRes.paymentUrl;
      } else {
        throw new Error("Lien de paiement GeniusPay introuvable");
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
                  {t("checkout.shippingSection", "Coordonnées de Livraison & Règlement")}
                </h2>
                <p className="text-xs text-muted-foreground">{t("checkout.shippingSubtitle", "Renseignez vos informations de livraison et choisissez votre mode de règlement")}</p>
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
                <div className="flex rounded-xl border border-border bg-background focus-within:border-gold overflow-hidden transition-colors">
                  <div className="flex items-center gap-1.5 px-3 bg-muted/40 border-r border-border/60 text-xs font-semibold shrink-0 select-none">
                    <span className="text-sm">🇨🇮</span>
                    <span className="text-xs font-bold text-foreground">+225</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="07 00 00 00 00 (Orange, Wave, MTN, Moov)"
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t("checkout.cityLabel", "Ville ou Commune de destination *")}
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder={t("checkout.cityPlaceholder", "ex : Abidjan (Cocody, Yopougon, Marcory...), Yamoussoukro, Bouaké...")}
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

            {/* Mode de règlement 100% en ligne GeniusPay */}
            <div className="mt-7 pt-6 border-t border-border/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-foreground">
                  {t("checkout.paymentMode", "Mode de règlement")}
                </label>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Côte d'Ivoire (FCFA)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>{t("checkout.geniusPayTitle", "Paiement en ligne sécurisé GeniusPay")}</span>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        {t("checkout.geniusPayCertified", "Agréé")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logos des moyens de paiement uniquement */}
                <div className="flex items-center gap-1.5 shrink-0 pl-13 sm:pl-0">
                  {[
                    { name: "Wave", src: logoWave },
                    { name: "Orange Money", src: logoOM },
                    { name: "MTN MoMo", src: logoMTN },
                    { name: "Moov Money", src: logoMoov },
                    { name: "Carte bancaire", src: logoVisa },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className="flex h-7 w-10 items-center justify-center rounded-md bg-white p-1 shadow-2xs border border-stone-200/80"
                      title={p.name}
                    >
                      <img
                        src={p.src}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
                const fallbackPrice = it.prices?.find((p) => p.country_code === "CI")?.price ?? it.unitPrice ?? 0;
                const unitPrice = Number(priceObj?.price ?? fallbackPrice);
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

            {/* Bouton de confirmation unique GeniusPay */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold py-4 text-sm font-bold text-gold-foreground shadow-gold transition-all duration-200 hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("checkout.submitting", "Connexion à GeniusPay…")}</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>{t("checkout.confirm", "Procéder au paiement")}</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
