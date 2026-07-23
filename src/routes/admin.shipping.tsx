import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Truck, Plus, Trash2 } from "lucide-react";
import {
  listCityShippingRatesAdminFn,
  upsertCityShippingRateAdminFn,
  deleteCityShippingRateAdminFn,
} from "@/lib/admin/shipping.functions";
import { listCountriesAdminFn } from "@/lib/admin/countries.functions";
import { PageLoader } from "@/components/page-loader";

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

  const [form, setForm] = useState({ countryCode: "", cityName: "", shippingFee: 0 });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
    // Ce tarif affecte directement le checkout public — on invalide aussi ce
    // cache pour éviter qu'un ancien montant reste affiché aux clients.
    queryClient.invalidateQueries({ queryKey: ["city-shipping-rates"] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.countryCode || !form.cityName.trim()) {
      toast.error("Choisis un pays et indique une ville.");
      return;
    }
    setSaving(true);
    try {
      await upsertCityShippingRateAdminFn({
        data: {
          countryCode: form.countryCode,
          cityName: form.cityName.trim(),
          shippingFee: form.shippingFee,
        },
      });
      toast.success("Tarif enregistré");
      setForm({ countryCode: "", cityName: "", shippingFee: 0 });
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce tarif ? Le pays reviendra à son tarif de base.")) return;
    setDeletingId(id);
    try {
      await deleteCityShippingRateAdminFn({ data: { id } });
      toast.success("Tarif supprimé");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  if (ratesLoading || countriesLoading || !ratesData || !countriesData) return <PageLoader />;

  const countryName = (code: string) =>
    countriesData.countries.find((c) => c.code === code)?.name ?? code;

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Définis un tarif de livraison différent pour une ville précise (ex: Abidjan moins cher que
        le reste de la Côte d'Ivoire). Une ville sans tarif ici utilise le tarif de base du pays,
        réglable dans l'onglet "Pays".
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-4 rounded-2xl border border-gold/30 bg-secondary/20 p-6 sm:grid-cols-4"
      >
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
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ville
          </span>
          <input
            value={form.cityName}
            onChange={(e) => setForm((p) => ({ ...p, cityName: e.target.value }))}
            placeholder="Abidjan"
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Frais de livraison
          </span>
          <input
            type="number"
            min={0}
            value={form.shippingFee}
            onChange={(e) => setForm((p) => ({ ...p, shippingFee: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Pays</th>
              <th className="px-4 py-3 font-semibold">Ville</th>
              <th className="px-4 py-3 font-semibold">Frais de livraison</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {ratesData.rates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Truck className="mx-auto mb-2 h-8 w-8" /> Aucune exception de livraison pour le
                  moment.
                </td>
              </tr>
            )}
            {ratesData.rates.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-primary">{countryName(r.country_code)}</td>
                <td className="px-4 py-3">{r.city_name}</td>
                <td className="px-4 py-3 font-semibold text-gold">{r.shipping_fee}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                    title="Supprimer"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}