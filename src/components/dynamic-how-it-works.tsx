import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Reveal } from "@/components/reveal";
import { SectionHeading, TextLink } from "@/components/section-heading";
import { useLanguageNavigation } from "@/lib/i18n-routing";
import { useCountry } from "@/lib/country-context";
import { listProductsFn } from "@/lib/products/products.functions";
import { imageFor } from "@/lib/products-meta";
import { formatPrice } from "@/lib/format";

export function DynamicHowItWorks() {
  const { t } = useTranslation();
  const { getLocalizedPath } = useLanguageNavigation();
  const { country } = useCountry();
  const [isPaused, setIsPaused] = useState(false);

  // Récupération dynamique de tous les produits enregistrés en base de données
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => listProductsFn(),
  });

  const currentCountryCode = country?.code ?? "CI";
  const currencySymbol = country?.currency_symbol ?? "FCFA";

  // Duplication fluide pour l'effet de boucle infinie sans saut
  let displayList = dbProducts;
  if (displayList.length > 0 && displayList.length < 6) {
    while (displayList.length < 6) {
      displayList = [...displayList, ...dbProducts];
    }
  }
  const marqueeItems = displayList.length > 0 ? [...displayList, ...displayList] : [];

  return (
    <section className="border-y border-stone-200 bg-[#f6f0e6] py-16 dark:border-stone-800 dark:bg-stone-900/40 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            title={t("howItWorks.title", "Sélectionnez vos céréales de terroirs")}
            description={t(
              "howItWorks.desc",
              "Nos céréales sont soigneusement triées et préparées pour vous faire gagner du temps en cuisine. Certaines références sont précuites et prêtes en quelques minutes.",
            )}
            action={
              <Link to={getLocalizedPath("/products")}>
                <TextLink>{t("howItWorks.seeShop", "Voir toute la boutique")}</TextLink>
              </Link>
            }
          />
          <p className="mt-4 text-sm italic text-amber-800 dark:text-gold">
            {t("howItWorks.badge", "Sélection de céréales • Zéro grain de sable garanti")}
          </p>
        </Reveal>
      </div>

      {/* Ruban de produits à défilement lent (pause au survol / au focus) */}
      <div
        className="relative mt-10 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        {isLoading && marqueeItems.length === 0 ? (
          <div className="flex gap-5 px-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-44 shrink-0 animate-pulse space-y-3 sm:w-52">
                <div className="aspect-square rounded-lg bg-stone-200 dark:bg-stone-800" />
                <div className="h-3 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="animate-cereal-marquee flex gap-5"
            style={{
              animationDuration: "90s",
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {marqueeItems.map((p, idx) => {
              const priceObj = p.product_prices?.find((pr) => pr.country_code === currentCountryCode);
              const basePrice =
                p.product_prices?.find((pr) => pr.country_code === "CI")?.price ?? p.product_prices?.[0]?.price ?? 0;
              const price = priceObj?.price ?? basePrice;

              return (
                <Link
                  key={`${p.id}-${idx}`}
                  to={getLocalizedPath(`/products/${p.slug}`)}
                  className="group block w-44 shrink-0 sm:w-52"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800">
                    <img
                      src={imageFor(p.slug, p.image_url)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mt-3 line-clamp-1 font-display text-base text-stone-950 group-hover:underline group-hover:underline-offset-4 dark:text-stone-50">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">
                    {formatPrice(price, currencySymbol)}
                    {p.unit ? <span className="text-stone-500"> / {p.unit}</span> : null}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-col gap-3 border-t border-stone-300/70 pt-6 text-sm text-stone-700 dark:border-stone-800 dark:text-stone-300 sm:flex-row sm:gap-10">
          {[
            t("howItWorks.guarantee1Title", "Zéro sable garanti"),
            t("howItWorks.guarantee2Title", "Mouture soigneuse des céréales"),
            t("howItWorks.guarantee3Title", "Livraison suivie"),
          ].map((label) => (
            <li key={label} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-amber-800 dark:text-gold" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
