import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PayOrderPage } from "@/components/pages/pay-order-page";

const searchSchema = z.object({ token: z.string().catch("") });

export const Route = createFileRoute("/$lang/pay/$orderId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Paiement Sécurisé | Cereals House" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useParams();
  const { token } = Route.useSearch();
  return <PayOrderPage orderId={orderId} token={token} />;
}
