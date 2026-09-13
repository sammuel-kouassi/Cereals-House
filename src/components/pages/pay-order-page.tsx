import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck, Lock, MessageCircle, FileText, ExternalLink } from "lucide-react";
import {
  getPublicQuoteOrderFn,
  initiateGuestQuotePaymentFn,
} from "@/lib/orders/quote-order.functions";
import { checkGuestPaymentStatusFn } from "@/lib/payments/check-status.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";

export function PayOrderPage({ orderId, token }: { orderId: string; token: string }) {
  const queryClient = useQueryClient();
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

  async function handlePay() {
    setSubmitting(true);
    try {
      const { paymentUrl } = await initiateGuestQuotePaymentFn({
        data: {
          orderId,
          token,
          email: email.trim() || undefined,
        },
      });
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'accès à Paystack");
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
        <div className="mt-6 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-5 text-sm text-foreground space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le règlement en ligne direct est actuellement réservé à la Côte d'Ivoire. Pour régler votre facture vers <strong>{order.countryName}</strong>, notre service client est à votre disposition sur WhatsApp pour vous orienter vers le moyen le plus rapide (Wave International, Orange Money, virement bancaire ou transfert direct).
          </p>
          <a
            href={`https://wa.me/2250584637219?text=${encodeURIComponent(
              `Bonjour Cereals House, je souhaite régler ma facture ${order.orderNumber} d'un montant de ${formatPrice(
                order.total,
                order.currencyCode,
                order.currencySymbol
              )} pour une livraison vers ${order.countryName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <MessageCircle className="h-4 w-4" />
            Contacter le service client (+225 05 84 63 72 19)
          </a>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gold/30 bg-card/70 backdrop-blur-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gold" />
                <h2 className="font-display text-base sm:text-lg font-bold text-primary">Paiement Sécurisé Paystack</h2>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                100% Sécurisé
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Vous allez être redirigé vers la plate-forme officielle Paystack. Choisissez votre moyen préféré : <strong>Wave, Orange Money, MTN, Moov</strong> ou <strong>Carte bancaire</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">Canaux :</span>
              {["Wave", "Orange Money", "MTN", "Moov", "Carte Bancaire", "Apple Pay"].map((c) => (
                <span key={c} className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground">
                  {c}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold py-4 text-sm font-bold text-gold-foreground shadow-lg hover:bg-gold/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Accès en cours à Paystack...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Payer sur Paystack ({formatPrice(order.total, order.currencyCode, order.currencySymbol)})</span>
                  <ExternalLink className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* Lien Téléchargement Facture PDF */}
          <div className="text-center pt-1">
            <a
              href={`/api/invoices/${order.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-gold transition-colors py-2 px-4 rounded-full border border-border/70 bg-card/40 hover:bg-card hover:border-gold/40"
            >
              <FileText className="h-3.5 w-3.5 text-gold" />
              <span>Télécharger votre facture en version PDF</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
