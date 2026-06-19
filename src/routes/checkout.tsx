import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money", icon: Smartphone, countries: ["CI", "BJ", "ML", "BF", "TG"] },
  { id: "wave", label: "Wave", icon: Smartphone, countries: ["CI", "BJ", "ML", "BF", "TG"] },
  { id: "mtn_money", label: "MTN Money", icon: Smartphone, countries: ["CI", "BJ", "BF", "GH"] },
  { id: "moov_money", label: "Moov Money", icon: Smartphone, countries: ["CI", "BJ", "ML", "BF", "TG"] },
  { id: "visa", label: "Carte Visa / Mastercard", icon: CreditCard, countries: ["CI", "BJ", "ML", "BF", "TG", "GH", "FR", "US"] },
] as const;

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Commande — Cereals House" }] }),
  beforeLoad: ({ context: _context, location }) => {
    // We can't check auth on server here without bearer; redirect from component
    void location;
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { country } = useCountry();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
    payment_method: "orange_money" as (typeof PAYMENT_METHODS)[number]["id"],
  });

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center">Chargement…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-primary">Connectez-vous</h1>
        <p className="mt-2 text-muted-foreground">Vous devez avoir un compte pour finaliser votre commande.</p>
        <Link
          to="/auth"
          search={{ redirect: "/checkout" }}
          className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold hover:bg-gold/90"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    throw redirect({ to: "/cart" });
  }

  const shipping = country?.base_shipping_fee ?? 0;
  const total = subtotal + shipping;
  const availableMethods = PAYMENT_METHODS.filter((m) => !country || (m.countries as readonly string[]).includes(country.code));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !user) return;
    if (!form.full_name || !form.phone || !form.address || !form.city) {
      toast.error("Veuillez remplir tous les champs obligatoires");
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
      toast.success("Commande enregistrée ! Vous allez être redirigé vers le suivi.");
      router.navigate({ to: "/orders/$id", params: { id: order.id } });
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary">Finaliser ma commande</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold text-primary">Informations de livraison</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nom complet *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Téléphone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+225 …" />
              <Field label="Ville *" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <Field label="Pays" value={`${country?.flag_emoji ?? ""} ${country?.name ?? ""}`} onChange={() => {}} disabled />
              <div className="sm:col-span-2">
                <Field label="Adresse *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold text-primary">Méthode de paiement</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {availableMethods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    form.payment_method === m.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={form.payment_method === m.id}
                    onChange={() => setForm({ ...form, payment_method: m.id })}
                  />
                  <m.icon className="h-5 w-5 text-gold" />
                  <span className="font-medium">{m.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              ℹ️ Le paiement en ligne sera activé dès que les clés CinetPay seront configurées. Pour le moment, votre commande sera enregistrée et notre équipe vous contactera pour finaliser le paiement.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold text-primary">Récapitulatif</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.productId} className="flex justify-between">
                <span className="text-muted-foreground">{it.name} × {it.quantity}</span>
                <span>{country ? formatPrice(it.unitPrice * it.quantity, country.currency_code, country.currency_symbol) : ""}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Sous-total</dt><dd>{country ? formatPrice(subtotal, country.currency_code, country.currency_symbol) : ""}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Livraison</dt><dd>{country ? formatPrice(shipping, country.currency_code, country.currency_symbol) : ""}</dd></div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd className="text-gold">{country ? formatPrice(total, country.currency_code, country.currency_symbol) : ""}</dd></div>
          </dl>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 disabled:opacity-50"
          >
            {submitting ? "Envoi…" : "Confirmer la commande"}
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
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none disabled:opacity-70"
      />
    </label>
  );
}
