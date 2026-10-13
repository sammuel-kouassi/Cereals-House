import "./lib/error-capture";

// Force IPv4 en priorité pour toutes les résolutions DNS sortantes. Utile
// surtout en développement local (npm run dev, environnement Node.js) : si
// le réseau de la machine dispose à la fois d'IPv4 et d'IPv6, Node peut
// choisir IPv6 pour joindre l'API CinetPay — une adresse différente de
// celle whitelistée côté CinetPay, provoquant un rejet "IP non autorisée"
// même quand l'IPv4 est correctement configurée. Sans effet en production
// sur Cloudflare Workers (runtime différent, ce réglage Node est ignoré
// silencieusement — donc aucun risque à le laisser en place partout).
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleCinetPayNotify, handleCinetPayReturn } from "./lib/payments/cinetpay.webhook.server";
import { handlePaystackWebhook } from "./lib/payments/paystack.webhook.server";
import { handleGeniusPayWebhook } from "./lib/payments/geniuspay.webhook.server";
import { handleInvoicePdfDownload } from "./lib/receipt/download-invoice.server";
import { handleRobotsTxt, handleSitemapXml } from "./lib/seo/sitemap.server";

// Anciennes adresses sans langue (avant l'ajout de /fr et /en)
const LEGACY_PATH = /^\/(about|contact|cart|checkout|auth|products(\/[^/]+)?|orders(\/[^/]+)?|pay\/[^/]+)$/;

/** Adresse officielle vers laquelle rediriger, ou null si l'adresse est déjà la bonne. */
function canonicalRedirectPath(pathname: string): string | null {
  if (pathname === "/") return "/fr";
  // Barre finale : /fr/ -> /fr, /fr/products/ -> /fr/products
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const trimmed = pathname.replace(/\/+$/, "") || "/";
    return canonicalRedirectPath(trimmed) ?? trimmed;
  }
  // Langue en majuscules : /FR/... -> /fr/...
  const langMatch = pathname.match(/^\/(fr|en)(?=\/|$)/i);
  if (langMatch && langMatch[1] !== langMatch[1].toLowerCase()) {
    return `/${langMatch[1].toLowerCase()}${pathname.slice(3)}`;
  }
  if (LEGACY_PATH.test(pathname)) return `/fr${pathname}`;
  return null;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Callbacks CinetPay & Paystack, et téléchargement PDF direct
      const { pathname } = new URL(request.url);

      // Référencement : servis avant le routeur (sinon redirigés vers /fr/...)
      if (pathname === "/robots.txt") return handleRobotsTxt();
      if (pathname === "/sitemap.xml") return await handleSitemapXml();

      // Redirections permanentes (301) vers l'adresse officielle de chaque page.
      // Une redirection temporaire (307) fait garder l'ancienne adresse par Google.
      if (request.method === "GET" || request.method === "HEAD") {
        const canonicalPath = canonicalRedirectPath(pathname);
        if (canonicalPath) {
          const { origin, search } = new URL(request.url);
          return Response.redirect(`${origin}${canonicalPath}${search}`, 301);
        }
      }

      if (pathname === "/api/geniuspay/webhook" || pathname === "/api/webhooks/geniuspay") {
        return await handleGeniusPayWebhook(request);
      }
      if (pathname === "/api/paystack/webhook") {
        return await handlePaystackWebhook(request);
      }
      if (pathname === "/api/cinetpay/notify") {
        return await handleCinetPayNotify(request);
      }
      if (pathname === "/api/cinetpay/return") {
        return await handleCinetPayReturn(request);
      }

      // Téléchargement / prévisualisation de la facture PDF
      const invoiceMatch = pathname.match(/^\/api\/invoices\/([a-zA-Z0-9_-]+)(\.pdf)?$/);
      if (invoiceMatch && request.method === "GET") {
        return await handleInvoicePdfDownload(invoiceMatch[1]);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
