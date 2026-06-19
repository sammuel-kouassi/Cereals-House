import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Panier — Cereals House" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { country } = useCountry();
  const shipping = country?.base_shipping_fee ?? 0;
  const total = subtotal + (items.length > 0 ? shipping : 0);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-primary">Votre panier est vide</h1>
        <p className="mt-2 text-muted-foreground">Découvrez nos céréales et trouvez votre bonheur.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold hover:bg-gold/90"
        >
          Voir la boutique <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary">Votre panier</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map((it) => (
            <li key={it.productId} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
              <img src={it.image} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col">
                <Link to="/products/$slug" params={{ slug: it.slug }} className="font-display text-lg font-semibold text-primary hover:text-gold">
                  {it.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {country ? formatPrice(it.unitPrice, country.currency_code, country.currency_symbol) : ""} / kg
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button onClick={() => setQty(it.productId, it.quantity - 1)} className="grid h-9 w-9 place-items-center" aria-label="−">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                    <button onClick={() => setQty(it.productId, it.quantity + 1)} className="grid h-9 w-9 place-items-center" aria-label="+">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">
                      {country ? formatPrice(it.unitPrice * it.quantity, country.currency_code, country.currency_symbol) : ""}
                    </span>
                    <button onClick={() => remove(it.productId)} className="text-muted-foreground hover:text-destructive" aria-label="Retirer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold text-primary">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sous-total</dt>
              <dd>{country ? formatPrice(subtotal, country.currency_code, country.currency_symbol) : ""}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Livraison ({country?.name})</dt>
              <dd>{country ? formatPrice(shipping, country.currency_code, country.currency_symbol) : ""}</dd>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="text-gold">{country ? formatPrice(total, country.currency_code, country.currency_symbol) : ""}</dd>
            </div>
          </dl>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold hover:bg-gold/90"
          >
            Passer la commande <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/products"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-gold"
          >
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}
