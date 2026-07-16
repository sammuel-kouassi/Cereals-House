import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, Plus, Pencil, Trash2, X, Upload, ImageOff } from "lucide-react";
import {
  listProductsAdminFn,
  upsertProductAdminFn,
  deleteProductAdminFn,
  upsertProductPriceAdminFn,
  updateProductStockAdminFn,
} from "@/lib/admin/products.functions";
import { formatPrice } from "@/lib/format";
import { PageLoader } from "@/components/page-loader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

type ProductRow = Awaited<ReturnType<typeof listProductsAdminFn>>["products"][number];
type CountryRow = Awaited<ReturnType<typeof listProductsAdminFn>>["countries"][number];

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listProductsAdminFn(),
  });
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function handleStockSave(productId: string) {
    const stock = stockDrafts[productId];
    if (stock === undefined) return;
    setSavingStockId(productId);
    try {
      await updateProductStockAdminFn({ data: { productId, stock } });
      toast.success("Stock mis à jour");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingStockId(null);
    }
  }

  async function handleToggle(product: ProductRow, field: "is_active" | "is_featured") {
    try {
      await upsertProductAdminFn({
        data: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          short_description: product.short_description,
          category: product.category,
          image_url: product.image_url,
          unit: product.unit,
          stock: product.stock,
          is_active: field === "is_active" ? !product.is_active : product.is_active,
          is_featured: field === "is_featured" ? !product.is_featured : product.is_featured,
        },
      });
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Désactiver ce produit ? Il ne sera plus visible en boutique.")) return;
    try {
      await deleteProductAdminFn({ data: { id } });
      toast.success("Produit désactivé");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  }

  if (isLoading || !data) return <PageLoader />;

  const editingProduct =
    editingId && editingId !== "new" ? data.products.find((p) => p.id === editingId) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data.products.length} produit(s)</p>
        <button
          type="button"
          onClick={() => setEditingId("new")}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" /> Nouveau produit
        </button>
      </div>

      {(editingId === "new" || editingProduct) && (
        <ProductForm
          product={editingProduct ?? null}
          countries={data.countries}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            invalidate();
          }}
        />
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Produit</th>
              <th className="px-4 py-3 font-semibold">Catégorie</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Actif</th>
              <th className="px-4 py-3 font-semibold">Vedette</th>
              <th className="px-4 py-3 font-semibold">Prix</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {data.products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8" /> Aucun produit pour le moment.
                </td>
              </tr>
            )}
            {data.products.map((p) => {
              const draft = stockDrafts[p.id] ?? p.stock;
              const dirty = draft !== p.stock;
              return (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-primary">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={draft}
                        onChange={(e) =>
                          setStockDrafts((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))
                        }
                        className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                      />
                      {dirty && (
                        <button
                          type="button"
                          onClick={() => handleStockSave(p.id)}
                          disabled={savingStockId === p.id}
                          className="rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground"
                        >
                          {savingStockId === p.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "OK"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={p.is_active}
                      onChange={() => handleToggle(p, "is_active")}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={p.is_featured}
                      onChange={() => handleToggle(p, "is_featured")}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.product_prices.length === 0
                      ? "Aucun prix"
                      : p.product_prices
                          .map((pp) => {
                            const c = data.countries.find((c) => c.code === pp.country_code);
                            return `${pp.country_code} ${formatPrice(Number(pp.price), c?.currency_code ?? "", c?.currency_symbol ?? "")}`;
                          })
                          .join(" · ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-gold"
                        title="Éditer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                        title="Désactiver"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-gold" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function ProductForm({
  product,
  countries,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  countries: CountryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    short_description: product?.short_description ?? "",
    category: product?.category ?? "",
    image_url: product?.image_url ?? "",
    unit: product?.unit ?? "kg",
    stock: product?.stock ?? 0,
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    weight_g: product?.weight_g ?? 0,
    target_audience: product?.target_audience ?? "",
    composition: product?.composition ?? "",
    benefits: product?.benefits ?? "",
    preparation: product?.preparation ?? "",
  });
  // Champ libre séparé par virgules dans l'UI (ex: "enfant, adulte"),
  // converti en tableau juste avant l'envoi au serveur.
  const [audiencesInput, setAudiencesInput] = useState((product?.audiences ?? []).join(", "));
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      (product?.product_prices ?? []).map((pp) => [pp.country_code, String(pp.price)]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier ensuite
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Merci de choisir un fichier image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (5 Mo maximum).");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const safeSlug = (form.slug || "produit").replace(/[^a-z0-9-]/g, "");
      const path = `${safeSlug}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("products")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      setForm((prev) => ({ ...prev, image_url: pub.publicUrl }));
      toast.success("Image envoyée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi de l'image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { id } = await upsertProductAdminFn({
        data: {
          id: product?.id,
          ...form,
          audiences: audiencesInput
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        },
      });

      // Enregistre chaque prix pays renseigné (les champs vides sont ignorés).
      for (const country of countries) {
        const raw = prices[country.code];
        if (raw === undefined || raw.trim() === "") continue;
        const price = Number(raw);
        if (!Number.isFinite(price) || price <= 0) continue;
        await upsertProductPriceAdminFn({
          data: { productId: id, countryCode: country.code, price },
        });
      }

      toast.success(product ? "Produit mis à jour" : "Produit créé");
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
          {product ? "Modifier le produit" : "Nouveau produit"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nom"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormField
          label="Slug (URL)"
          value={form.slug}
          onChange={(v) => setForm({ ...form, slug: v })}
          placeholder="mil-perle-premium"
          required
        />
        <FormField
          label="Catégorie"
          value={form.category ?? ""}
          onChange={(v) => setForm({ ...form, category: v })}
        />
        <FormField
          label="Unité"
          value={form.unit}
          onChange={(v) => setForm({ ...form, unit: v })}
          placeholder="kg"
        />
        <div className="sm:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Image du produit
          </span>
          <div className="mt-1 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/40">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition-all duration-200 hover:border-gold hover:text-gold">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Envoi en cours…" : "Choisir une image depuis mon ordinateur"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <input
                value={form.image_url ?? ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="…ou colle une URL d'image existante"
                className="w-full rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
          </div>
        </div>
        <FormField
          label="Stock initial"
          type="number"
          value={String(form.stock)}
          onChange={(v) => setForm({ ...form, stock: Number(v) })}
        />
        <div className="sm:col-span-2">
          <FormField
            label="Description courte"
            value={form.short_description ?? ""}
            onChange={(v) => setForm({ ...form, short_description: v })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description complète
          </label>
          <textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fiche technique (affichée sur la page produit)
        </h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Poids (grammes)"
            type="number"
            value={String(form.weight_g)}
            onChange={(v) => setForm({ ...form, weight_g: Number(v) })}
          />
          <FormField
            label="Public cible"
            value={form.target_audience ?? ""}
            onChange={(v) => setForm({ ...form, target_audience: v })}
            placeholder="Adultes et enfants dès 3 ans"
          />
          <FormField
            label="Tags de filtrage (séparés par virgule)"
            value={audiencesInput}
            onChange={setAudiencesInput}
            placeholder="enfant, adulte"
          />
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Composition
            </label>
            <textarea
              rows={2}
              value={form.composition ?? ""}
              onChange={(e) => setForm({ ...form, composition: e.target.value })}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bienfaits
            </label>
            <textarea
              rows={2}
              value={form.benefits ?? ""}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Préparation
            </label>
            <textarea
              rows={2}
              value={form.preparation ?? ""}
              onChange={(e) => setForm({ ...form, preparation: e.target.value })}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Actif (visible en boutique)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
          />
          Mis en avant
        </label>
      </div>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Prix par pays
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {countries.map((c) => (
            <div key={c.code}>
              <label className="text-[11px] font-medium text-muted-foreground">
                {c.name} ({c.currency_code})
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={prices[c.code] ?? ""}
                onChange={(e) => setPrices((prev) => ({ ...prev, [c.code]: e.target.value }))}
                placeholder="—"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
          ))}
        </div>
      </div>

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

function FormField({
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
