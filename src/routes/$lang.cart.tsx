import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/components/pages/cart-page";

export const Route = createFileRoute("/$lang/cart")({
  head: () => ({ meta: [{ title: "Votre Panier | Cereals House" }] }),
  component: CartPage,
});
