import { query } from "@/integrations/neon/db.server";
import { SITE_URL } from "@/lib/seo";

const LANGS = ["fr", "en"] as const;
const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "/products", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
];

/** robots.txt : tout le site public est indexable, sauf les espaces privés. */
export function handleRobotsTxt(): Response {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /*/cart",
    "Disallow: /*/checkout",
    "Disallow: /*/orders",
    "Disallow: /*/pay/",
    "Disallow: /*/auth",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(path: string, opts: { lastmod?: string; priority: string; changefreq: string }): string {
  return LANGS.map((lang) => {
    const loc = `${SITE_URL}/${lang}${path}`;
    const alternates = LANGS.map(
      (alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${escapeXml(`${SITE_URL}/${alt}${path}`)}"/>`,
    ).join("\n");
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      alternates,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/fr${path}`)}"/>`,
      opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : "",
      `    <changefreq>${opts.changefreq}</changefreq>`,
      `    <priority>${opts.priority}</priority>`,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  }).join("\n");
}

/** sitemap.xml : pages principales + tous les produits actifs (FR et EN). */
export async function handleSitemapXml(): Promise<Response> {
  let products: { slug: string; updated_at: string | Date | null }[] = [];
  try {
    products = await query<{ slug: string; updated_at: string | Date | null }>(
      `SELECT slug, updated_at FROM products WHERE is_active = true ORDER BY name`,
    );
  } catch (err) {
    // La base est indisponible : on publie quand même les pages principales.
    console.error("[sitemap] lecture des produits impossible", err);
  }

  const entries = [
    ...STATIC_PAGES.map((p) => urlEntry(p.path, p)),
    ...products.map((p) =>
      urlEntry(`/products/${encodeURIComponent(p.slug)}`, {
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
        priority: "0.8",
        changefreq: "weekly",
      }),
    ),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
