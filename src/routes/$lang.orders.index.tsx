import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/pages/orders-page";

export const Route = createFileRoute("/$lang/orders/")({
  head: () => ({ meta: [{ title: "Mes Commandes | Cereals House" }] }),
  component: OrdersPage,
});
