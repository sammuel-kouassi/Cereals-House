import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/components/pages/product-detail-page";
import { getProductBySlugFn } from "@/lib/products/products.functions";
import { imageFor } from "@/lib/products-meta";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

type ProductSeo = {
  name: string;
  description: string;
  image?: string;
  price?: number;
  inStock: boolean;
  category?: string | null;
  reviewCount: number;
  ratingAverage?: number;
};

export const Route = createFileRoute("/$lang/products/$slug")({
  // Données minimales pour le référencement (titre, description, données produit).
  // L'affichage de la page continue d'utiliser sa propre requête.
  loader: async ({ params }): Promise<{ seo: ProductSeo | null }> => {
    try {
      const res = await getProductBySlugFn({ data: { slug: params.slug } });
      if (!res?.product) return { seo: null };
      const p = res.product;
      const reviews = (res.reviews ?? []) as { rating?: number }[];
      const ratings = reviews.map((r) => Number(r.rating)).filter((n) => n > 0);
      const price =
        p.product_prices?.find((pp) => pp.country_code === "CI")?.price ?? p.product_prices?.[0]?.price;
      return {
        seo: {
          name: p.name,
          description: (p.short_description || p.description || "").trim(),
          image: absoluteUrl(imageFor(p.slug, p.image_url)) ?? DEFAULT_OG_IMAGE,
          price: price != null ? Number(price) : undefined,
          inStock: typeof p.stock !== "number" || p.stock > 0,
          category: p.category,
          reviewCount: ratings.length,
          ratingAverage: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined,
        },
      };
    } catch {
      return { seo: null };
    }
  },
  head: ({ loaderData, params }) => {
    const seo = loaderData?.seo;
    if (!seo) return { meta: [{ title: `Fiche produit | ${SITE_NAME}` }] };

    const url = `${SITE_URL}/${params.lang}/products/${params.slug}`;
    const description =
      seo.description.length > 160 ? `${seo.description.slice(0, 157).trimEnd()}…` : seo.description;

    const productJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: seo.name,
      description: seo.description || undefined,
      image: seo.image ? [seo.image] : undefined,
      sku: params.slug,
      category: seo.category || undefined,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers:
        seo.price != null
          ? {
              "@type": "Offer",
              url,
              price: seo.price,
              priceCurrency: "XOF",
              availability: seo.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@id": `${SITE_URL}/#organization` },
            }
          : undefined,
      // Note affichée uniquement à partir des avis clients réels
      aggregateRating:
        seo.reviewCount > 0 && seo.ratingAverage
          ? {
              "@type": "AggregateRating",
              ratingValue: Math.round(seo.ratingAverage * 10) / 10,
              reviewCount: seo.reviewCount,
            }
          : undefined,
    };

    return {
      meta: [
        { title: `${seo.name} | ${SITE_NAME}` },
        ...(description ? [{ name: "description", content: description }] : []),
        { property: "og:type", content: "product" },
        { property: "og:title", content: `${seo.name} | ${SITE_NAME}` },
        ...(description ? [{ property: "og:description", content: description }] : []),
        ...(seo.image
          ? [
              { property: "og:image", content: seo.image },
              { name: "twitter:image", content: seo.image },
            ]
          : []),
        { name: "twitter:title", content: `${seo.name} | ${SITE_NAME}` },
        { "script:ld+json": productJsonLd },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <ProductDetailPage slug={slug} />;
}
