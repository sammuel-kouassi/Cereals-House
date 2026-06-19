import { Link } from "@tanstack/react-router";
import { imageFor } from "@/lib/products-meta";
import { formatPrice } from "@/lib/format";
import { useCountry } from "@/lib/country-context";

type Props = {
  slug: string;
  name: string;
  shortDescription: string | null;
  category: string | null;
  unit: string;
  prices: { country_code: string; price: number }[];
};

export function ProductCard({ slug, name, shortDescription, category, unit, prices }: Props) {
  const { country } = useCountry();
  const price = prices.find((p) => p.country_code === country?.code)?.price ?? prices[0]?.price ?? 0;

  return (
    <Link
      to="/products/$slug"
      params={{ slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageFor(slug)}
          alt={name}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
            {category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-primary group-hover:text-gold">{name}</h3>
        {shortDescription && <p className="line-clamp-2 text-sm text-muted-foreground">{shortDescription}</p>}
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <div className="text-xl font-bold text-gold">
              {country ? formatPrice(price, country.currency_code, country.currency_symbol) : "—"}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">par {unit}</div>
          </div>
          <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition group-hover:bg-gold group-hover:text-gold-foreground">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}
