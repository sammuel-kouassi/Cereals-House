import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Loader2,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteAnnouncementAdminFn,
  deletePromotionAdminFn,
  listAnnouncementsAdminFn,
  listPromotionsAdminFn,
  setPromotionActiveAdminFn,
  upsertAnnouncementAdminFn,
  upsertPromotionAdminFn,
  type AdminPromotionProduct,
  type Announcement,
} from "@/lib/promotions/promotions.functions";
import {
  MAX_PERCENT_OFF,
  MIN_PERCENT_OFF,
  currencyDecimals,
  discountedPrice,
  promotionStatus,
  type PromotionStatus,
} from "@/lib/promotions/pricing";
import { listProductsFn } from "@/lib/products/products.functions";
import { formatPrice } from "@/lib/format";
import { imageFor } from "@/lib/products-meta";
import { PageLoader } from "@/components/page-loader";
import { AnnouncementCard } from "@/components/announcement-popup";

export const Route = createFileRoute("/admin/promotions")({
  component: AdminPromotionsPage,
});

type Country = Awaited<ReturnType<typeof listPromotionsAdminFn>>["countries"][number];

const STATUS_LABEL: Record<PromotionStatus, string> = {
  active: "En cours",
  scheduled: "Programmée",
  ended: "Terminée",
  paused: "En pause",
};

const STATUS_CLASS: Record<PromotionStatus, string> = {
  active: "text-amber-800 dark:text-gold",
  scheduled: "text-stone-700 dark:text-stone-300",
  ended: "text-stone-500",
  paused: "text-stone-500",
};

const QUICK_PERCENTS = [10, 15, 20, 25, 30, 40];

/* ---------- Dates : <input type="datetime-local"> <-> ISO ---------- */

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/* ---------- Dates du pop-up : <input type="date">, fin de journée ---------- */

function toDateInput(iso: string | null | undefined): string {
  return iso ? toLocalInput(iso).slice(0, 10) : "";
}

/** « 2026-11-03 » -> 3 novembre 23:59 heure locale, en ISO */
function endOfDayIso(date: string): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 0).toISOString();
}

function dateInDays(days: number): string {
  return toLocalInput(new Date(Date.now() + days * 86_400_000).toISOString()).slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return toLocalInput(d.toISOString());
}

function endOfMonth(): string {
  const d = new Date();
  return toLocalInput(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59).toISOString());
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const errorMessage = (err: unknown) => {
  if (!(err instanceof Error)) return "Une erreur est survenue.";
  // Erreurs zod renvoyées en JSON par le serveur : on garde le premier message lisible
  try {
    const parsed = JSON.parse(err.message);
    if (Array.isArray(parsed) && parsed[0]?.message) return parsed[0].message as string;
  } catch {
    // message brut
  }
  return err.message;
};

/* ================================================================== */

