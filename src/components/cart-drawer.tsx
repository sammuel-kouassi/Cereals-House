import { Link } from "@tanstack/react-router";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Drawer as DrawerPrimitive } from "vaul";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";
import { PriceTag, resolvePrice } from "@/components/price-tag";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRemoveWithUndo } from "@/lib/use-remove-with-undo";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tiroir panier : feuille du bas sur mobile, panneau latéral sur desktop.
 * vaul gère le suivi 1:1 du doigt, la vitesse au lâcher, Échap, le focus et
 * le blocage du défilement de la page.
 */
export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const { items, updateQuantity, totalItems } = useCart();
  const removeWithUndo = useRemoveWithUndo();
  const { country } = useCountry();
  const isMobile = useIsMobile();

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  // Calcul du sous-total et de l'économie réalisée grâce aux promotions
  let subtotal = 0;
  let savings = 0;
  for (const it of items) {
    const { price, compareAt } = resolvePrice(it.prices, currentCountryCode, it.unitPrice);
    subtotal += price * it.quantity;
    if (compareAt != null) savings += (compareAt - price) * it.quantity;
  }

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          className={`fixed z-50 flex flex-col bg-card outline-none ${
            isMobile
              ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-border"
              : "inset-y-0 right-0 h-full w-full max-w-md border-l border-border shadow-[-24px_0_48px_-24px_rgba(44,27,17,0.25)]"
          }`}
        >
          {isMobile && (
            <div
              aria-hidden="true"
              className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-stone-300 dark:bg-stone-700"
            />
          )}

          {/* Entête du tiroir */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:py-5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <DrawerPrimitive.Title className="font-display text-lg text-primary">
                  {t("cart.drawerTitle", "Votre Panier")}
                </DrawerPrimitive.Title>
                <span className="text-xs italic text-muted-foreground">
                  {totalItems}{" "}
                  {totalItems > 1 ? t("cart.articles", "articles") : t("cart.article", "article")}
                </span>
              </div>
            </div>
            <DrawerPrimitive.Close
              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
              aria-label={t("common.close", "Fermer")}
            >
              <X className="h-5 w-5" />
            </DrawerPrimitive.Close>
          </div>

          {/* Liste des articles */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {items.length === 0 ? (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground/60">
                  <ShoppingBag className="h-10 w-10" />
                </div>
                <h3 className="font-display text-lg text-primary">
                  {t("cart.emptyTitle", "Votre panier est vide")}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                  {t(
                    "cart.emptySubtitle",
                    "Découvrez nos céréales naturelles sélectionnées et ajoutez-les à votre commande.",
                  )}
                </p>
                <Link
                  to={getLocalizedPath("/products")}
                  onClick={onClose}
                  className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-[#2c1b11] px-6 py-3 text-sm text-stone-50 transition-colors hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
                >
                  {t("cart.discoverProducts", "Explorer la boutique")}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const { price: unitPrice, compareAt } = resolvePrice(it.prices, currentCountryCode, it.unitPrice);
                  const itemImg = it.imageUrl || it.image;

                  return (
                    <div
                      key={it.slug}
                      className="flex gap-4 rounded-xl border border-border bg-background p-3"
                    >
                      {/* Vignette image */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {itemImg ? (
                          <img src={itemImg} alt={it.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                            CH
                          </div>
                        )}
                      </div>

                      {/* Infos produit */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={getLocalizedPath(`/products/${it.slug}`)}
                              onClick={onClose}
                              className="line-clamp-1 font-display text-base text-primary transition-colors hover:text-amber-800 dark:hover:text-gold"
                            >
                              {it.name}
                            </Link>
                            <span className="text-xs italic text-muted-foreground">{it.unit}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeWithUndo(it.slug)}
                            className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            aria-label={`${t("cart.remove", "Retirer")} ${it.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-1 flex items-center justify-between">
                          {/* Stepper de quantité — zones tactiles de 44px */}
                          <div className="flex items-center rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => updateQuantity(it.slug, it.quantity - 1)}
                              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                              aria-label={t("cart.decrease", "Diminuer la quantité")}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span
                              className="w-6 text-center text-sm tabular-nums"
                              aria-live="polite"
                            >
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(it.slug, it.quantity + 1)}
                              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                              aria-label={t("cart.increase", "Augmenter la quantité")}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Prix total de la ligne */}
                          <PriceTag
                            price={unitPrice * it.quantity}
                            compareAt={compareAt != null ? compareAt * it.quantity : null}
                            currencySymbol={currencySymbol}
                            size="sm"
                            showPercent={false}
                            className="justify-end text-right"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pied du tiroir avec Sous-total & CTA de paiement */}
          {items.length > 0 && (
            <div className="space-y-4 border-t border-border bg-[#FAF7F2] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:bg-[#18110B] sm:p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm italic text-stone-600 dark:text-stone-400">
                  {t("cart.subtotal", "Sous-total")}
                </span>
                <span className="font-display text-2xl tabular-nums text-stone-950 dark:text-stone-100">
                  {formatPrice(subtotal, currencySymbol)}
                </span>
              </div>
              {savings > 0 && (
                <p className="-mt-2 text-right text-sm italic text-amber-800 dark:text-gold">
                  {t("promo.youSave", "Vous économisez {{amount}}", {
                    amount: formatPrice(savings, currencySymbol),
                  })}
                </p>
              )}

              <p className="text-xs leading-relaxed text-stone-500">
                {t(
                  "cart.shippingCalculatedLater",
                  "Frais de livraison calculés à la validation. Paiement 100% en ligne sécurisé (Mobile Money & Carte).",
                )}
              </p>

              <div className="space-y-2.5">
                <Link
                  to={getLocalizedPath("/checkout")}
                  onClick={onClose}
                  className="pressable group flex w-full items-center justify-between rounded-full bg-[#2c1b11] py-2 pl-6 pr-2 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950 dark:hover:bg-gold/90"
                >
                  <span>{t("cart.checkoutCta", "Valider ma Commande")}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 dark:bg-stone-950/15">
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>

                <Link
                  to={getLocalizedPath("/cart")}
                  onClick={onClose}
                  className="pressable flex w-full items-center justify-center rounded-full border border-stone-300 py-3 text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  {t("cart.viewFullCart", "Consulter le panier détaillé")}
                </Link>
              </div>
            </div>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
