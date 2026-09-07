import { useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Search, X, ArrowRight, Sparkles, Tag, Baby, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { listProductsFn, type ProductItem } from "@/lib/products/products.functions";
import { useCountry } from "@/lib/country-context";
import { formatPrice } from "@/lib/format";

interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
}

export function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { country } = useCountry();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      listProductsFn()
        .then((res) => setProducts(res ?? []))
        .finally(() => setLoading(false));

      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Écoute de la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else {
          // Trigger open via custom event if closed
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const q = normalize(query.trim());

  const filtered = products.filter((p) => {
    if (!q) return true;
    return (
      normalize(p.name).includes(q) ||
      normalize(p.short_description ?? "").includes(q) ||
      normalize(p.category ?? "").includes(q) ||
      (p.audiences ?? []).some((a) => normalize(a).includes(q))
    );
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal de recherche */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all motion-safe:animate-[zoom-in_0.2s_ease-out] z-10">
        {/* Champ de saisie */}
        <div className="flex items-center border-b border-border px-4 py-3.5">
          <Search className="h-5 w-5 text-gold shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder", "Rechercher une céréale, farine, fonio, mil, riz...")}
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground mr-2 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Suggestions rapides si pas de requête */}
        {!query && (
          <div className="p-4 border-b border-border bg-secondary/30">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> {t("search.categories", "Catégories suggérées")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setQuery(cat)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 hover:border-gold hover:text-primary transition cursor-pointer"
                >
                  <Tag className="h-3 w-3 text-gold" /> {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement des produits...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-primary">
                {t("search.noResults", "Aucun produit ne correspond à votre recherche.")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Essayez des mots-clés comme "mil", "fonio", "farine", "riz", "bébé".
              </p>
            </div>
          ) : (
            filtered.map((p) => {
              const priceObj = p.product_prices.find((pp) => pp.country_code === currentCountryCode);
              const price = priceObj?.price ?? 0;

              return (
                <Link
                  key={p.slug}
                  to="/products/$slug"
                  params={{ slug: p.slug }}
                  onClick={onClose}
                  className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition hover:bg-secondary/70 border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                          CH
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-primary group-hover:text-gold transition">
                          {p.name}
                        </span>
                        {p.is_featured && (
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                            Vedette
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>{p.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-primary">
                      {formatPrice(price, currencySymbol)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-gold" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Pied de la recherche */}
        <div className="border-t border-border bg-secondary/30 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} {filtered.length > 1 ? "produits trouvés" : "produit trouvé"}</span>
          <Link
            to="/products"
            onClick={onClose}
            className="font-medium text-gold hover:underline flex items-center gap-1"
          >
            Voir toute la boutique <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