function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: () => listPromotionsAdminFn(),
  });
  const [editing, setEditing] = useState<AdminPromotionProduct | null>(null);
  const [search, setSearch] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    // Les prix publics changent aussitôt : on rafraîchit les listes de la boutique
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  if (isLoading || !data) return <PageLoader />;

  const q = search.trim().toLowerCase();
  const products = q
    ? data.products.filter((p) => p.name.toLowerCase().includes(q))
    : data.products;
  const live = data.products.filter(
    (p) => p.promotion && promotionStatus(p.promotion) === "active",
  ).length;

  async function toggle(p: AdminPromotionProduct) {
    if (!p.promotion) return;
    try {
      await setPromotionActiveAdminFn({
        data: { id: p.promotion.id, isActive: !p.promotion.is_active },
      });
      toast.success(
        p.promotion.is_active
          ? "Promotion mise en pause : prix normal rétabli"
          : "Promotion réactivée",
      );
      invalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(p: AdminPromotionProduct) {
    const promo = p.promotion;
    if (!promo) return;
    try {
      await deletePromotionAdminFn({ data: { id: promo.id } });
      invalidate();
      // Pas de confirmation : l'action est réversible depuis le toast
      toast(`Promotion supprimée : ${p.name} revient à son prix normal`, {
        action: {
          label: "Annuler",
          onClick: async () => {
            await upsertPromotionAdminFn({
              data: {
                productId: p.id,
                percentOff: promo.percent_off,
                label: promo.label,
                startsAt: promo.starts_at,
                endsAt: promo.ends_at,
                isActive: promo.is_active,
              },
            });
            invalidate();
          },
        },
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-14">
      {/* ------------------------- Promotions ------------------------- */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-2xl text-primary">Promotions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {live > 0
                ? `${live} promotion${live > 1 ? "s" : ""} en cours.`
                : "Aucune promotion en cours."}{" "}
              Le prix de base n'est jamais modifié : supprimer ou mettre en pause une promotion
              rétablit l'ancien prix aussitôt.
            </p>
          </div>
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
            />
          </label>
        </div>

        <ul className="mt-2 divide-y divide-border">
          {products.map((p) => (
            <PromotionRow
              key={p.id}
              product={p}
              onEdit={() => setEditing(p)}
              onToggle={() => toggle(p)}
              onRemove={() => remove(p)}
            />
          ))}
          {products.length === 0 && (
            <li className="py-12 text-center text-sm text-muted-foreground">
              Aucun produit trouvé.
            </li>
          )}
        </ul>
      </section>

      <AnnouncementsSection />

      <PromotionEditor
        product={editing}
        countries={data.countries}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          invalidate();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PromotionRow({
  product: p,
  onEdit,
  onToggle,
  onRemove,
}: {
  product: AdminPromotionProduct;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const base = p.prices.find((x) => x.country_code === "CI") ?? p.prices[0];
  const promo = p.promotion;
  const status = promo ? promotionStatus(promo) : null;

  return (
    <li className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
      <img
        src={imageFor(p.slug, p.image_url)}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base text-primary">
          {p.name}
          {!p.is_active && (
            <span className="ml-2 text-xs italic text-muted-foreground">(masqué)</span>
          )}
        </p>
        {base ? (
          <p className="mt-0.5 text-sm tabular-nums">
            {promo && status === "active" ? (
              <>
                <span className="text-amber-800 dark:text-gold">
                  {formatPrice(discountedPrice(base.price, promo.percent_off), "FCFA")}
                </span>{" "}
                <s className="text-muted-foreground">{formatPrice(base.price, "FCFA")}</s>
              </>
            ) : (
              <span className="text-muted-foreground">{formatPrice(base.price, "FCFA")}</span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-sm italic text-muted-foreground">Aucun prix configuré</p>
        )}
      </div>

      {promo && status && (
        <div className="order-last w-full text-sm sm:order-none sm:w-56">
          <p className={`italic ${STATUS_CLASS[status]}`}>
            −{promo.percent_off} % · {STATUS_LABEL[status]}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === "scheduled"
              ? `Débute le ${formatDate(promo.starts_at)}`
              : promo.ends_at
                ? `${status === "ended" ? "Terminée le" : "Jusqu'au"} ${formatDate(promo.ends_at)}`
                : "Sans date de fin"}
            {promo.label ? ` · ${promo.label}` : ""}
          </p>
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {promo ? (
          <>
            <IconButton
              label={promo.is_active ? "Mettre en pause" : "Réactiver"}
              onClick={onToggle}
            >
              {promo.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </IconButton>
            <IconButton label="Modifier la promotion" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton label="Supprimer la promotion" onClick={onRemove} danger>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            disabled={!base}
            className="pressable inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <Tag className="h-4 w-4" /> Mettre en promotion
          </button>
        )}
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors cursor-pointer ${
        danger
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */

function EditorShell({
  open,
  title,
  description,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-[0_32px_80px_-24px_rgba(44,27,17,0.45)] outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] sm:p-8 ${
            wide ? "max-w-4xl" : "max-w-lg"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-display text-2xl text-primary">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">
                  {title}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Fermer"
              className="-mr-3 -mt-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none";
const labelClass = "mb-1.5 block text-sm text-foreground";
const chipClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm tabular-nums transition-colors cursor-pointer ${
    active
      ? "border-[#2c1b11] bg-[#2c1b11] text-stone-50 dark:border-gold dark:bg-gold dark:text-stone-950"
      : "border-border hover:border-stone-500"
  }`;

function PromotionEditor({
  product,
  countries,
  onClose,
  onSaved,
}: {
  product: AdminPromotionProduct | null;
  countries: Country[];
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <EditorShell
      open={!!product}
      title={product?.promotion ? "Modifier la promotion" : "Nouvelle promotion"}
      description={product?.name}
      onClose={onClose}
    >
      {/* Remonté à chaque produit : l'état du formulaire repart des bonnes valeurs */}
      {product && (
        <PromotionForm key={product.id} product={product} countries={countries} onSaved={onSaved} />
      )}
    </EditorShell>
  );
}

function PromotionForm({
  product,
  countries,
  onSaved,
}: {
  product: AdminPromotionProduct;
  countries: Country[];
  onSaved: () => void;
}) {
  const promo = product.promotion;
  const [percent, setPercent] = useState(promo ? String(promo.percent_off) : "");
  const [label, setLabel] = useState(promo?.label ?? "");
  const [startsAt, setStartsAt] = useState(toLocalInput(promo?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(promo?.ends_at));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const pct = Number(percent.replace(",", "."));
  const percentError =
    !percent.trim() || Number.isNaN(pct)
      ? "Indiquez un pourcentage."
      : pct < MIN_PERCENT_OFF || pct > MAX_PERCENT_OFF
        ? `Entre ${MIN_PERCENT_OFF} et ${MAX_PERCENT_OFF} %.`
        : null;
  const dateError =
    endsAt && new Date(endsAt) <= new Date()
      ? "Cette date de fin est déjà passée."
      : endsAt && new Date(endsAt) <= new Date(startsAt || Date.now())
        ? "La fin doit être après le début."
        : null;
  const valid = !percentError && !dateError;

  // Aperçu en direct : prix de base -> prix remisé, pour chaque pays configuré
  const preview = useMemo(
    () =>
      product.prices.map((pp) => {
        const c = countries.find((x) => x.code === pp.country_code);
        return {
          ...pp,
          country: c,
          next: valid ? discountedPrice(pp.price, pct, currencyDecimals(c?.currency_code)) : null,
        };
      }),
    [product.prices, countries, pct, valid],
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      await upsertPromotionAdminFn({
        data: {
          productId: product.id,
          percentOff: pct,
          label: label.trim() || null,
          startsAt: fromLocalInput(startsAt),
          endsAt: fromLocalInput(endsAt),
          isActive: true,
        },
      });
      toast.success(`Promotion enregistrée : −${pct} % sur ${product.name}`);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="mt-6 space-y-6">
      <div>
        <label htmlFor="promo-percent" className={labelClass}>
          Remise
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-28">
            <input
              id="promo-percent"
              inputMode="decimal"
              autoFocus
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !!percentError}
              aria-describedby={touched && percentError ? "promo-percent-error" : undefined}
              placeholder="15"
              className={`${fieldClass} pr-9 font-display text-xl tabular-nums ${
                touched && percentError ? "border-red-600 focus:border-red-600" : ""
              }`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              %
            </span>
          </div>
          {QUICK_PERCENTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPercent(String(v))}
              className={chipClass(pct === v)}
            >
              {v} %
            </button>
          ))}
        </div>
        {touched && percentError && (
          <p id="promo-percent-error" className="mt-1.5 text-xs text-red-700 dark:text-red-400">
            {percentError}
          </p>
        )}
      </div>

      {/* Aperçu des prix */}
      <div className="rounded-xl bg-[#f6f0e6] p-4 dark:bg-stone-900/60">
        <p className="mb-2 text-sm italic text-muted-foreground">
          Nouveaux prix affichés en boutique
        </p>
        {preview.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ce produit n'a aucun prix configuré.</p>
        ) : (
          <ul className="space-y-1.5">
            {preview.map((row) => {
              const symbol = row.country?.currency_symbol ?? "FCFA";
              return (
                <li
                  key={row.country_code}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-foreground/80">
                    {row.country?.flag_emoji} {row.country?.name ?? row.country_code}
                  </span>
                  <span className="tabular-nums">
                    {row.next != null ? (
                      <>
                        <s className="mr-2 text-muted-foreground">
                          {formatPrice(row.price, symbol)}
                        </s>
                        <span className="font-display text-base text-amber-800 dark:text-gold">
                          {formatPrice(row.next, symbol)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatPrice(row.price, symbol)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="promo-label" className={labelClass}>
          Libellé <span className="italic text-muted-foreground">(facultatif)</span>
        </label>
        <input
          id="promo-label"
          value={label}
          maxLength={60}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Offre de rentrée"
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Affiché à côté de la remise sur la fiche produit.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="promo-start" className={labelClass}>
            Début
          </label>
          <input
            id="promo-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Vide : immédiatement.</p>
        </div>
        <div>
          <label htmlFor="promo-end" className={labelClass}>
            Fin
          </label>
          <input
            id="promo-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            aria-invalid={!!dateError}
            className={`${fieldClass} ${dateError ? "border-red-600" : ""}`}
          />
          {dateError ? (
            <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{dateError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">Vide : jusqu'à suppression.</p>
          )}
        </div>
      </div>
      <div className="-mt-2 flex flex-wrap gap-2">
        {[
          { label: "7 jours", value: addDays(7) },
          { label: "14 jours", value: addDays(14) },
          { label: "Fin du mois", value: endOfMonth() },
          { label: "Sans fin", value: "" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => setEndsAt(o.value)}
            className={chipClass(endsAt === o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <DialogPrimitive.Close className="rounded-full px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
          Annuler
        </DialogPrimitive.Close>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#2c1b11] px-6 py-2.5 text-sm text-stone-50 transition-colors hover:bg-[#442a1d] disabled:opacity-60 dark:bg-gold dark:text-stone-950 cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
          {promo ? "Enregistrer" : "Lancer la promotion"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pop-up d'annonce                                                    */
/* ------------------------------------------------------------------ */

function AnnouncementsSection() {
  const queryClient = useQueryClient();
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => listAnnouncementsAdminFn(),
  });
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });

  async function toggle(a: Announcement) {
    try {
      await upsertAnnouncementAdminFn({
        data: {
          id: a.id,
          title: a.title,
          message: a.message,
          ctaLabel: a.cta_label,
          ctaUrl: a.cta_url,
          showPromotions: a.show_promotions,
          isActive: !a.is_active,
          startsAt: a.starts_at,
          endsAt: a.ends_at,
        },
      });
      toast.success(
        a.is_active ? "Pop-up désactivé" : "Pop-up activé : il sera montré aux visiteurs",
      );
      invalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function remove(a: Announcement) {
    try {
      await deleteAnnouncementAdminFn({ data: { id: a.id } });
      invalidate();
      toast("Annonce supprimée", {
        action: {
          label: "Annuler",
          onClick: async () => {
            await upsertAnnouncementAdminFn({
              data: {
                title: a.title,
                message: a.message,
                ctaLabel: a.cta_label,
                ctaUrl: a.cta_url,
                showPromotions: a.show_promotions,
                isActive: a.is_active,
                startsAt: a.starts_at,
                endsAt: a.ends_at,
              },
            });
            invalidate();
          },
        },
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-2xl text-primary">Pop-up d'information</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Une fenêtre discrète montrée une seule fois à chaque visiteur, jamais pendant un
            paiement. Une seule annonce peut être active ; modifier l'annonce la remontre à tous.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="pressable inline-flex items-center gap-2 rounded-full bg-[#2c1b11] px-5 py-2.5 text-sm text-stone-50 transition-colors hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Nouvelle annonce
        </button>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : announcements.length === 0 ? (
        <div className="py-12 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune annonce. Créez-en une pour mettre en avant vos promotions ou une information
            importante.
          </p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {announcements.map((a) => {
            const status = promotionStatus(a);
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-primary">{a.title}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{a.message}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className={`italic ${STATUS_CLASS[status]}`}>
                    {status === "active"
                      ? "Visible"
                      : status === "paused"
                        ? "Désactivée"
                        : STATUS_LABEL[status]}
                  </p>
                  {status === "ended" && (
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Date de fin passée : modifiez-la pour la réafficher
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <IconButton
                    label={a.is_active ? "Désactiver" : "Activer"}
                    onClick={() => toggle(a)}
                  >
                    {a.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Modifier" onClick={() => setEditing(a)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Supprimer" onClick={() => remove(a)} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <EditorShell
        open={editing !== null}
        title={editing === "new" ? "Nouvelle annonce" : "Modifier l'annonce"}
        onClose={() => setEditing(null)}
        wide
      >
        {editing !== null && (
          <AnnouncementForm
            key={editing === "new" ? "new" : editing.id}
            announcement={editing === "new" ? null : editing}
            onSaved={() => {
              setEditing(null);
              invalidate();
            }}
          />
        )}
      </EditorShell>
    </section>
  );
}

function AnnouncementForm({
  announcement: a,
  onSaved,
}: {
  announcement: Announcement | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(a?.title ?? "");
  const [message, setMessage] = useState(a?.message ?? "");
  const [ctaLabel, setCtaLabel] = useState(a?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(a?.cta_url ?? "");
  const [showPromotions, setShowPromotions] = useState(a?.show_promotions ?? true);
  const [isActive, setIsActive] = useState(a?.is_active ?? true);
  const [endDate, setEndDate] = useState(toDateInput(a?.ends_at));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Produits en promotion, pour l'aperçu fidèle du pop-up
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
  });

  const errors = {
    title: title.trim().length < 2 ? "Indiquez un titre." : null,
    message: message.trim().length < 2 ? "Indiquez un message." : null,
    ctaUrl:
      ctaUrl.trim() && !(ctaUrl.trim().startsWith("/") || /^https?:\/\//.test(ctaUrl.trim()))
        ? "Le lien doit commencer par / (page du site) ou https://"
        : null,
    // Comparaison de dates « AAAA-MM-JJ » : le dernier jour reste valable jusqu'à 23:59
    endDate:
      endDate && endDate < dateInDays(0)
        ? "Cette date est déjà passée : l'annonce ne serait jamais visible."
        : null,
  };
  const valid = !errors.title && !errors.message && !errors.ctaUrl && !errors.endDate;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      await upsertAnnouncementAdminFn({
        data: {
          id: a?.id,
          title,
          message,
          ctaLabel: ctaLabel || null,
          ctaUrl: ctaUrl || null,
          showPromotions,
          isActive,
          startsAt: a?.starts_at ?? null,
          endsAt: endOfDayIso(endDate),
        },
      });
      toast.success(isActive ? "Annonce publiée" : "Annonce enregistrée (désactivée)");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const err = (k: keyof typeof errors) =>
    touched && errors[k] ? (
      <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors[k]}</p>
    ) : null;

  return (
    <form onSubmit={save} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,24rem)]">
      <div className="space-y-5">
        <div>
          <label htmlFor="ann-title" className={labelClass}>
            Titre
          </label>
          <input
            id="ann-title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Les offres de la semaine"
            className={fieldClass}
          />
          {err("title")}
        </div>
        <div>
          <label htmlFor="ann-message" className={labelClass}>
            Message
          </label>
          <textarea
            id="ann-message"
            rows={3}
            value={message}
            maxLength={400}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Jusqu'à −20 % sur une sélection de farines et céréales, jusqu'à dimanche."
            className={fieldClass}
          />
          {err("message")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ann-cta-label" className={labelClass}>
              Texte du bouton <span className="italic text-muted-foreground">(facultatif)</span>
            </label>
            <input
              id="ann-cta-label"
              value={ctaLabel}
              maxLength={40}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Découvrir les offres"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ann-cta-url" className={labelClass}>
              Lien du bouton <span className="italic text-muted-foreground">(facultatif)</span>
            </label>
            <LinkPicker id="ann-cta-url" value={ctaUrl} onChange={setCtaUrl} products={products} />
            {err("ctaUrl")}
          </div>
        </div>
        <div>
          <label htmlFor="ann-end" className={labelClass}>
            Afficher jusqu'au <span className="italic text-muted-foreground">(inclus)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="ann-end"
              type="date"
              value={endDate}
              min={dateInDays(0)}
              onChange={(e) => setEndDate(e.target.value)}
              aria-invalid={!!errors.endDate}
              className={`${fieldClass} w-auto ${errors.endDate ? "border-red-600" : ""}`}
            />
            {[
              { label: "7 jours", value: dateInDays(7) },
              { label: "14 jours", value: dateInDays(14) },
              { label: "Sans fin", value: "" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setEndDate(o.value)}
                className={chipClass(endDate === o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {/* Montrée sans attendre l'envoi : une date passée rend l'annonce invisible */}
          {errors.endDate ? (
            <p className="mt-1.5 text-xs text-red-700 dark:text-red-400">{errors.endDate}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {endDate
                ? "Visible jusqu'à 23 h 59 ce jour-là."
                : "Visible jusqu'à ce que vous la désactiviez."}
            </p>
          )}
        </div>

        <fieldset className="space-y-3">
          <Toggle
            checked={showPromotions}
            onChange={setShowPromotions}
            label="Montrer les produits en promotion"
            hint="Jusqu'à 3 produits remisés, avec leur prix barré."
          />
          <Toggle
            checked={isActive}
            onChange={setIsActive}
            label="Publier maintenant"
            hint="Désactive automatiquement l'annonce précédente."
          />
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <DialogPrimitive.Close className="rounded-full px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer">
            Annuler
          </DialogPrimitive.Close>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#2c1b11] px-6 py-2.5 text-sm text-stone-50 transition-colors hover:bg-[#442a1d] disabled:opacity-60 dark:bg-gold dark:text-stone-950 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 motion-safe:animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Aperçu fidèle du pop-up */}
      <div>
        <p className="mb-2 text-sm italic text-muted-foreground">Aperçu</p>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[#fbf8f3] shadow-[0_24px_60px_-28px_rgba(44,27,17,0.4)] dark:border-stone-800 dark:bg-[#1c140e]">
          <AnnouncementCard
            preview
            announcement={{
              title: title || "Titre de l'annonce",
              message: message || "Votre message apparaîtra ici.",
              cta_label: ctaLabel || null,
              cta_url: ctaUrl || null,
              show_promotions: showPromotions,
            }}
            products={products}
            onClose={() => {}}
          />
        </div>
      </div>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-[#2c1b11] dark:bg-gold" : "bg-stone-300 dark:bg-stone-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Sélecteur de lien : pages du site et fiches produits                */
/* ------------------------------------------------------------------ */

type LinkOption = { href: string; label: string; group: "Pages" | "Produits"; image?: string };

const SITE_PAGES: LinkOption[] = [
  { href: "/products", label: "Boutique (tous les produits)", group: "Pages" },
  { href: "/", label: "Accueil", group: "Pages" },
  { href: "/about", label: "À propos", group: "Pages" },
  { href: "/contact", label: "Contact", group: "Pages" },
];

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function LinkPicker({
  id,
  value,
  onChange,
  products,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  products: { slug: string; name: string; image_url: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo<LinkOption[]>(
    () => [
      ...SITE_PAGES,
      ...products.map((p) => ({
        href: `/products/${p.slug}`,
        label: p.name,
        group: "Produits" as const,
        image: imageFor(p.slug, p.image_url),
      })),
    ],
    [products],
  );

  // Tant que la valeur correspond exactement à une option, on montre toute la liste
  const selected = options.find((o) => o.href === value);
  const q = selected ? "" : normalize(value.trim());
  const filtered = q
    ? options.filter((o) => normalize(o.label).includes(q) || normalize(o.href).includes(q))
    : options;

  function pick(o: LinkOption) {
    onChange(o.href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + dir + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === "Enter" && open && filtered[active]) {
      e.preventDefault();
      pick(filtered[active]);
    }
  }

  // Échap ferme seulement la liste : écouté en capture sur window, avant que
  // la fenêtre d'édition (Radix, capture sur document) ne se ferme aussi.
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open]);

  const listId = `${id}-list`;

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Choisir une page ou un produit"
        className={fieldClass}
      />
      {selected && (
        <p className="mt-1.5 truncate text-xs italic text-muted-foreground">
          {selected.group === "Produits" ? `Fiche produit : ${selected.label}` : selected.label}
        </p>
      )}

      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-1.5 shadow-[0_16px_40px_-16px_rgba(44,27,17,0.35)] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
          // Garde le focus dans le champ pendant le clic sur une option
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.map((o, i) => {
            const firstOfGroup = i === 0 || filtered[i - 1].group !== o.group;
            return (
              <li key={o.href} role="presentation">
                {firstOfGroup && (
                  <p className="px-2.5 pb-1 pt-2 text-xs italic text-muted-foreground">{o.group}</p>
                )}
                <div
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={o.href === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 ${
                    i === active ? "bg-secondary" : ""
                  }`}
                >
                  {o.image ? (
                    <img
                      src={o.image}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{o.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{o.href}</span>
                  </span>
                  {o.href === value && (
                    <span className="text-xs italic text-amber-800 dark:text-gold">choisi</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
