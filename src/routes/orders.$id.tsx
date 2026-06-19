import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, Package, Truck, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

const FLOW = [
  { key: "pending_payment", label: "Commande reçue", icon: Clock },
  { key: "paid", label: "Paiement confirmé", icon: Check },
  { key: "preparing", label: "En préparation", icon: Package },
  { key: "shipped", label: "Expédiée", icon: Truck },
  { key: "in_transit", label: "En cours de livraison", icon: Truck },
  { key: "delivered", label: "Livrée", icon: HomeIcon },
] as const;

const SYMBOLS: Record<string, string> = { XOF: "FCFA", EUR: "€", USD: "$", GHS: "₵" };

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*), order_status_history(*)")
        .eq("id", id)
        .maybeSingle();
      return order;
    },
  });

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-20 text-center">Chargement…</div>;
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-20 text-center">Commande introuvable. <Link to="/orders" className="text-gold">Mes commandes</Link></div>;

  const currentIdx = FLOW.findIndex((s) => s.key === data.status);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-gold">← Mes commandes</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{data.order_number}</h1>
          <p className="text-sm text-muted-foreground">Passée le {new Date(data.created_at).toLocaleString("fr-FR")}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="font-display text-2xl font-bold text-gold">
            {formatPrice(Number(data.total), data.currency_code, SYMBOLS[data.currency_code] ?? data.currency_code)}
          </div>
        </div>
      </div>

      {/* Tracking */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-primary">Suivi de la livraison</h2>
        <ol className="mt-6 space-y-5">
          {FLOW.map((step, i) => {
            const done = i <= currentIdx && currentIdx !== -1;
            const active = i === currentIdx;
            return (
              <li key={step.key} className="flex gap-4">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                    done ? "bg-gold text-gold-foreground" : "bg-secondary text-muted-foreground"
                  } ${active ? "ring-4 ring-gold/30" : ""}`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 border-b border-dashed border-border pb-5 last:border-0">
                  <div className={`font-semibold ${done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</div>
                  {active && <div className="mt-1 text-xs text-gold">En cours</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-primary">Articles</h2>
          <ul className="mt-4 space-y-3">
            {data.order_items?.map((it) => (
              <li key={it.id} className="flex items-center gap-3 text-sm">
                {it.product_image && <img src={it.product_image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                <div className="flex-1">
                  <div className="font-medium">{it.product_name}</div>
                  <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                </div>
                <div className="font-semibold">
                  {formatPrice(Number(it.line_total), data.currency_code, SYMBOLS[data.currency_code] ?? data.currency_code)}
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Sous-total</dt><dd>{formatPrice(Number(data.subtotal), data.currency_code, SYMBOLS[data.currency_code] ?? data.currency_code)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Livraison</dt><dd>{formatPrice(Number(data.shipping_fee), data.currency_code, SYMBOLS[data.currency_code] ?? data.currency_code)}</dd></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border"><dt>Total</dt><dd className="text-gold">{formatPrice(Number(data.total), data.currency_code, SYMBOLS[data.currency_code] ?? data.currency_code)}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-primary">Livraison</h2>
          <div className="mt-3 text-sm">
            <div className="font-medium">{data.shipping_full_name}</div>
            <div className="text-muted-foreground">{data.shipping_phone}</div>
            <div className="mt-2">{data.shipping_address}</div>
            <div>{data.shipping_city}, {data.country_code}</div>
            {data.shipping_notes && <p className="mt-3 text-muted-foreground italic">"{data.shipping_notes}"</p>}
          </div>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Paiement</h3>
          <div className="mt-1 text-sm">
            {data.payment_method ?? "—"} · <span className="text-muted-foreground">{data.payment_status}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
