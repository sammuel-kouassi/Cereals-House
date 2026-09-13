import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/home-page";

export const Route = createFileRoute("/$lang/")({
  head: () => ({
    meta: [
      { title: "Cereals House | Céréales africaines premium livrées chez vous" },
      {
        name: "description",
        content:
          "Cereals House : riz parfumé, mil, fonio, farines infantiles, maïs et plus. Commande en ligne, paiement Mobile Money, livraison rapide.",
      },
    ],
  }),
  component: HomePage,
});
