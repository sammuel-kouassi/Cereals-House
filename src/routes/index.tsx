import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product-card";
import { useCountry } from "@/lib/country-context";
import heroImage from "@/assets/hero-cereals.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cereals House — Céréales africaines premium livrées chez vous" },
      {
        name: "description",
        content:
          "Cereals House : riz parfumé, mil, fonio, maïs et plus. Commande en ligne, paiement Mobile Money/Visa, livraison rapide en Afrique de l'Ouest, France et USA.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { country } = useCountry();

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name, short_description, category, unit, is_featured, product_prices(country_code, price)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("name");
      return data ?? [];
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:px-8 lg:py-40">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold backdrop-blur">
              <Leaf className="h-3.5 w-3.5" /> Récolte artisanale
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              L'or doré <br />
              de nos <span className="text-gradient-gold">terres africaines</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              Cereals House sélectionne les meilleures céréales du continent : riz parfumé, fonio, mil, maïs, sorgho.
              Livré chez vous {country ? `(${country.flag_emoji} ${country.name})` : ""} avec paiement Mobile Money ou Visa.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:-translate-y-0.5 hover:bg-gold/90"
              >
                Découvrir la boutique <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:border-gold hover:text-gold"
              >
                Notre histoire
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Leaf, title: "Qualité premium", text: "Sélection rigoureuse" },
            { icon: Truck, title: "Livraison 8 pays", text: "Afrique, France & USA" },
            { icon: CreditCard, title: "Paiement flexible", text: "Mobile Money & Visa" },
            { icon: ShieldCheck, title: "Achat sécurisé", text: "Données protégées" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold/15 text-gold">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-primary">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Nos vedettes</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">Céréales d'exception</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Les céréales préférées de nos clients, soigneusement triées et conditionnées.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:underline"
          >
            Voir toute la boutique <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              shortDescription={p.short_description}
              category={p.category}
              unit={p.unit}
              prices={p.product_prices ?? []}
            />
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">Comment ça marche</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Commander en 4 étapes</h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Choisissez vos céréales", d: "Parcourez notre catalogue et ajoutez au panier." },
              { n: "02", t: "Indiquez votre pays", d: "Le prix et les frais s'adaptent automatiquement." },
              { n: "03", t: "Payez en ligne", d: "Orange Money, Wave, MTN, Moov ou Visa." },
              { n: "04", t: "Suivez la livraison", d: "Statut en temps réel jusqu'à votre porte." },
            ].map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-primary-foreground/10 bg-background/5 p-6 backdrop-blur">
                <div className="font-display text-5xl font-bold text-gold/40">{s.n}</div>
                <div className="mt-3 font-display text-lg font-semibold text-gold">{s.t}</div>
                <p className="mt-2 text-sm text-primary-foreground/75">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
