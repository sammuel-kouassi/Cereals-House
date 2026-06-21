import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";

type PaymentMethod = {
  id: "orange_money" | "wave" | "mtn_money" | "moov_money" | "visa";
  label: string;
  tagline: string;
  countries: string[];
  // brand visuals
  bg: string;
  fg: string;
  ring: string;
  badge: string; // short brand mark
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "orange_money", label: "Orange Money", tagline: "Paiement mobile sécurisé", countries: ["CI","BJ","ML","BF","TG"], bg: "bg-[#FF7900]", fg: "text-white", ring: "ring-[#FF7900]", badge: "orange" },
  { id: "wave",         label: "Wave",         tagline: "Transfert instantané",     countries: ["CI","BJ","ML","BF","TG"], bg: "bg-[#1DC8F2]", fg: "text-white", ring: "ring-[#1DC8F2]", badge: "wave~" },
  { id: "mtn_money",    label: "MTN Mobile Money", tagline: "Réseau MTN",           countries: ["CI","BJ","BF","GH"],      bg: "bg-[#FFCC00]", fg: "text-black", ring: "ring-[#FFCC00]", badge: "MTN" },
  { id: "moov_money",   label: "Moov Money",   tagline: "Paiement Moov Africa",     countries: ["CI","BJ","ML","BF","TG"], bg: "bg-[#005BAA]", fg: "text-white", ring: "ring-[#005BAA]", badge: "moov" },
  { id: "visa",         label: "Carte Visa / Mastercard", tagline: "Paiement par carte bancaire", countries: ["CI","BJ","ML","BF","TG","GH","FR","US"], bg: "bg-gradient-to-br from-slate-800 to-slate-900", fg: "text-white", ring: "ring-slate-800", badge: "VISA" },
];

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
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-primary">Méthode de paiement</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Paiement sécurisé
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {availableMethods.map((m) => {
                const selected = form.payment_method === m.id;
                return (
                  <label
                    key={m.id}
                    className={`group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border bg-background p-4 transition ${
                      selected ? `border-transparent ring-2 ${m.ring} shadow-soft` : "border-border hover:border-gold/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setForm({ ...form, payment_method: m.id })}
                    />
                    <div className={`grid h-14 w-20 shrink-0 place-items-center rounded-xl ${m.bg} ${m.fg} font-bold tracking-tight shadow-sm`}>
                      <span className="text-sm uppercase">{m.badge}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-primary">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.tagline}</div>
                    </div>
                    <div className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? "border-gold bg-gold" : "border-border"}`}>
                      {selected && <span className="h-2 w-2 rounded-full bg-gold-foreground" />}
                    </div>
                  </label>
                );
              })}
            </div>

            {form.payment_method === "visa" && (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Informations de la carte (démo)
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numéro de carte</label>
                    <input disabled placeholder="4242 4242 4242 4242" className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expiration</label>
                    <input disabled placeholder="MM / AA" className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CVC</label>
                    <input disabled placeholder="123" className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {(form.payment_method === "orange_money" || form.payment_method === "mtn_money" || form.payment_method === "moov_money" || form.payment_method === "wave") && (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numéro Mobile Money (démo)</label>
                <input disabled placeholder="+225 07 00 00 00 00" className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                <p className="mt-2 text-xs text-muted-foreground">Vous recevrez une notification sur votre téléphone pour valider le paiement.</p>
              </div>
            )}

            <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              ℹ️ Mode démo — le paiement en ligne sera activé dès la configuration des clés CinetPay. Votre commande sera enregistrée et notre équipe vous contactera.
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
