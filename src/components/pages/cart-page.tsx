import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";
import { PriceTag, resolvePrice } from "@/components/price-tag";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { useRemoveWithUndo } from "@/lib/use-remove-with-undo";

const WHATSAPP_NUMBER = "2250584637219";

export function CartPage() {
  const { items, setQty } = useCart();
  const removeWithUndo = useRemoveWithUndo();
  const { country } = useCountry();
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const countryCode = country?.code ?? "CI";
  const symbol = country?.currency_symbol ?? "FCFA";
  // Prix du pays sélectionné (remisé si promotion), comme au checkout
  const cartLines = items.map((it) => ({ it, ...resolvePrice(it.prices, countryCode, it.unitPrice) }));
  const subtotal = cartLines.reduce((s, l) => s + l.price * l.it.quantity, 0);
  const savings = cartLines.reduce((s, l) => s + (l.compareAt != null ? (l.compareAt - l.price) * l.it.quantity : 0), 0);
  const shipping = country?.base_shipping_fee ?? 0;
  const total = subtotal + (items.length > 0 ? shipping : 0);

  const whatsappHref = (() => {
    const lines = [
      t("cart.whatsappIntro", "Bonjour, je souhaite commander :"),
      "",
      ...cartLines.map(
        ({ it, price }) =>
          `• ${it.name} × ${it.quantity}${
            country ? ` : ${formatPrice(price * it.quantity, country.currency_code, country.currency_symbol)}` : ""
          }`,
      ),
      "",
      country
        ? `${t("cart.total", "Total")} : ${formatPrice(total, country.currency_code, country.currency_symbol)}`
        : "",
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  })();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1
          className="mt-6 font-display text-3xl text-primary"
        >
          {t("cart.empty", "Votre panier est vide")}
        </h1>
        <p
          className="mt-2 text-muted-foreground"
        >
          {t("cart.emptyDesc", "Découvrez nos céréales et trouvez votre bonheur.")}
        </p>
        <Link
          to={getLocalizedPath("/products")}
          className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-[#2c1b11] px-6 py-3 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
        >
          {t("cart.seeShop", "Voir la boutique")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl text-primary">
        {t("cart.title", "Votre panier")}
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {cartLines.map(({ it, price, compareAt }) => (
            <li
              key={it.productId}
              className="relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4"
            >
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <img
                  src={it.image}
                  alt={it.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <Link
                  to={getLocalizedPath(`/products/${it.slug}`)}
                  className="font-display text-lg text-primary transition-colors duration-200 hover:text-amber-800 dark:hover:text-gold"
                >
                  {it.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  <PriceTag price={price} compareAt={compareAt} currencySymbol={symbol} size="sm" /> / {it.unit || "kg"}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty(it.productId, it.quantity - 1)}
                      className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-200 hover:bg-secondary"
                      aria-label={t("cart.decrease", "Diminuer la quantité")}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => setQty(it.productId, it.quantity + 1)}
                      className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-200 hover:bg-secondary"
                      aria-label={t("cart.increase", "Augmenter la quantité")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-primary">
                      {formatPrice(price * it.quantity, symbol)}
                    </span>
                    <button
                      onClick={() => removeWithUndo(it.slug)}
                      className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`${t("cart.remove", "Retirer")} ${it.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside
          className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24"
        >
          <h2 className="font-display text-xl text-primary">{t("cart.summary", "Récapitulatif")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.subtotal", "Sous-total")}</dt>
              <dd>
                {country
                  ? formatPrice(subtotal, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-xs italic text-amber-800 dark:text-gold">
                <dt>{t("promo.savingsIncluded", "dont remise promotion")}</dt>
                <dd className="tabular-nums">−{formatPrice(savings, symbol)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t("cart.shipping", "Livraison")} ({country?.name})
              </dt>
              <dd>
                {country
                  ? formatPrice(shipping, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt>{t("cart.total", "Total")}</dt>
              <dd className="text-gold">
                {country ? formatPrice(total, country.currency_code, country.currency_symbol) : ""}
              </dd>
            </div>
          </dl>
          <Link
            to={getLocalizedPath("/checkout")}
            className="pressable group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#2c1b11] px-6 py-3.5 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
          >
            {t("cart.checkout", "Passer la commande")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-sm text-[#128C4A] transition-colors duration-200 hover:bg-[#25D366]/20 dark:text-[#25D366]"
          >
            <MessageCircle className="h-4 w-4" /> {t("cart.orderViaWhatsapp", "Commander via WhatsApp")}
          </a>
          
          <Link
            to={getLocalizedPath("/products")}
            className="mt-3 block text-center text-sm text-muted-foreground transition-colors duration-300 hover:text-gold"
          >
            {t("cart.continueShopping", "Continuer mes achats")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
