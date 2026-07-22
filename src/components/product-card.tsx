import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Baby, User, ArrowUpRight, Flame } from "lucide-react";
import { imageFor } from "@/lib/products-meta";
import { formatPrice } from "@/lib/format";
import { useCountry } from "@/lib/country-context";

// En dessous de ce seuil (en unités de stock réel, pas une fausse jauge), on
// affiche une alerte de stock bas — urgence authentique, pas un compte à
// rebours fictif.
const LOW_STOCK_THRESHOLD = 15;

type Props = {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string | null;
  unit: string;
  prices: { country_code: string; price: number }[];
  audiences?: string[] | null;
  imageUrl?: string | null;
  stock?: number;
};

export function ProductCard({
  slug,
  name,
  shortDescription,
  category,
  unit,
  prices,
  audiences,
  imageUrl,
  stock,
}: Props) {
  const { country } = useCountry();
  const { t } = useTranslation();

  // Base price is XOF (unified across Africa). Convert with country FX rate; keep explicit
  // country override when present (e.g. FR/US) for local pricing tuning.
  const override = prices.find((p) => p.country_code === country?.code)?.price;
  const basePriceXof = prices.find((p) => p.country_code === "CI")?.price ?? prices[0]?.price ?? 0;
  const fx = (country as unknown as { fx_rate_from_xof?: number } | null)?.fx_rate_from_xof ?? 1;
  const price = override ?? basePriceXof * fx;

  const isKid = audiences?.includes("enfant");
  const isAdult = audiences?.includes("adulte");
  const lowStock = typeof stock === "number" && stock > 0 && stock <= LOW_STOCK_THRESHOLD;

  return (
    <Link
      to="/products/$slug"
      params={{ slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-gold"
    >
      {/* Liseré doré signature, s'étend au survol — écho du header/footer */}
      <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/70 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />

      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageUrl || imageFor(slug)}
          alt={name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur transition-transform duration-300 group-hover:-translate-y-0.5">
            {category}
          </span>
        )}

        {(isKid || isAdult) && (
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {isKid && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold shadow-sm backdrop-blur">
                <Baby className="h-3 w-3" /> {t("audience.kid")}
              </span>
            )}
            {isAdult && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary shadow-sm backdrop-blur">
                <User className="h-3 w-3" /> {t("audience.adult")}
              </span>
            )}
          </div>
        )}

        {lowStock && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur">
            <Flame className="h-3 w-3" /> {t("products.lowStock", { count: stock })}
          </span>
        )}

        {/* Icône "voir" qui apparaît en fondu au survol, en écho au bouton du bas */}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-gold text-gold-foreground opacity-0 shadow-gold transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-primary transition-colors duration-300 group-hover:text-gold">
          {name}
        </h3>
        {shortDescription && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{shortDescription}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="text-xl font-bold text-gold">
              {country ? formatPrice(price, country.currency_code, country.currency_symbol) : "—"}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("products.perUnit")} {unit}
            </div>
          </div>
          <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:bg-gold group-hover:text-gold-foreground">
            {t("products.view")}
          </span>
        </div>
      </div>
    </Link>
  );
}