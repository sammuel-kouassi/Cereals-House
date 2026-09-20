import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Copy, MessageCircle, FileText, ExternalLink, Mail } from "lucide-react";
import { createQuoteOrderAdminFn } from "@/lib/orders/quote-order.functions";
import { listCountriesAdminFn } from "@/lib/admin/countries.functions";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/admin/invoice")({
  component: AdminInvoicePage,
});

type LineItem = { name: string; quantity: number; unitPrice: number };

function AdminInvoicePage() {
  const { data: countriesData, isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: () => listCountriesAdminFn(),
  });

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    countryCode: "",
    city: "",
    address: "",
    notes: "",
    shippingFee: 0,
  });
  const [items, setItems] = useState<LineItem[]>([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    orderNumber: string;
    paymentLink: string;
    pdfUrl: string;
    emailSent?: boolean;
  } | null>(null);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = subtotal + form.shippingFee;

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim() || !form.countryCode || !form.city.trim()) {
      toast.error("Merci de remplir au moins le nom, le téléphone, le pays et la ville.");
      return;
    }
    const validItems = items.filter((it) => it.name.trim() && it.quantity > 0 && it.unitPrice > 0);
    if (validItems.length === 0) {
      toast.error("Ajoute au moins un article valide (nom, quantité, prix unitaire).");
      return;
    }

    setSaving(true);
    try {
      const res = await createQuoteOrderAdminFn({
        data: {
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          countryCode: form.countryCode,
          city: form.city.trim(),
          address: form.address.trim() || form.city.trim(),
          notes: form.notes.trim() || undefined,
          items: validItems,
          shippingFee: form.shippingFee,
        },
      });
      setResult({
        orderNumber: res.orderNumber,
        paymentLink: res.paymentLink,
        pdfUrl: res.pdfUrl,
        emailSent: res.emailSent,
      });
      toast.success("Facture créée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création de la facture");
    } finally {
      setSaving(false);
    }
  }

  function handleNewInvoice() {
    setResult(null);
    setForm({
      customerName: "",
      phone: "",
      email: "",
      countryCode: "",
      city: "",
      address: "",
      notes: "",
      shippingFee: 0,
    });
    setItems([{ name: "", quantity: 1, unitPrice: 0 }]);
  }

  if (isLoading || !countriesData) return <PageLoader />;

  if (result) {
    const fullPdfUrl = result.pdfUrl.startsWith("http")
      ? result.pdfUrl
      : `${window.location.origin}${result.pdfUrl}`;

    const whatsappText = encodeURIComponent(
      `Bonjour ${form.customerName}, Cereals House vous remercie pour votre commande !\n\nVoici votre facture officielle ${result.orderNumber} d'un montant de ${total.toLocaleString("fr-FR")} FCFA.\n\n📄 Votre facture en PDF à télécharger :\n${fullPdfUrl}\n\n💳 Régler directement sur GeniusPay (Mobile Money / Carte) :\n${result.paymentLink}\n\n${
        result.emailSent
          ? "Un email récapitulatif avec votre facture PDF jointe vous a également été envoyé automatiquement.\n\n"
          : ""
      }Pour toute question, nous restons à votre disposition !`,
    );

    const cleanPhone = form.phone.replace(/[^0-9]/g, "");
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${whatsappText}` : `https://wa.me/?text=${whatsappText}`;

    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gold/30 bg-secondary/20 p-8 text-center space-y-4">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <FileText className="h-7 w-7" />
        </div>
        <h2 className="font-display text-xl font-bold text-primary">
          Facture {result.orderNumber} créée
        </h2>
        <p className="text-sm text-muted-foreground">
          La commande a été enregistrée. Le client peut payer directement sur GeniusPay et télécharger son reçu PDF.
        </p>

        {result.emailSent && (
          <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Mail className="w-3.5 h-3.5" />
            <span>Facture PDF envoyée automatiquement par email au client</span>
          </div>
        )}

        {/* Détails et liens */}
        <div className="rounded-xl border border-border bg-background p-4 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Facture PDF :</span>
            <a
              href={result.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-gold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir / Télécharger le PDF
            </a>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-muted-foreground">Lien GeniusPay direct :</span>
            <div className="flex items-center gap-2">
              <a
                href={result.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.paymentLink);
                  toast.success("Lien GeniusPay copié !");
                }}
                className="inline-flex items-center gap-1 font-semibold text-gold hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> Envoyer par WhatsApp (Lien GeniusPay + PDF)
          </a>
          <button
            type="button"
            onClick={handleNewInvoice}
            className="flex-1 rounded-xl border border-border px-5 py-3 text-xs font-semibold text-foreground/80 transition-all duration-300 hover:bg-secondary"
          >
            Créer une autre facture
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Après négociation d'un devis (WhatsApp, téléphone…), crée la facture ici pour générer un
        lien de paiement sécurisé — le client paie en ligne directement sur le site, sans avoir
        besoin de créer de compte.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-primary">Client</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nom complet"
              value={form.customerName}
              onChange={(v) => setForm((p) => ({ ...p, customerName: v }))}
              required
            />
            <TextField
              label="Téléphone"
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="+225 …"
              required
            />
            <TextField
              label="Email (recommandé, pour la confirmation)"
              value={form.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              type="email"
            />
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pays
              </span>
              <select
                value={form.countryCode}
                onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                <option value="">Choisir…</option>
                {countriesData.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Ville"
              value={form.city}
              onChange={(v) => setForm((p) => ({ ...p, city: v }))}
              required
            />
            <TextField
              label="Adresse"
              value={form.address}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-primary">Articles</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-all duration-300 hover:border-gold/40"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_100px_140px_32px]">
                <input
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Nom de l'article"
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  placeholder="Qté"
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <input
                  type="number"
                  min={0}
                  value={it.unitPrice}
                  onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                  placeholder="Prix unitaire"
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="grid place-items-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <TextField
              label="Frais de livraison"
              type="number"
              value={String(form.shippingFee)}
              onChange={(v) => setForm((p) => ({ ...p, shippingFee: Number(v) }))}
            />
            <div className="flex items-end justify-end gap-2 text-sm">
              <span className="text-muted-foreground">Sous-total : {subtotal}</span>
              <span className="font-display text-xl font-bold text-gold">Total : {total}</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Notes (optionnel)
              </span>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer la facture et le lien de paiement
        </button>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}
