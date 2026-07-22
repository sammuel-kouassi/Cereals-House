import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart-context";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";

const WHATSAPP_NUMBER = "2250584637219";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Panier — Cereals House" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { country } = useCountry();
  const { t } = useTranslation();
  const shipping = country?.base_shipping_fee ?? 0;
  const total = subtotal + (items.length > 0 ? shipping : 0);

  // Message pré-rempli listant le panier, pour les clients qui préfèrent
  // finaliser leur commande directement avec quelqu'un sur WhatsApp plutôt
  // que par le formulaire de commande en ligne.
  const whatsappHref = (() => {
    const lines = [
      t("cart.whatsappIntro"),
      "",
      ...items.map(
        (it) =>
          `• ${it.name} × ${it.quantity}${
            country
              ? ` — ${formatPrice(it.unitPrice * it.quantity, country.currency_code, country.currency_symbol)}`
              : ""
          }`,
      ),
      "",
      country
        ? `${t("cart.total")} : ${formatPrice(total, country.currency_code, country.currency_symbol)}`
        : "",
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  })();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold/15 text-gold motion-safe:animate-[fade-in_0.5s_ease-out_both]">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1
          className="mt-6 font-display text-3xl font-bold text-primary motion-safe:animate-[fade-in_0.5s_ease-out_both]"
          style={{ animationDelay: "80ms" }}
        >
          {t("cart.empty")}
        </h1>
        <p
          className="mt-2 text-muted-foreground motion-safe:animate-[fade-in_0.5s_ease-out_both]"
          style={{ animationDelay: "140ms" }}
        >
          {t("cart.emptyDesc")}
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)] motion-safe:animate-[fade-in_0.5s_ease-out_both]"
          style={{ animationDelay: "200ms" }}
        >
          {t("cart.seeShop")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-primary motion-safe:animate-[fade-in_0.5s_ease-out_both]">
        {t("cart.title")}
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map((it, idx) => (
            <li
              key={it.productId}
              style={{ animationDelay: `${idx * 60}ms` }}
              className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-soft motion-safe:animate-[fade-in_0.5s_ease-out_both]"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <img
                  src={it.image}
                  alt={it.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <Link
                  to="/products/$slug"
                  params={{ slug: it.slug }}
                  className="font-display text-lg font-semibold text-primary transition-colors duration-300 hover:text-gold"
                >
                  {it.name}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {country
                    ? formatPrice(it.unitPrice, country.currency_code, country.currency_symbol)
                    : ""}{" "}
                  / kg
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border transition-colors duration-300 group-hover:border-gold/30">
                    <button
                      onClick={() => setQty(it.productId, it.quantity - 1)}
                      className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200 hover:bg-secondary hover:text-gold active:scale-90"
                      aria-label="−"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      key={it.quantity}
                      className="w-8 text-center text-sm font-semibold motion-safe:animate-[fade-in_0.2s_ease-out_both]"
                    >
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => setQty(it.productId, it.quantity + 1)}
                      className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200 hover:bg-secondary hover:text-gold active:scale-90"
                      aria-label="+"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      key={it.quantity + it.unitPrice}
                      className="font-semibold text-primary motion-safe:animate-[fade-in_0.2s_ease-out_both]"
                    >
                      {country
                        ? formatPrice(
                            it.unitPrice * it.quantity,
                            country.currency_code,
                            country.currency_symbol,
                          )
                        : ""}
                    </span>
                    <button
                      onClick={() => remove(it.productId)}
                      className="rounded-full p-1.5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-destructive/10 hover:text-destructive active:scale-90"
                      aria-label={t("cart.remove")}
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
          className="h-fit rounded-2xl border border-border bg-card p-6 motion-safe:animate-[fade-in_0.5s_ease-out_both] lg:sticky lg:top-24"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="font-display text-xl font-bold text-primary">{t("cart.summary")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd>
                {country
                  ? formatPrice(subtotal, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t("cart.shipping")} ({country?.name})
              </dt>
              <dd>
                {country
                  ? formatPrice(shipping, country.currency_code, country.currency_symbol)
                  : ""}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>{t("cart.total")}</dt>
              <dd className="text-gold">
                {country ? formatPrice(total, country.currency_code, country.currency_symbol) : ""}
              </dd>
            </div>
          </dl>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)]"
          >
            {t("cart.checkout")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#128C4A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#25D366]/20 dark:text-[#25D366]"
          >
            <MessageCircle className="h-4 w-4" /> {t("cart.orderViaWhatsapp")}
          </a>
          
          <Link
            to="/products"
            className="mt-3 block text-center text-sm text-muted-foreground transition-colors duration-300 hover:text-gold"
          >
            {t("cart.continueShopping")}
          </Link>
        </aside>
      </div>
    </div>
  );
}