import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Globe, Plus, Pencil, EyeOff, X } from "lucide-react";
import {
  listCountriesAdminFn,
  upsertCountryAdminFn,
  deactivateCountryAdminFn,
} from "@/lib/admin/countries.functions";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/admin/countries")({
  component: AdminCountriesPage,
});

type CountryRow = Awaited<ReturnType<typeof listCountriesAdminFn>>["countries"][number];

function AdminCountriesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: () => listCountriesAdminFn(),
  });
  const [editingCode, setEditingCode] = useState<string | "new" | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-countries"] });
    // La liste des pays affectant aussi la boutique publique (sélecteur de
    // pays côté client), on invalide large plutôt que de risquer un cache
    // périmé après une modification depuis l'admin.
    queryClient.invalidateQueries({ queryKey: ["countries"] });
  }

  async function handleDeactivate(code: string) {
    if (!confirm(`Désactiver ${code} ? Il ne sera plus proposé à la commande.`)) return;
    try {
      await deactivateCountryAdminFn({ data: { code } });
      toast.success("Pays désactivé");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (isLoading || !data) return <PageLoader />;

  const editingCountry =
    editingCode && editingCode !== "new"
      ? data.countries.find((c) => c.code === editingCode)
      : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.countries.length} pays configuré(s)</p>
        <button
          type="button"
          onClick={() => setEditingCode("new")}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" /> Nouveau pays
        </button>
      </div>

      {(editingCode === "new" || editingCountry) && (
        <CountryForm
          country={editingCountry ?? null}
          onClose={() => setEditingCode(null)}
          onSaved={() => {
            setEditingCode(null);
            invalidate();
          }}
        />
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Pays</th>
              <th className="px-4 py-3 font-semibold">Devise</th>
              <th className="px-4 py-3 font-semibold">Frais de livraison</th>
              <th className="px-4 py-3 font-semibold">Taux / XOF</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {data.countries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Globe className="mx-auto mb-2 h-8 w-8" /> Aucun pays configuré.
                </td>
              </tr>
            )}
            {data.countries.map((c) => (
              <tr key={c.code} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <span>{c.flag_emoji}</span> {c.name}{" "}
                    <span className="text-xs text-muted-foreground">({c.code})</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.currency_code} ({c.currency_symbol})
                </td>
                <td className="px-4 py-3">
                  {c.base_shipping_fee} {c.currency_symbol}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.fx_rate_from_xof}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      c.is_active
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCode(c.code)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-gold"
                      title="Éditer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {c.is_active && (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(c.code)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                        title="Désactiver"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CountryForm({
  country,
  onClose,
  onSaved,
}: {
  country: CountryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: country?.code ?? "",
    name: country?.name ?? "",
    currency_code: country?.currency_code ?? "",
    currency_symbol: country?.currency_symbol ?? "",
    base_shipping_fee: country?.base_shipping_fee ?? 0,
    flag_emoji: country?.flag_emoji ?? "",
    is_active: country?.is_active ?? true,
    sort_order: country?.sort_order ?? 0,
    fx_rate_from_xof: country?.fx_rate_from_xof ?? 1,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertCountryAdminFn({ data: { ...form, isNew: !country } });
      toast.success(country ? "Pays mis à jour" : "Pays créé");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-2xl border border-gold/30 bg-secondary/20 p-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-primary">
          {country ? "Modifier le pays" : "Nouveau pays"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <TextField
          label="Code pays (ISO 2 lettres)"
          value={form.code}
          onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
          placeholder="CI"
          disabled={!!country}
          required
        />
        <div className="sm:col-span-2">
          <TextField
            label="Nom"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder="Côte d'Ivoire"
            required
          />
        </div>
        <TextField
          label="Code devise (ISO 3 lettres)"
          value={form.currency_code}
          onChange={(v) => setForm({ ...form, currency_code: v.toUpperCase() })}
          placeholder="XOF"
          required
        />
        <TextField
          label="Symbole devise"
          value={form.currency_symbol}
          onChange={(v) => setForm({ ...form, currency_symbol: v })}
          placeholder="FCFA"
          required
        />
        <TextField
          label="Emoji drapeau"
          value={form.flag_emoji ?? ""}
          onChange={(v) => setForm({ ...form, flag_emoji: v })}
          placeholder="🇨🇮"
        />
        <NumberField
          label="Frais de livraison de base"
          value={form.base_shipping_fee}
          onChange={(v) => setForm({ ...form, base_shipping_fee: v })}
        />
        <NumberField
          label="Taux de change / 1 XOF"
          value={form.fx_rate_from_xof}
          onChange={(v) => setForm({ ...form, fx_rate_from_xof: v })}
          step="0.0001"
        />
        <NumberField
          label="Ordre d'affichage"
          value={form.sort_order}
          onChange={(v) => setForm({ ...form, sort_order: v })}
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Actif (proposé à la commande)
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer
      </button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-60"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}
