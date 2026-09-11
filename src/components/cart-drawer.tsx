import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";
import { useLanguageNavigation } from "@/lib/i18n-routing";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const { items, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const { country } = useCountry();

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  // Calcul du sous-total
  const subtotal = items.reduce((acc, it) => {
    const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
    const unitPrice = priceObj?.price ?? it.unitPrice ?? 0;
    return acc + unitPrice * it.quantity;
  }, 0);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${
        open ? "visible" : "invisible delay-300"
      }`}
    >
      {/* Backdrop sombre avec flou */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tiroir coulissant */}
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl border-l border-border transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Entête du tiroir */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-primary">
                {t("cart.drawerTitle", "Votre Panier")}
              </h2>
              <span className="text-xs text-muted-foreground">
                {totalItems} {totalItems > 1 ? t("cart.articles", "articles") : t("cart.article", "article")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground/60 mb-4">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h3 className="font-display text-lg font-bold text-primary">
                {t("cart.emptyTitle", "Votre panier est vide")}
              </h3>
              <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
                {t("cart.emptySubtitle", "Découvrez nos céréales naturelles sélectionnées et ajoutez-les à votre commande.")}
              </p>
              <Link
                to={getLocalizedPath("/products")}
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-xs font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5"
              >
                {t("cart.discoverProducts", "Explorer la boutique")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => {
                const priceObj = it.prices?.find((p) => p.country_code === currentCountryCode);
                const unitPrice = priceObj?.price ?? it.unitPrice ?? 0;
                const lineTotal = unitPrice * it.quantity;
                const itemImg = it.imageUrl || it.image;

                return (
                  <div
                    key={it.slug}
                    className="flex gap-4 rounded-xl border border-border bg-background p-3.5 transition hover:shadow-soft"
                  >
                    {/* Vignette image */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={it.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                          CH
                        </div>
                      )}
                    </div>

                    {/* Infos produit */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={getLocalizedPath(`/products/${it.slug}`)}
                            onClick={onClose}
                            className="font-display text-sm font-semibold text-primary hover:text-gold transition line-clamp-1"
                          >
                            {it.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(it.slug)}
                            className="text-muted-foreground/60 transition hover:text-destructive cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{it.unit}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Stepper de quantité */}
                        <div className="flex items-center rounded-lg border border-border bg-secondary/50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.slug, it.quantity - 1)}
                            className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-primary transition cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.slug, it.quantity + 1)}
                            className="grid h-7 w-7 place-items-center text-muted-foreground hover:text-primary transition cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Prix total de la ligne */}
                        <span className="font-semibold text-sm text-primary">
                          {formatPrice(lineTotal, currencySymbol)}
                        </span>
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
          <div className="border-t border-border bg-background p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("cart.subtotal", "Sous-total")}</span>
              <span className="font-display text-xl font-bold text-primary">
                {formatPrice(subtotal, currencySymbol)}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {t("cart.shippingCalculatedLater", "Frais de livraison et options de paiement calculés à l'étape suivante.")}
            </p>

            <div className="grid gap-2">
              <Link
                to={getLocalizedPath("/checkout")}
                onClick={onClose}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
              >
                {t("cart.checkoutCta", "Commander maintenant")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to={getLocalizedPath("/cart")}
                onClick={onClose}
                className="flex w-full items-center justify-center rounded-full border border-border bg-card py-2.5 text-xs font-semibold text-foreground/80 transition hover:bg-secondary"
              >
                {t("cart.viewFullCart", "Voir le panier détaillé")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
