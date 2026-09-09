import { createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/products/$slug")({
  beforeLoad: ({ params }) => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_lang") : null;
    const lang = saved === "en" || i18n.language === "en" ? "en" : "fr";
    throw redirect({
      to: "/$lang/products/$slug",
      params: { lang, slug: params.slug },
      replace: true,
    });
  },
  component: () => null,
});
