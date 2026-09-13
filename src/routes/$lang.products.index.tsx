import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/pages/products-page";

export const Route = createFileRoute("/$lang/products/")({
  head: () => ({
    meta: [
      { title: "Boutique & Céréales | Cereals House" },
      {
        name: "description",
        content:
          "Découvrez toutes nos céréales africaines premium : riz parfumé, mil, fonio royal, farines infantiles enrichies, sorgho et plus.",
      },
    ],
  }),
  component: ProductsPage,
});
