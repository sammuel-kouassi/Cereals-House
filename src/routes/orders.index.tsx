import { createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/orders/")({
  beforeLoad: () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_lang") : null;
    const lang = saved === "en" || i18n.language === "en" ? "en" : "fr";
    throw redirect({
      to: "/$lang/orders",
      params: { lang },
      replace: true,
    });
  },
  component: () => null,
});
