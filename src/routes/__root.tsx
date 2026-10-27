import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/lib/i18n"; // ← déclenche i18n.init() dès le chargement du module

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { AnnouncementPopup } from "@/components/announcement-popup";
import logo from "@/assets/logo.jpeg";

import { getLocalizedPath } from "@/lib/i18n-routing";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  localizedPath,
  organizationJsonLd,
} from "@/lib/seo";

/** Fond partagé des écrans 404/Erreur : grain discret + halo doré, cohérent avec l'identité de la marque. */
function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      <div className="bg-grain pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative max-w-md text-center">
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
        className="mx-auto h-14 w-14 rounded-full object-cover ring-1 ring-stone-300 dark:ring-stone-700"
      />
      <h1
        className="mt-6 font-display text-8xl text-amber-800 dark:text-gold"
      >
        404
      </h1>
      <h2
        className="mt-4 flex items-center justify-center gap-2 text-xl text-foreground"
      >
        <Compass className="h-5 w-5 text-gold" /> {t("errors.notFoundTitle")}
      </h2>
      <p
        className="mt-2 text-sm text-muted-foreground"
      >
        {t("errors.notFoundDesc")}
      </p>
      <Link
        to={getLocalizedPath("/")}
        className="pressable mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#2c1b11] px-6 py-3 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
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
      <h1 className="mt-6 font-display text-2xl tracking-tight text-foreground">
        {t("errors.pageTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("errors.pageDesc")}</p>
      {error?.message && (
        <p className="mx-auto mt-4 max-w-sm rounded-lg bg-destructive/10 p-3 font-mono text-xs text-destructive break-words">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2c1b11] px-5 py-2.5 text-sm text-stone-50 transition-colors duration-200 hover:bg-[#442a1d] dark:bg-gold dark:text-stone-950"
        >
          <RotateCw className="h-4 w-4" /> {t("errors.retry")}
        </button>
        <Link
          to={getLocalizedPath("/")}
          className="pressable inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm text-foreground transition-colors duration-200 hover:border-stone-500"
        >
          <HomeIcon className="h-4 w-4" /> {t("errors.home")}
        </Link>
      </div>
    </StatusScreen>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ matches }) => {
    // Page en cours (dernière route) : sert à l'URL canonique et aux liens FR/EN
    const pathname = matches[matches.length - 1]?.pathname ?? "/";
    const isLocalized = /^\/(fr|en)(\/|$)/.test(pathname);
    const canonical = `${SITE_URL}${pathname === "/" ? "/fr" : pathname.replace(/\/$/, "")}`;
    const lang = pathname.startsWith("/en") ? "en" : "fr";
    const alternateLinks = isLocalized
      ? [
          { rel: "alternate", hrefLang: "fr", href: `${SITE_URL}${localizedPath(pathname, "fr")}` },
          { rel: "alternate", hrefLang: "en", href: `${SITE_URL}${localizedPath(pathname, "en")}` },
          { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${localizedPath(pathname, "fr")}` },
        ]
      : [];

    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cereals House : Céréales & farines d'Afrique de l'Ouest" },
      {
        name: "description",
        content:
          "Céréales et produits d'Afrique de l'Ouest : mil, fonio, sorgho et farines soigneusement triés, sans sable ni conservateurs. Livraison suivie en Afrique de l'Ouest et diaspora. Paiement sécurisé par Mobile Money et carte.",
      },
      { name: "author", content: "Cereals House" },
      { property: "og:title", content: "Cereals House : Céréales & farines d'Afrique de l'Ouest" },
      {
        property: "og:description",
        content:
          "Céréales et produits d'Afrique de l'Ouest soigneusement triés, sans sable ni conservateurs. Livraison suivie en Afrique de l'Ouest et diaspora.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: canonical },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:locale", content: lang === "en" ? "en_US" : "fr_FR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
      { name: "theme-color", content: "#2c1b11" },
      { name: "twitter:title", content: "Cereals House : Céréales & farines d'Afrique de l'Ouest" },
      {
        name: "twitter:description",
        content:
          "Céréales et produits d'Afrique de l'Ouest soigneusement triés, sans sable ni conservateurs. Livraison suivie en Afrique de l'Ouest et diaspora.",
      },
      { "script:ld+json": organizationJsonLd() },
    ],
    links: [
      { rel: "canonical", href: canonical },
      ...alternateLinks,
      { rel: "icon", type: "image/jpeg", href: "/logo.jpg" },
      { rel: "apple-touch-icon", href: "/logo.jpg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
    };
  },
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
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();
  // Fondu d'entrée bref à chaque navigation, sans remonter l'arbre de la page.
  // Pas d'animation au premier chargement (préserve le LCP).
  const pageRef = useRef<HTMLDivElement>(null);
  const initialPathname = useRef(pathname);
  useEffect(() => {
    if (pathname === initialPathname.current) return;
    initialPathname.current = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    pageRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CountryProvider>
          <CartProvider>
            <div className="flex min-h-dvh flex-col">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-gold-foreground"
              >
                {t("common.skipToContent", "Aller au contenu")}
              </a>
              <SiteHeader />
              <main id="main-content" className="flex-1">
                <div ref={pageRef}>
                  <Outlet />
                </div>
              </main>
              <SiteFooter />
            </div>
            <AnnouncementPopup />
            <Toaster
              position={isMobile ? "bottom-center" : "bottom-right"}
              offset={isMobile ? 16 : 24}
              toastOptions={{
                classNames: {
                  toast:
                    "!rounded-2xl !border !border-stone-200 !bg-[#fbf8f3] !text-stone-900 !font-[inherit] !shadow-[0_12px_32px_-12px_rgba(44,27,17,0.3)] dark:!border-stone-800 dark:!bg-[#1c140e] dark:!text-stone-100",
                  description: "!text-stone-600 dark:!text-stone-400",
                  actionButton: "!rounded-full !bg-[#2c1b11] !text-stone-50 dark:!bg-gold dark:!text-stone-950",
                  error: "!border-red-300 dark:!border-red-900",
                },
              }}
            />
          </CartProvider>
        </CountryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
