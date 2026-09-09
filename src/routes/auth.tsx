import { createFileRoute, redirect } from "@tanstack/react-router";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ch_lang") : null;
    const lang = saved === "en" || i18n.language === "en" ? "en" : "fr";
    throw redirect({
      to: "/$lang/auth",
      params: { lang },
      search: search.redirect ? { redirect: search.redirect } : undefined,
      replace: true,
    });
  },
  component: () => null,
});
