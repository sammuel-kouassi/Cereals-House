import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer as DrawerPrimitive } from "vaul";
import { getActiveAnnouncementFn, type Announcement } from "@/lib/promotions/promotions.functions";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { useCountry } from "@/lib/country-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { imageFor } from "@/lib/products-meta";
import { PriceTag, resolvePrice } from "@/components/price-tag";

const SEEN_KEY = "ch_announcement_seen";
const DELAY_MS = 2500;
const MAX_WAIT_MS = 6000;
// Pas d'interruption pendant un achat, une connexion ou dans l'admin
const QUIET_PATHS = /\/(checkout|pay|auth|admin)(\/|$)/;

type CardProps = {
  announcement: Pick<
    Announcement,
    "title" | "message" | "cta_label" | "cta_url" | "show_promotions"
  >;
  products: ProductItem[];
  onClose: () => void;
  /** Aperçu dans l'admin : liens inactifs */
  preview?: boolean;
};

/** Contenu du pop-up, partagé entre la boutique et l'aperçu de l'admin. */
export function AnnouncementCard({ announcement, products, onClose, preview }: CardProps) {
  const { t } = useTranslation();
  const { country } = useCountry();
  const { getLocalizedPath } = useLanguageNavigation();
  const countryCode = country?.code ?? "CI";
  const symbol = country?.currency_symbol ?? "FCFA";
  const onSale = announcement.show_promotions
    ? products.filter((p) => p.promotion).slice(0, 3)
    : [];
  const ctaUrl = announcement.cta_url || (onSale.length > 0 ? "/products" : null);
  const ctaLabel =
    announcement.cta_label || (ctaUrl ? t("promo.discover", "Découvrir les offres") : null);
  const isExternal = ctaUrl ? /^https?:\/\//.test(ctaUrl) : false;

  const ctaClass =
    "pressable group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2c1b11] px-6 py-3 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950";

  return (
    <div className="relative">
      <div className="px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
        <h2 className="pr-10 [overflow-wrap:anywhere] font-display text-[1.7rem] leading-tight text-stone-950 dark:text-stone-50">
          {announcement.title}
        </h2>
        <p className="mt-3 whitespace-pre-line [overflow-wrap:anywhere] text-[0.95rem] leading-relaxed text-stone-600 dark:text-stone-400">
          {announcement.message}
        </p>

        {onSale.length > 0 && (
          <ul className="mt-6 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {onSale.map((p) => {
              const { price, compareAt, percentOff } = resolvePrice(p.product_prices, countryCode);
              const row = (
                <>
                  <img
                    src={imageFor(p.slug, p.image_url)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base text-stone-950 dark:text-stone-50">
                      {p.name}
                    </p>
                    <PriceTag
                      price={price}
                      compareAt={compareAt}
                      currencySymbol={symbol}
                      size="sm"
                      showPercent={false}
                    />
                  </div>
                  <span className="shrink-0 text-sm italic tabular-nums text-amber-800 dark:text-gold">
                    −{percentOff} %
                  </span>
                </>
              );
              return (
                <li key={p.id}>
                  {preview ? (
                    <div className="flex items-center gap-4 py-3">{row}</div>
                  ) : (
                    <Link
                      to={getLocalizedPath(`/products/${p.slug}`)}
                      onClick={onClose}
                      className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.03]"
                    >
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-3 text-sm text-stone-600 transition-colors hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50 cursor-pointer"
          >
            {t("promo.later", "Plus tard")}
          </button>
          {ctaUrl &&
            ctaLabel &&
            (preview ? (
              <span className={ctaClass}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </span>
            ) : isExternal ? (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={ctaClass}
              >
                {ctaLabel}{" "}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
            ) : (
              <Link to={getLocalizedPath(ctaUrl)} onClick={onClose} className={ctaClass}>
                {ctaLabel}{" "}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

// Version de l'annonce : la modifier dans l'admin la remontre à tous
const seenKey = (a: Pick<Announcement, "id" | "updated_at">) =>
  `${a.id}:${new Date(a.updated_at).getTime()}`;

function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function markSeen(value: string) {
  try {
    localStorage.setItem(SEEN_KEY, value);
  } catch {
    // Stockage indisponible (navigation privée) : le pop-up pourra réapparaître
  }
}

/**
 * Pop-up d'information de la boutique (promotions, fermetures, nouveautés).
 * Une seule annonce active ; montrée une fois par visiteur et par version,
 * jamais pendant un paiement. Feuille du bas sur mobile, fenêtre au centre sinon.
 */
export function AnnouncementPopup() {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [open, setOpen] = useState(false);
  const [productsReady, setProductsReady] = useState(false);
  const quiet = QUIET_PATHS.test(pathname);

  // Relu à l'arrivée et à chaque retour sur la boutique (ex. après l'avoir
  // publiée depuis l'admin), sans attendre un rechargement complet de la page.
  useEffect(() => {
    if (quiet) return;
    let cancelled = false;
    getActiveAnnouncementFn()
      .then(async (a) => {
        if (cancelled) return;
        if (!a || readSeen() === seenKey(a)) {
          setAnnouncement(null);
          return;
        }
        setAnnouncement(a);
        // Produits chargés en parallèle : le pop-up n'attend pas plus que nécessaire
        if (a.show_promotions) {
          const list = await listProductsFn().catch(() => []);
          if (!cancelled) setProducts(list);
        }
        if (!cancelled) setProductsReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [quiet]);

  useEffect(() => {
    if (!announcement || quiet) return;
    // Ouverture après le délai, dès que les produits sont prêts (au plus tard à MAX_WAIT_MS)
    const timer = window.setTimeout(() => setOpen(true), productsReady ? DELAY_MS : MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [announcement, quiet, productsReady]);

  if (!announcement) return null;

  const close = () => {
    setOpen(false);
    markSeen(seenKey(announcement));
  };
  const onOpenChange = (o: boolean) => (o ? setOpen(true) : close());
  const card = <AnnouncementCard announcement={announcement} products={products} onClose={close} />;

  if (isMobile) {
    return (
      <DrawerPrimitive.Root open={open && !quiet} onOpenChange={onOpenChange}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <DrawerPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-[#fbf8f3] pb-[env(safe-area-inset-bottom)] outline-none dark:bg-[#1c140e]"
          >
            <div
              aria-hidden="true"
              className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-stone-300 dark:bg-stone-700"
            />
            <DrawerPrimitive.Title className="sr-only">{announcement.title}</DrawerPrimitive.Title>
            {card}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

  return (
    <DialogPrimitive.Root open={open && !quiet} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-stone-200 bg-[#fbf8f3] shadow-[0_32px_80px_-24px_rgba(44,27,17,0.45)] outline-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] dark:border-stone-800 dark:bg-[#1c140e]"
        >
          <DialogPrimitive.Title className="sr-only">{announcement.title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-900/5 hover:text-stone-950 dark:hover:bg-white/5 dark:hover:text-stone-50 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
          {card}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
