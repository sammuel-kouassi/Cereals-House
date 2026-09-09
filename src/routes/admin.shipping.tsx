import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Truck, Plus, Trash2, Edit3, X, CheckCircle2 } from "lucide-react";
import {
  listCityShippingRatesAdminFn,
  upsertCityShippingRateAdminFn,
  deleteCityShippingRateAdminFn,
  type CityShippingRate,
} from "@/lib/admin/shipping.functions";
import { listCountriesAdminFn } from "@/lib/admin/countries.functions";
import { PageLoader } from "@/components/page-loader";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/admin/shipping")({
  component: AdminShippingPage,
});

function AdminShippingPage() {
  const queryClient = useQueryClient();
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ["admin-shipping-rates"],
    queryFn: () => listCityShippingRatesAdminFn(),
  });
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ["admin-countries"],
    queryFn: () => listCountriesAdminFn(),
  });

  const [form, setForm] = useState<{
    id?: string;
    countryCode: string;
    cityName: string;
    shippingFee: number;
  }>({ countryCode: "", cityName: "", shippingFee: 0 });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
    queryClient.invalidateQueries({ queryKey: ["city-shipping-rates"] });
  }

  function handleEdit(rate: CityShippingRate) {
    setForm({
      id: rate.id,
      countryCode: rate.country_code,
      cityName: rate.city_name,
      shippingFee: Number(rate.shipping_fee),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm({ countryCode: "", cityName: "", shippingFee: 0 });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.countryCode || !form.cityName.trim()) {
      toast.error("Veuillez sélectionner un pays et indiquer un nom de ville.");
      return;
    }

    setSaving(true);
    try {
      await upsertCityShippingRateAdminFn({
        data: {
          id: form.id,
          countryCode: form.countryCode,
          cityName: form.cityName.trim(),
          shippingFee: Number(form.shippingFee),
        },
      });
      toast.success(
        form.id ? "Tarif mis à jour avec succès !" : "Tarif de livraison pour la ville enregistré !"
      );
      setForm({ countryCode: "", cityName: "", shippingFee: 0 });
      invalidate();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du tarif.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, cityName: string) {
    if (!confirm(`Supprimer le tarif de livraison pour ${cityName} ? La ville utilisera le tarif de base du pays.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteCityShippingRateAdminFn({ data: { id } });
      toast.success(`Tarif pour ${cityName} supprimé.`);
      if (form.id === id) {
        handleCancelEdit();
      }
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  if (ratesLoading || countriesLoading || !ratesData || !countriesData) return <PageLoader />;

  const getCountry = (code: string) => countriesData.countries.find((c) => c.code === code);
  const selectedCountryObj = getCountry(form.countryCode);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm text-foreground">
        <p className="font-semibold text-primary">Gestion des Frais de Livraison par Ville</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Définissez un tarif préférentiel ou spécifique pour une ville précise (ex : <strong>1 000 FCFA</strong> pour <strong>Abidjan</strong> au lieu du tarif national de 1 500 FCFA). 
          Toute ville non listée ci-dessous utilisera automatiquement le tarif standard du pays (paramétrable dans l'onglet <em>Pays</em>).
        </p>
      </div>

      {/* Formulaire d'ajout / modification */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-gold/30 bg-card p-6 shadow-xs sm:grid-cols-4"
      >
        <div className="sm:col-span-4 flex items-center justify-between pb-2 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {form.id ? `✏️ Modifier le tarif pour : ${form.cityName}` : "➕ Ajouter un tarif de ville"}
          </span>
          {form.id && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Annuler la modification
            </button>
          )}
        </div>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pays *
          </span>
          <select
            value={form.countryCode}
            onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="">Sélectionner un pays…</option>
            {countriesData.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag_emoji ? `${c.flag_emoji} ` : ""}{c.name} ({c.currency_symbol})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ville *
          </span>
          <input
            value={form.cityName}
            onChange={(e) => setForm((p) => ({ ...p, cityName: e.target.value }))}
            placeholder="Ex : Abidjan, Bouaké, Dakar, Paris..."
            required
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Frais de livraison {selectedCountryObj ? `(${selectedCountryObj.currency_symbol})` : "*"}
          </span>
          <div className="relative mt-1">
            <input
              type="number"
              min={0}
              step="any"
              value={form.shippingFee}
              onChange={(e) => setForm((p) => ({ ...p, shippingFee: Number(e.target.value) }))}
              required
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 pr-14"
            />
            {selectedCountryObj && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">
                {selectedCountryObj.currency_symbol}
              </span>
            )}
          </div>
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : form.id ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {form.id ? "Mettre à jour" : "Ajouter le tarif"}
          </button>
        </div>
      </form>

      {/* Liste des tarifs enregistrés */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold" />
            <h3 className="font-display text-base font-bold text-primary">
              Tarifs personnalisés par ville ({ratesData.rates.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Pays</th>
                <th className="px-6 py-3 font-semibold">Ville</th>
                <th className="px-6 py-3 font-semibold">Frais de livraison</th>
                <th className="px-6 py-3 font-semibold">Tarif standard pays</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {ratesData.rates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Truck className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="font-medium text-foreground">Aucun tarif personnalisé par ville</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Toutes les commandes utilisent actuellement les tarifs de base nationaux.
                    </p>
                  </td>
                </tr>
              ) : (
                ratesData.rates.map((r) => {
                  const countryObj = getCountry(r.country_code);
                  const baseFee = countryObj?.base_shipping_fee ?? 0;
                  const isEditing = form.id === r.id;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors hover:bg-secondary/20 ${
                        isEditing ? "bg-gold/10 font-semibold" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-primary">
                        <span className="mr-2 text-base">{countryObj?.flag_emoji || "🌍"}</span>
                        {countryObj?.name ?? r.country_code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {r.city_name}
                      </td>
                      <td className="px-6 py-4 font-bold text-gold">
                        {formatPrice(
                          Number(r.shipping_fee),
                          countryObj?.currency_code ?? "XOF",
                          countryObj?.currency_symbol ?? "FCFA"
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {formatPrice(
                          Number(baseFee),
                          countryObj?.currency_code ?? "XOF",
                          countryObj?.currency_symbol ?? "FCFA"
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(r)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-gold/15 hover:text-gold cursor-pointer"
                            title="Modifier ce tarif"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.city_name)}
                            disabled={deletingId === r.id}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50"
                            title="Supprimer ce tarif"
                          >
                            {deletingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
