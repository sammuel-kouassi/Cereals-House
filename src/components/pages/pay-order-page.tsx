import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, Lock } from "lucide-react";
import {
  getPublicQuoteOrderFn,
  initiateGuestQuotePaymentFn,
} from "@/lib/orders/quote-order.functions";
import { checkGuestPaymentStatusFn } from "@/lib/payments/check-status.functions";
import { PAYMENT_METHODS, methodAvailableIn } from "@/lib/payments/payment-methods";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";

export function PayOrderPage({ orderId, token }: { orderId: string; token: string }) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quote-order", orderId, token],
    queryFn: () => getPublicQuoteOrderFn({ data: { orderId, token } }),
    retry: false,
    refetchInterval: (query) => (query.state.data?.paymentStatus === "pending" ? 3000 : false),
  });

  useEffect(() => {
    if (!order || order.paymentStatus !== "pending") return;

    let cancelled = false;
    async function check() {
      try {
        await checkGuestPaymentStatusFn({ data: { orderId, token } });
        if (!cancelled)
          queryClient.invalidateQueries({ queryKey: ["quote-order", orderId, token] });
      } catch (err) {
        console.error("Échec de la vérification active du paiement", err);
      }
    }

    check();
    const interval = window.setInterval(check, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [order?.paymentStatus, orderId, token, queryClient]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error("Choisis un moyen de paiement.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Indique un numéro de téléphone.");
      return;
    }

    setSubmitting(true);
    try {
      const { paymentUrl } = await initiateGuestQuotePaymentFn({
        data: {
          orderId,
          token,
          paymentMethod,
          phoneNumber: phone.trim(),
          email: email.trim() || undefined,
        },
      });
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'initiation du paiement");
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24">
        <PageLoader />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">Lien invalide</h1>
        <p className="mt-2 text-muted-foreground">
          Ce lien de paiement est invalide ou a expiré. Contacte-nous pour en obtenir un nouveau.
        </p>
      </div>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-primary">
          Commande {order.orderNumber} déjà payée
        </h1>
        <p className="mt-2 text-muted-foreground">Merci pour votre confiance !</p>
      </div>
    );
  }

  const availableMethods = PAYMENT_METHODS.filter((m) => methodAvailableIn(m, order.countryCode));

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">
          Facture professionnelle
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pour {order.customerName}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-primary">Récapitulatif</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="text-muted-foreground">
                {it.name} × {it.quantity}
              </span>
              <span>{formatPrice(it.lineTotal, order.currencyCode, order.currencySymbol)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Sous-total</dt>
            <dd>{formatPrice(order.subtotal, order.currencyCode, order.currencySymbol)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Livraison</dt>
            <dd>{formatPrice(order.shippingFee, order.currencyCode, order.currencySymbol)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-gold">
              {formatPrice(order.total, order.currencyCode, order.currencySymbol)}
            </dd>
          </div>
        </dl>
      </div>

      {!order.canPayOnline ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/40 p-5 text-sm text-muted-foreground">
          Le paiement en ligne n'est pas encore disponible pour {order.countryName}. Contacte-nous
          pour convenir d'un autre mode de règlement.
        </div>
      ) : (
        <form onSubmit={handlePay} className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg font-bold text-primary">Payer en ligne</h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {availableMethods.map((m) => {
              const selected = paymentMethod === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
                    selected
                      ? `border-transparent ring-2 ${m.ring}`
                      : "border-border hover:border-gold/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="pm"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <div className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/60 bg-white">
                    {m.logo ? (
                      <img
                        src={m.logo}
                        alt={m.id}
                        className="h-full max-h-8 w-full max-w-12 object-contain"
                      />
                    ) : (
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ${m.bg}`}
                      >
                        {m.badge.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{m.badge}</span>
                </label>
              );
            })}
          </div>

          {paymentMethod && (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Numéro de téléphone
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 …"
                  inputMode="tel"
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Email (pour la confirmation)
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </label>
              {paymentMethod === "visa" && (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Vous entrerez vos informations de carte directement sur la page sécurisée de
                  CinetPay.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !paymentMethod}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Payer {formatPrice(order.total, order.currencyCode, order.currencySymbol)}
          </button>
        </form>
      )}
    </div>
  );
}
