import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/components/pages/checkout-page";

export const Route = createFileRoute("/$lang/checkout")({
  head: () => ({ meta: [{ title: "Validation de Commande — Cereals House" }] }),
  component: CheckoutPage,
});
