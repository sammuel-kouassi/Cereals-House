import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { createOrderFn } from "@/lib/orders/orders.functions";
import { initiateCinetPayPaymentFn } from "@/lib/payments/cinetpay.functions";
import { isCinetPaySupportedCountry } from "@/lib/payments/supported-countries";
import { PageLoader } from "@/components/page-loader";
import {
  PAYMENT_METHODS,
  methodAvailableIn,
  type PaymentId,
} from "@/lib/payments/payment-methods";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Validation de Commande — Cereals House" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const { country } = useCountry();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const orderPlacedRef = useRef(false);

  const supportedDefault =
    !country || PAYMENT_METHODS.some((m) => methodAvailableIn(m, country.code))
      ? (PAYMENT_METHODS.find((m) => !country || methodAvailableIn(m, country.code))?.id ?? "visa")
      : "cash_on_delivery";

  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    address: "",
    city: "",
    notes: "",
    payment_method: supportedDefault as PaymentId,
  });

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

  const [momoNumber, setMomoNumber] = useState("");

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";
  const currencyCode = country?.currency_code ?? "XOF";

  // Calcul du sous-total
  const subtotal = items.reduce((acc, it) => {
    const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
    const unitPrice = Number(priceObj?.price ?? it.unitPrice ?? 0);
    return acc + unitPrice * Number(it.quantity || 1);
  }, 0);

  const shipping = Number(country?.base_shipping_fee ?? 1500);
  const total = Number(subtotal) + Number(shipping);

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">
          {t("checkout.signInTitle", "Finaliser votre commande")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("checkout.signInDesc", "Veuillez vous connecter ou créer un compte pour suivre l'acheminement de votre colis.")}
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/checkout" }}
          className="mt-6 inline-flex rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90"
        >
          {t("checkout.signIn", "Se connecter / S'inscrire")}
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !submitting && !redirecting && !orderPlacedRef.current) {
    throw redirect({ to: "/cart" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires (nom, téléphone, adresse, ville).");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayloadItems = items.map((it) => {
        const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
        const unitPrice = Number(priceObj?.price ?? it.unitPrice ?? 0);
        const quantity = Number(it.quantity || 1);
        return {
          productId: it.slug,
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
          paymentMethod: form.payment_method,
          shippingFullName: form.full_name.trim(),
          shippingPhone: form.phone.trim(),
          shippingAddress: form.address.trim(),
          shippingCity: form.city.trim(),
          shippingNotes: form.notes.trim() || null,
          items: orderPayloadItems,
        },
      });

      orderPlacedRef.current = true;
      clearCart();

      // En ligne avec CinetPay si disponible
      if (paymentMode === "online" && isCinetPaySupportedCountry(currentCountryCode)) {
        try {
          const phoneOverride = momoNumber.trim() || form.phone.trim();
          setRedirecting(true);
          const { paymentUrl } = await initiateCinetPayPaymentFn({
            data: { orderId: orderRes.id, phoneNumber: phoneOverride },
          });
          window.location.href = paymentUrl;
          return;
        } catch (payErr) {
          setRedirecting(false);
          console.error(payErr);
          toast.error(payErr instanceof Error ? payErr.message : "Erreur de paiement en ligne.");
          router.navigate({ to: "/orders/$id", params: { id: orderRes.id } });
          return;
        }
      }

      toast.success("Commande enregistrée avec succès !");
      router.navigate({ to: "/orders/$id", params: { id: orderRes.id } });
    } catch (err) {
      console.error(err);
      let message = "Une erreur est survenue lors de la commande.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (Array.isArray(parsed) && parsed[0]?.message) {
            message = parsed.map((e: any) => `${e.path?.join(".") || "Champ"}: ${e.message}`).join(", ");
          } else {
            message = err.message;
          }
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="font-display text-lg font-semibold text-primary">
          Redirection vers la passerelle sécurisée Mobile Money...
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Veuillez patienter pendant l'initialisation du paiement sécurisé.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          Étape finale
        </span>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-primary">
          Validation & Paiement de votre Commande
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Section 1 : Adresse de livraison */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-primary">
                  1. Adresse de livraison
                </h2>
                <p className="text-xs text-muted-foreground">Où souhaitez-vous recevoir vos céréales ?</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nom & Prénom"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
                placeholder="Ex: Kouamé Samuel"
              />
              <Field
                label="Numéro de Téléphone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="Ex: +225 07 00 00 00 00"
              />
              <Field
                label="Ville de livraison"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
                placeholder="Ex: Abidjan, Dakar, Bamako..."
              />
              <Field
                label="Pays sélectionné"
                value={country?.name ?? ""}
                onChange={() => {}}
                disabled
              />
              <div className="sm:col-span-2">
                <Field
                  label="Adresse exacte / Quartier / Repère"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  placeholder="Ex: Cocody Angré 8ème tranche, près de la pharmacie..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instructions particulières pour le livreur (optionnel)
                  </span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ex: Appeler à l'arrivée, sonnette rez-de-chaussée..."
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Section 2 : Mode de règlement */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-primary">
                    2. Mode de Règlement
                  </h2>
                  <p className="text-xs text-muted-foreground">Choisissez votre moyen de paiement sécurisé</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> 100% Sécurisé
              </span>
            </div>

            {/* Bascule En ligne vs Livraison */}
            <div className="inline-flex w-full gap-1 rounded-full border border-border bg-secondary/50 p-1 sm:w-auto mb-6">
              <button
                type="button"
                onClick={selectOnlineMode}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  paymentMode === "online"
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                <CreditCard className="h-4 w-4" /> Mobile Money / Carte
              </button>
              <button
                type="button"
                onClick={selectCodMode}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  paymentMode === "cod"
                    ? "bg-gold text-gold-foreground shadow-gold"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                <Banknote className="h-4 w-4" /> Paiement à la livraison
              </button>
            </div>

            {paymentMode === "online" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => {
                  const selected = form.payment_method === m.id;
                  const supported = !country || methodAvailableIn(m, country.code);
                  const label = t(`checkout.payment.${m.id}`, m.name);

                  return (
                    <label
                      key={m.id}
                      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-background p-4 transition-all duration-200 cursor-pointer ${
                        selected && supported
                          ? "border-gold ring-2 ring-gold/40 shadow-soft"
                          : supported
                          ? "border-border hover:border-gold/50"
                          : "border-border opacity-50 cursor-not-allowed"
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
                          setLastOnlineMethod(m.id as any);
                          setForm({ ...form, payment_method: m.id });
                        }}
                      />
                      <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/60 bg-white p-1">
                        {m.logo ? (
                          <img src={m.logo} alt={label} className="h-full w-full object-contain" />
                        ) : (
                          <span className="font-bold text-xs text-primary">{m.name.slice(0, 3)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-primary">{label}</div>
                        <div className="text-[11px] text-muted-foreground">{m.tagline}</div>
                      </div>
                      <div className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? "border-gold bg-gold text-white" : "border-border"}`}>
                        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-start gap-4 rounded-2xl border border-dashed border-gold/30 bg-gold/5 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Banknote className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-base font-bold text-primary">
                    Paiement en espèces à la livraison
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vous réglerez le montant exact directement auprès de notre coursier lors de la remise de votre colis.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Colonne Récapitulatif Panier */}
        <aside className="relative h-fit overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24 space-y-4">
          <h2 className="font-display text-xl font-bold text-primary">
            Récapitulatif de la commande
          </h2>

          <div className="divide-y divide-border text-sm max-h-60 overflow-y-auto">
            {items.map((it) => {
              const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
              const unitPrice = priceObj?.price ?? it.unitPrice ?? 0;

              return (
                <div key={it.slug} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-primary">{it.name}</span>
                    <span className="text-muted-foreground"> × {it.quantity}</span>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatPrice(unitPrice * it.quantity, currencySymbol)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Frais de livraison ({country?.name})</span>
              <span>{formatPrice(shipping, currencySymbol)}</span>
            </div>
            <div className="flex justify-between font-display text-lg font-bold text-primary pt-3 border-t border-border">
              <span>Total à payer</span>
              <span className="text-gold">{formatPrice(total, currencySymbol)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Enregistrement..." : "Confirmer et Commander"}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-gold focus:outline-none disabled:opacity-70"
      />
    </label>
  );
}