import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    const raw = params.lang?.toLowerCase();
    if (raw !== "fr" && raw !== "en") {
      throw redirect({
        to: "/$lang",
        params: { lang: "fr" },
        replace: true,
      });
    }
    if (typeof window !== "undefined" && i18n.language !== raw) {
      i18n.changeLanguage(raw);
    }
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();

  useEffect(() => {
    const validLang = lang === "en" ? "en" : "fr";
    if (i18n.language !== validLang) {
      i18n.changeLanguage(validLang);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_lang", validLang);
      document.documentElement.lang = validLang;
    }
  }, [lang]);

  return <Outlet />;
}
