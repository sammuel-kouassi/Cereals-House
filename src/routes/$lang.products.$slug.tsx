import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/components/pages/product-detail-page";

export const Route = createFileRoute("/$lang/products/$slug")({
  head: () => ({
    meta: [{ title: "Fiche Produit | Cereals House" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <ProductDetailPage slug={slug} />;
}
