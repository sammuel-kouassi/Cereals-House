import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home as HomeIcon,
  MapPin,
  CreditCard,
  Copy,
  PhoneCall,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getOrderByIdFn } from "@/lib/orders/orders.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";

const FLOW = [
  { key: "pending_payment", label: "Commande enregistrée", icon: Clock },
  { key: "paid", label: "Paiement validé", icon: Check },
  { key: "preparing", label: "En préparation", icon: Package },
  { key: "shipped", label: "Expédiée", icon: Truck },
  { key: "in_transit", label: "En cours d'acheminement", icon: Truck },
  { key: "delivered", label: "Livrée chez vous", icon: HomeIcon },
] as const;

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: "Détails de Commande — Cereals House" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => getOrderByIdFn({ data: { orderId: id } }),
    refetchInterval: (query) => {
      const order = query.state.data?.order;
      if (!order) return false;
      return order.status === "pending_payment" ? 4000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <PageLoader />
      </div>
    );
  }

  const order = data?.order;
  const items = data?.items ?? [];
  const history = data?.history ?? [];

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">
          Commande introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le numéro de commande renseigné n'existe pas.
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold"
        >
          Voir mes commandes
        </Link>
      </div>
    );
  }

  const currencySymbol = order.currency_symbol || order.currency_code || "FCFA";

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    toast.success("Numéro de commande copié !");
  };

  // Déterminer l'étape active dans le pipeline
  const currentStepIndex = FLOW.findIndex((step) => step.key === order.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* En-tête de commande */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
              Commande {order.order_number}
            </h1>
            <button
              type="button"
              onClick={copyOrderNumber}
              className="text-muted-foreground hover:text-primary transition p-1 cursor-pointer"
              title="Copier le numéro de commande"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Passée le {new Date(order.created_at).toLocaleDateString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/2250700000000?text=Bonjour%20Cereals%20House,%20j'ai%20une%20question%20sur%20ma%20commande%20${order.order_number}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-primary transition hover:border-gold hover:text-gold"
          >
            <PhoneCall className="h-3.5 w-3.5" /> Support WhatsApp
          </a>
        </div>
      </div>

      {/* Pipeline visuel de suivi */}
      <div className="my-10 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <h2 className="font-display text-lg font-bold text-primary mb-6">
          Suivi de votre livraison
        </h2>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {FLOW.map((step, idx) => {
            const isCompleted = idx <= activeStep;
            const isCurrent = idx === activeStep;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "bg-gold text-gold-foreground ring-4 ring-gold/20 scale-110 shadow-gold"
                      : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2.5 text-xs font-semibold ${
                    isCurrent ? "text-gold font-bold" : isCompleted ? "text-primary" : "text-muted-foreground/70"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne Détails articles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
            <h2 className="font-display text-lg font-bold text-primary mb-4">
              Articles commandés ({items.length})
            </h2>

            <div className="divide-y divide-border">
              {items.map((it: any) => (
                <div key={it.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-secondary overflow-hidden">
                      {it.product_image ? (
                        <img src={it.product_image} alt={it.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">CH</div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-primary">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity} × {formatPrice(Number(it.unit_price), currencySymbol)}
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-sm text-primary">
                    {formatPrice(Number(it.line_total), currencySymbol)}
                  </span>
                </div>
              ))}
            </div>

            {/* Récapitulatif financier */}
            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatPrice(Number(order.subtotal), currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frais de livraison ({order.country_name || order.country_code})</span>
                <span>{formatPrice(Number(order.shipping_fee), currencySymbol)}</span>
              </div>
              <div className="flex justify-between font-display text-lg font-bold text-primary pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-gold">{formatPrice(Number(order.total), currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Adresse & Coordonnées */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" /> Adresse de livraison
            </h2>

            <div className="text-sm space-y-1 text-foreground/80">
              <div className="font-bold text-primary">{order.shipping_full_name}</div>
              <div>{order.shipping_phone}</div>
              <div>{order.shipping_address}</div>
              <div>{order.shipping_city}, {order.country_name || order.country_code}</div>
              {order.shipping_notes && (
                <div className="text-xs text-muted-foreground mt-2 italic bg-secondary/60 p-2.5 rounded-lg">
                  Notes : {order.shipping_notes}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Moyen de règlement
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary capitalize">
                <CreditCard className="h-4 w-4 text-gold" />
                {order.payment_method?.replace(/_/g, " ") || "À la livraison"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
