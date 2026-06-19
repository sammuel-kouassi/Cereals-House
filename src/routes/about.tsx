import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Heart, Globe, Award } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Cereals House" },
      { name: "description", content: "Découvrez Cereals House : notre mission, nos producteurs partenaires et notre engagement pour des céréales africaines d'exception." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-gold">Notre histoire</span>
        <h1 className="mt-2 font-display text-5xl font-bold text-primary">Du champ africain à votre table</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Cereals House est née d'une conviction simple : l'Afrique produit certaines des meilleures céréales du monde,
          et chacun mérite d'y avoir accès, où qu'il soit. Nous travaillons main dans la main avec des coopératives locales
          pour vous offrir des produits authentiques, équitables et de qualité supérieure.
        </p>
      </section>

      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Leaf, t: "Naturel", d: "Aucun additif, juste la nature." },
            { icon: Heart, t: "Équitable", d: "Rémunération juste des producteurs." },
            { icon: Globe, t: "International", d: "Livré dans 8 pays sur 3 continents." },
            { icon: Award, t: "Premium", d: "Tri et conditionnement rigoureux." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-primary">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
