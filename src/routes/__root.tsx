import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/lib/i18n"; // ← déclenche i18n.init() dès le chargement du module

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "sonner";
import { Compass, RotateCw, Home as HomeIcon } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { CountryProvider } from "@/lib/country-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import logo from "@/assets/logo.jpeg";

/** Fond partagé des écrans 404/Erreur : grain discret + halo doré, cohérent avec l'identité de la marque. */
function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.08] blur-3xl" />
      <div className="relative max-w-md text-center motion-safe:animate-[fade-in_0.6s_ease-out_both]">
        {children}
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <StatusScreen>
      <img
        src={logo}
        alt="Cereals House"
        className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-gold/40 motion-safe:animate-[fade-in_0.5s_ease-out_both]"
      />
      <h1
        className="mt-6 font-display text-8xl font-bold text-gradient-gold motion-safe:animate-[fade-in_0.6s_ease-out_both]"
        style={{ animationDelay: "80ms" }}
      >
        404
      </h1>
      <h2
        className="mt-4 flex items-center justify-center gap-2 text-xl font-semibold text-foreground motion-safe:animate-[fade-in_0.6s_ease-out_both]"
        style={{ animationDelay: "140ms" }}
      >
        <Compass className="h-5 w-5 text-gold" /> {t("errors.notFoundTitle")}
      </h2>
      <p
        className="mt-2 text-sm text-muted-foreground motion-safe:animate-[fade-in_0.6s_ease-out_both]"
        style={{ animationDelay: "200ms" }}
      >
        {t("errors.notFoundDesc")}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90 hover:shadow-[0_20px_50px_-15px_rgba(212,175,55,0.6)] motion-safe:animate-[fade-in_0.6s_ease-out_both]"
        style={{ animationDelay: "260ms" }}
      >
        <HomeIcon className="h-4 w-4" /> {t("errors.backHome")}
      </Link>
    </StatusScreen>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <StatusScreen>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <RotateCw className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">
        {t("errors.pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("errors.pageDesc")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/90"
        >
          <RotateCw className="h-4 w-4" /> {t("errors.retry")}
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          <HomeIcon className="h-4 w-4" /> {t("errors.home")}
        </Link>
      </div>
    </StatusScreen>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cereals House — Céréales africaines premium" },
      {
        name: "description",
        content:
          "Achetez en ligne du riz parfumé, mil, fonio, maïs, sorgho et plus. Livraison en Afrique de l'Ouest, France et USA. Paiement Mobile Money & Visa.",
      },
      { name: "author", content: "Cereals House" },
      { property: "og:title", content: "Cereals House — Céréales africaines premium" },
      {
        property: "og:description",
        content:
          "Cereals House Express is an e-commerce platform for purchasing a variety of cereals online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cereals House — Céréales africaines premium" },
      {
        name: "description",
        content:
          "Cereals House Express is an e-commerce platform for purchasing a variety of cereals online.",
      },
      {
        name: "twitter:description",
        content:
          "Cereals House Express is an e-commerce platform for purchasing a variety of cereals online.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Plus besoin de LanguageProvider : i18n est déjà initialisé via l'import en haut du fichier
function RootShell({ children }: { children: ReactNode }) {
  return <HtmlShell>{children}</HtmlShell>;
}

function HtmlShell({ children }: { children: ReactNode }) {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "fr";
  return (
    <html lang={lang}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CountryProvider>
          <CartProvider>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <main className="flex-1">
                <Outlet />
              </main>
              <SiteFooter />
            </div>
            <Toaster position="top-right" richColors />
          </CartProvider>
        </CountryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
