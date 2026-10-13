import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pages/home-page";

export const Route = createFileRoute("/$lang/")({
  head: () => ({
    meta: [
      { title: "Cereals House | Céréales africaines premium livrées chez vous" },
      {
        name: "description",
        content:
          "Cereals House : céréales et produits d’Afrique de l’Ouest (mil, fonio, sorgho, maïs, farines) soigneusement triés, sans sable ni conservateurs. Commande en ligne, paiement Mobile Money et carte, livraison suivie.",
      },
    ],
  }),
  component: HomePage,
});
