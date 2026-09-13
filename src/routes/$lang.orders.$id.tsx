import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/components/pages/order-detail-page";

export const Route = createFileRoute("/$lang/orders/$id")({
  head: () => ({ meta: [{ title: "Détails de Commande | Cereals House" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <OrderDetailPage id={id} />;
}
