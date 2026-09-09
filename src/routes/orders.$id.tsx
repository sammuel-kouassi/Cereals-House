import { createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/orders/$id")({
  beforeLoad: ({ params }) => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_lang") : null;
    const lang = saved === "en" || i18n.language === "en" ? "en" : "fr";
    throw redirect({
      to: "/$lang/orders/$id",
      params: { lang, id: params.id },
      replace: true,
    });
  },
  component: () => null,
});
