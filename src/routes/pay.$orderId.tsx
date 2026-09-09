import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import i18n from "@/lib/i18n";

const searchSchema = z.object({ token: z.string().catch("") });

export const Route = createFileRoute("/pay/$orderId")({
  validateSearch: searchSchema,
  beforeLoad: ({ params, search }) => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_lang") : null;
    const lang = saved === "en" || i18n.language === "en" ? "en" : "fr";
    throw redirect({
      to: "/$lang/pay/$orderId",
      params: { lang, orderId: params.orderId },
      search: search.token ? { token: search.token } : undefined,
      replace: true,
    });
  },
  component: () => null,
});
