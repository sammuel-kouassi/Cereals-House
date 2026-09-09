import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/pages/orders-page";

export const Route = createFileRoute("/$lang/orders/")({
  head: () => ({ meta: [{ title: "Mes commandes — Cereals House" }] }),
  component: OrdersPage,
});
