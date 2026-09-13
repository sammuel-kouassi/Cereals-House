import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/pages/about-page";

export const Route = createFileRoute("/$lang/about")({
  head: () => ({
    meta: [
      { title: "À propos | Cereals House" },
      {
        name: "description",
        content:
          "Découvrez Cereals House : notre mission, nos producteurs partenaires et notre engagement pour des céréales africaines d'exception.",
      },
    ],
  }),
  component: AboutPage,
});
