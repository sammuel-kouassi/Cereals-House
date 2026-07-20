import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Lock,
  ShieldCheck,
  Loader2,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { initiateCinetPayPaymentFn } from "@/lib/payments/cinetpay.functions";
import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import { PageLoader } from "@/components/page-loader";

// Logos réels des opérateurs
import orangeLogo from "@/assets/om.png";
import waveLogo from "@/assets/waveci.jpg";
import mtnLogo from "@/assets/mtn.jpg";
import moovLogo from "@/assets/moov.png";
import visaLogo from "@/assets/visa.png";

// "cash_on_delivery" est un identifiant à part, distinct des méthodes en ligne ci-dessous.
// Si la colonne "payment_method" de la table Supabase "orders" est un type enum restreint,
// il faudra y ajouter cette valeur, sinon l'insertion échouera à la soumission.
type PaymentId =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "moov_money"
  | "tmoney"
  | "visa"
  | "cash_on_delivery";

type PaymentMethod = {
  id: Exclude<PaymentId, "cash_on_delivery">;
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
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "orange_money",
    countries: ["CI", "BF", "ML"],
    bg: "bg-[#FF7900]",
    fg: "text-white",
    ring: "ring-[#FF7900]",
    badge: "orange",
    logo: orangeLogo,
  },
  {
    id: "wave",
    countries: ["CI", "BF"],
    bg: "bg-[#1DC8F2]",
    fg: "text-white",
    ring: "ring-[#1DC8F2]",
    badge: "wave~",
    logo: waveLogo,
  },
  {
    id: "mtn_money",
    countries: ["CI", "BJ"],
    bg: "bg-[#FFCC00]",
    fg: "text-black",
    ring: "ring-[#FFCC00]",
    badge: "MTN",
    logo: mtnLogo,
  },
  {
    id: "moov_money",
    countries: ["CI", "BF", "ML", "TG", "BJ"],
    bg: "bg-[#005BAA]",
    fg: "text-white",
    ring: "ring-[#005BAA]",
    badge: "moov",
    logo: moovLogo,
  },
  {
    id: "tmoney",
    countries: ["TG"],
    bg: "bg-[#F5A623]",
    fg: "text-white",
    ring: "ring-[#F5A623]",
    badge: "TMoney",
    // Pas de logo fourni pour l'instant — l'affichage bascule sur un badge
    // texte stylé (voir le rendu de la carte plus bas).
  },
  {
    id: "visa",
    // Le Ghana, la France et les États-Unis ne sont pas des pays gérés par
    // cette API CinetPay (ni comme "country" d'initialisation, ni comme
    // marché) — Visa n'est donc disponible que là où on a déjà des
    // identifiants CinetPay actifs.
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
// CINETPAY_SUPPORTED_COUNTRIES — actuellement réduit à la Côte d'Ivoire).
function methodAvailableIn(m: PaymentMethod, countryCode: string): boolean {
  return (
    (m.countries as readonly string[]).includes(countryCode) &&
    isCinetPaySupportedCountry(countryCode)
  );
}

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Commande — Cereals House" }] }),
  beforeLoad: ({ context: _context, location }) => {
    void location;
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { country } = useCountry();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const supportedDefault =
    !country || PAYMENT_METHODS.some((m) => methodAvailableIn(m, country.code))
      ? (PAYMENT_METHODS.find((m) => !country || methodAvailableIn(m, country.code))?.id ?? "visa")
      : "cash_on_delivery";
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
    payment_method: supportedDefault as PaymentId,
  });

  // Mode de règlement : en ligne (Mobile Money / carte) ou à la livraison.
  const paymentMode: "online" | "cod" =
    form.payment_method === "cash_on_delivery" ? "cod" : "online";
  const [lastOnlineMethod, setLastOnlineMethod] = useState<Exclude<PaymentId, "cash_on_delivery">>(
    supportedDefault === "cash_on_delivery" ? "visa" : supportedDefault,
  );

  function selectOnlineMode() {
    setForm((prev) => ({ ...prev, payment_method: lastOnlineMethod }));
  }
  function selectCodMode() {
    if (form.payment_method !== "cash_on_delivery") {
      setLastOnlineMethod(form.payment_method as Exclude<PaymentId, "cash_on_delivery">);
    }
    setForm((prev) => ({ ...prev, payment_method: "cash_on_delivery" }));
  }

  // Numéro saisi par le client pour l'opérateur mobile money choisi — transmis
  // à CinetPay en priorité sur le téléphone de livraison (voir handleSubmit).
  const [momoNumber, setMomoNumber] = useState("");

  useEffect(() => {
    if (!country || paymentMode === "cod") return;
    const supported = PAYMENT_METHODS.some(
      (m) => methodAvailableIn(m, country.code) && m.id === form.payment_method,
    );
    if (!supported) {
      const fallback = PAYMENT_METHODS.find((m) => methodAvailableIn(m, country.code))?.id;
      if (fallback) {
        setForm((prev) => ({ ...prev, payment_method: fallback }));
        setLastOnlineMethod(fallback);
      } else {
        // Aucun moyen en ligne réellement actif pour ce pays : on bascule
        // proprement sur le paiement à la livraison plutôt que de laisser
        // affiché un moyen qui échouerait à coup sûr.
        setForm((prev) => ({ ...prev, payment_method: "cash_on_delivery" }));
      }
    }
  }, [country?.code]);

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("checkout.signInTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("checkout.signInDesc")}</p>
        <Link
          to="/auth"
          search={{ redirect: "/checkout" }}
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
        >
          {t("checkout.signIn")}
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !submitting && !redirecting) {
    throw redirect({ to: "/cart" });
  }

  const shipping = country?.base_shipping_fee ?? 0;
  const total = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !user) return;
    if (!form.full_name || !form.phone || !form.address || !form.city) {
      toast.error(t("checkout.errorFields"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          country_code: country.code,
          currency_code: country.currency_code,
          subtotal,
          shipping_fee: shipping,
          total,
          payment_method: form.payment_method,
          shipping_full_name: form.full_name,
          shipping_phone: form.phone,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_notes: form.notes || null,
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((it) => ({
          order_id: order.id,
          product_id: it.productId,
          product_name: it.name,
          product_image: it.image,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          line_total: it.unitPrice * it.quantity,
        })),
      );
      if (itemsErr) throw itemsErr;

      clear();

      // Paiement en ligne (Mobile Money / carte) en Côte d'Ivoire : on part
      // réellement chez CinetPay. Pour les autres pays, l'intégration n'est
      // pas encore branchée (voir le mode démo ci-dessous).
      if (paymentMode === "online" && isCinetPaySupportedCountry(country?.code)) {
        try {
          // Le numéro saisi dans le champ spécifique à l'opérateur (s'il est
          // rempli) prime sur le téléphone de livraison — c'est celui que le
          // client vient de confirmer pour CE moyen de paiement précis.
          const phoneOverride = momoNumber.trim() || undefined;
          setRedirecting(true);
          const { paymentUrl } = await initiateCinetPayPaymentFn({
            data: { orderId: order.id, phoneNumber: phoneOverride },
          });
          window.location.href = paymentUrl;
          return;
        } catch (payErr) {
          setRedirecting(false);
          console.error(payErr);
          toast.error(payErr instanceof Error ? payErr.message : t("checkout.errorToast"));
          router.navigate({ to: "/orders/$id", params: { id: order.id } });
          return;
        }
      }

      toast.success(t("checkout.successToast"));
      router.navigate({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      console.error(err);
      toast.error(t("checkout.errorToast"));
    } finally {
      setSubmitting(false);
    }
  }

  if (redirecting) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="font-display text-lg font-semibold text-primary">
          {t("checkout.redirectingTitle")}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">{t("checkout.redirectingDesc")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="motion-safe:animate-[fade-in_0.5s_ease-out_both]">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <span className="h-px w-5 bg-gold" /> {t("checkout.shippingSection")} →{" "}
          {t("checkout.paymentSection")}
        </span>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">{t("checkout.title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-soft motion-safe:animate-[fade-in_0.5s_ease-out_both]"
            style={{ animationDelay: "60ms" }}
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold via-gold/70 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                <Truck className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-primary">
                {t("checkout.shippingSection")}
              </h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label={t("checkout.fullName")}
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
              <Field
                label={t("checkout.phone")}
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+225 …"
              />
              <Field
                label={t("checkout.city")}
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <Field
                label={t("checkout.country")}
                value={country?.name ?? ""}
                onChange={() => {}}
                disabled
              />
              <div className="sm:col-span-2">
                <Field
                  label={t("checkout.address")}
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="group block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-gold">
                    {t("checkout.notes")}
                  </span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  />
                </label>
              </div>
            </div>
          </section>

          <section
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-soft motion-safe:animate-[fade-in_0.5s_ease-out_both]"
            style={{ animationDelay: "120ms" }}
          >
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold via-gold/70 to-transparent" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-bold text-primary">
                  {t("checkout.paymentSection")}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                {paymentMode === "online" ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("checkout.securePayment")}
                  </>
                ) : (
                  <>
                    <Banknote className="h-3.5 w-3.5" /> {t("checkout.codBadge")}
                  </>
                )}
              </span>
            </div>

            {/* Sélecteur : payer en ligne ou à la livraison */}
            <div className="mt-5 inline-flex w-full gap-1 rounded-full border border-border bg-secondary/40 p-1 sm:w-auto">
              <button
                type="button"
                onClick={selectOnlineMode}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 sm:flex-none ${
                  paymentMode === "online"
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                <CreditCard className="h-4 w-4" /> {t("checkout.paymentModeOnline")}
              </button>
              <button
                type="button"
                onClick={selectCodMode}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 sm:flex-none ${
                  paymentMode === "cod"
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                <Banknote className="h-4 w-4" /> {t("checkout.paymentModeCod")}
              </button>
            </div>

            {paymentMode === "online" ? (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m, idx) => {
                    const selected = form.payment_method === m.id;
                    const supported = !country || methodAvailableIn(m, country.code);
                    const label = t(`checkout.payment.${m.id}`);
                    const tagline = t(`checkout.paymentTag.${m.id}`);
                    return (
                      <label
                        key={m.id}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-background p-4 transition-all duration-300 motion-safe:animate-[fade-in_0.5s_ease-out_both] ${
                          selected && supported
                            ? `border-transparent ring-2 ${m.ring} shadow-soft`
                            : supported
                              ? "border-border hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-soft cursor-pointer"
                              : "border-border opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          className="sr-only"
                          checked={selected}
                          disabled={!supported}
                          onChange={() => {
                            if (!supported) return;
                            setLastOnlineMethod(m.id);
                            setForm({ ...form, payment_method: m.id });
                          }}
                        />
                        <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                          {m.logo ? (
                            <img
                              src={m.logo}
                              alt={label}
                              className="h-full max-h-10 w-full max-w-16 object-contain"
                            />
                          ) : (
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${m.bg}`}
                            >
                              {m.badge.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-primary">{label}</div>
                          <div className="text-xs text-muted-foreground">{tagline}</div>
                          {!supported && country && (
                            <div className="mt-0.5 text-[10px] font-medium text-amber-600">
                              {t("checkout.notAvailable", { country: country.name })}
                            </div>
                          )}
                        </div>
                        <div
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-all duration-300 ${selected ? "border-gold bg-gold" : "border-border"}`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-gold-foreground motion-safe:animate-[fade-in_0.2s_ease-out_both]" />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {form.payment_method === "visa" && (
                  <div
                    key="visa"
                    className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("checkout.cardRedirectNote")}
                    </p>
                  </div>
                )}

                {form.payment_method === "orange_money" && (
                  <div
                    key="orange_money"
                    className="mt-5 rounded-2xl border border-dashed border-[#FF7900]/30 bg-[#FF7900]/5 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#FF7900]">
                      {t("checkout.momoNumber", { brand: "Orange Money" })}
                    </label>
                    <input
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border border-[#FF7900]/20 bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-[#FF7900]/50 focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("checkout.momoNoteOrange")}
                    </p>
                  </div>
                )}

                {form.payment_method === "mtn_money" && (
                  <div
                    key="mtn_money"
                    className="mt-5 rounded-2xl border border-dashed border-[#FFCC00]/40 bg-[#FFCC00]/10 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#B38F00]">
                      {t("checkout.momoNumber", { brand: "MTN Mobile Money" })}
                    </label>
                    <input
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+225 05 00 00 00 00"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border border-[#FFCC00]/30 bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-[#B38F00]/60 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]/30"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("checkout.momoNoteMtn")}
                    </p>
                  </div>
                )}

                {form.payment_method === "wave" && (
                  <div
                    key="wave"
                    className="mt-5 rounded-2xl border border-dashed border-[#1DC8F2]/30 bg-[#1DC8F2]/5 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0E8DA8]">
                      {t("checkout.momoNumber", { brand: "Wave" })}
                    </label>
                    <input
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+225 01 00 00 00 00"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border border-[#1DC8F2]/20 bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-[#0E8DA8]/50 focus:outline-none focus:ring-2 focus:ring-[#1DC8F2]/20"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("checkout.momoNoteWave")}
                    </p>
                  </div>
                )}

                {form.payment_method === "moov_money" && (
                  <div
                    key="moov_money"
                    className="mt-5 rounded-2xl border border-dashed border-[#005BAA]/30 bg-[#005BAA]/5 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#005BAA]">
                      {t("checkout.momoNumber", { brand: "Moov Money" })}
                    </label>
                    <input
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+225 06 00 00 00 00"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border border-[#005BAA]/20 bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-[#005BAA]/50 focus:outline-none focus:ring-2 focus:ring-[#005BAA]/20"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("checkout.momoNoteMoov")}
                    </p>
                  </div>
                )}

                {form.payment_method === "tmoney" && (
                  <div
                    key="tmoney"
                    className="mt-5 rounded-2xl border border-dashed border-[#F5A623]/30 bg-[#F5A623]/5 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]"
                  >
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#B37B10]">
                      {t("checkout.momoNumber", { brand: "TMoney" })}
                    </label>
                    <input
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+228 90 00 00 00"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border border-[#F5A623]/20 bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-[#B37B10]/60 focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("checkout.momoNoteTmoney")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 flex items-start gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-5 motion-safe:animate-[fade-in_0.35s_ease-out_both]">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Banknote className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-primary">
                    {t("checkout.codTitle")}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t("checkout.codDesc")}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold" />{" "}
                      {t("checkout.codNote1")}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold" />{" "}
                      {t("checkout.codNote2")}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside
          className="relative h-fit overflow-hidden rounded-2xl border border-border bg-card p-6 motion-safe:animate-[fade-in_0.5s_ease-out_both] lg:sticky lg:top-24"
          style={{ animationDelay: "180ms" }}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold via-gold/70 to-transparent" />
          <h2 className="font-display text-xl font-bold text-primary">{t("checkout.summary")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.productId} className="flex justify-between">
                <span className="text-muted-foreground">
                  {it.name} × {it.quantity}
                </span>
                <span>
                  {country
                    ? formatPrice(
                        it.unitPrice * it.quantity,
                        country.currency_code,
                        country.currency_symbol,
                      )
                    : ""}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("checkout.subtotal")}</dt>
              <dd>
                {country
                  ? formatPrice(subtotal, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("checkout.shipping")}</dt>
              <dd>
                {country
                  ? formatPrice(shipping, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>{t("checkout.total")}</dt>
              <dd className="text-gold">
                {country ? formatPrice(total, country.currency_code, country.currency_symbol) : ""}
              </dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)] disabled:translate-y-0 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t("checkout.submitting") : t("checkout.confirm")}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="group block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors duration-200 group-focus-within:text-gold">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-70"
      />
    </label>
  );
}