import { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { useCountry } from "@/lib/country-context";
import { PriceTag, resolvePrice } from "@/components/price-tag";
import { useLanguageNavigation } from "@/lib/i18n-routing";

interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Recherche instantanée (⌘K) : cmdk pour le clavier ↑↓ / Entrée, Radix Dialog
 * pour le focus, Échap et une sortie animée symétrique à l'entrée.
 */
export function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const navigate = useNavigate();
  const { country } = useCountry();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductItem[] | null>(null);

  // Chargement unique à la première ouverture
  useEffect(() => {
    if (!open || products) return;
    listProductsFn()
      .then((res) => setProducts(res ?? []))
      .catch(() => setProducts([]));
  }, [open, products]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";
  const list = products ?? [];

  const q = normalize(query.trim());
  const filtered = list.filter((p) => {
    if (!q) return true;
    return (
      normalize(p.name).includes(q) ||
      normalize(p.short_description ?? "").includes(q) ||
      normalize(p.category ?? "").includes(q) ||
      (p.audiences ?? []).some((a) => normalize(a).includes(q))
    );
  });

  const categories = Array.from(new Set(list.map((p) => p.category).filter(Boolean) as string[]));

  const priceOf = (p: ProductItem) =>
    p.product_prices.length > 0 ? resolvePrice(p.product_prices, currentCountryCode) : null;

  const go = (slug: string) => {
    onClose();
    navigate({ to: getLocalizedPath(`/products/${slug}`) });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-16 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 origin-top overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_64px_-24px_rgba(44,27,17,0.45)] outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98] sm:top-24"
        >
          <DialogPrimitive.Title className="sr-only">
            {t("search.title", "Rechercher un produit")}
          </DialogPrimitive.Title>
          <Command shouldFilter={false} loop label={t("search.title", "Rechercher un produit")}>
            {/* Champ de saisie */}
            <div className="flex items-center border-b border-border px-4">
              <Search className="mr-3 h-5 w-5 shrink-0 text-amber-800 dark:text-gold" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder={t(
                  "search.placeholder",
                  "Rechercher une céréale, farine, fonio, mil, riz...",
                )}
                className="h-14 w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-block">
                Échap
              </kbd>
            </div>

            {/* Catégories suggérées si pas de requête */}
            {!query && categories.length > 0 && (
              <div className="border-b border-border px-4 py-3">
                <p className="mb-2 text-xs italic text-muted-foreground">
                  {t("search.categories", "Catégories suggérées")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuery(cat)}
                      className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:border-stone-500 hover:text-foreground cursor-pointer"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Résultats */}
            <Command.List className="max-h-[55dvh] overflow-y-auto overscroll-contain p-2">
              {products === null ? (
                <div className="space-y-2 p-2" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-secondary" />
                      <div className="h-3 w-40 rounded bg-secondary" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <Command.Empty className="py-10 text-center">
                    <p className="text-sm text-primary">
                      {t("search.noResults", "Aucun produit ne correspond à votre recherche.")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        "search.hint",
                        "Essayez « mil », « fonio », « farine », « riz » ou « bébé ».",
                      )}
                    </p>
                  </Command.Empty>
                  {filtered.map((p) => {
                    const price = priceOf(p);
                    return (
                      <Command.Item
                        key={p.slug}
                        value={p.slug}
                        onSelect={() => go(p.slug)}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 data-[selected=true]:bg-secondary"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                                CH
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-display text-base text-primary">
                                {p.name}
                              </span>
                              {p.is_featured && (
                                <span className="shrink-0 text-xs italic text-amber-800 dark:text-gold">
                                  {t("search.featured", "Vedette")}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-xs italic text-muted-foreground">
                              {[p.category, p.unit].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          {price !== null && (
                            <PriceTag
                              price={price.price}
                              compareAt={price.compareAt}
                              currencySymbol={currencySymbol}
                              size="sm"
                              showPercent={false}
                            />
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[selected=true]:translate-x-0.5" />
                        </div>
                      </Command.Item>
                    );
                  })}
                </>
              )}
            </Command.List>
          </Command>

          {/* Pied de la recherche */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              {filtered.length}{" "}
              {filtered.length > 1
                ? t("search.resultsCountPlural", "produits trouvés")
                : t("search.resultsCountSingular", "produit trouvé")}
            </span>
            <Link
              to={getLocalizedPath("/products")}
              onClick={onClose}
              className="flex items-center gap-1 text-amber-800 underline-offset-4 hover:underline dark:text-gold"
            >
              {t("search.viewAllShop", "Voir toute la boutique")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
