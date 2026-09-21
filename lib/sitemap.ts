import { routing } from "@/i18n/routing";
import { languageAlternates, localizedUrl, PAGE_PATHS, type PagePath } from "@/lib/seo";

export type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "weekly";
  priority: number;
  languages: Record<string, string>;
};

const priorities: Record<PagePath, number> = {
  "/": 1,
  "/md-to-pdf": 0.9,
  "/pdf-to-jpg": 0.9,
  "/md-viewer": 0.8,
  "/md-diff": 0.8,
  "/json-viewer": 0.8,
  "/text-replacer": 0.8,
  "/privacy-policy": 0.3,
  "/terms-of-service": 0.3,
};

export function listSitemapEntries(): SitemapEntry[] {
  const lastModified = new Date().toISOString().slice(0, 10);
  const publicRoutes = PAGE_PATHS.filter((href) => href !== "/privacy-policy" && href !== "/terms-of-service");

  return publicRoutes.flatMap((href) => {
    const languages = languageAlternates(href);
    return routing.locales.map((locale) => ({
      url: localizedUrl(locale, href),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: priorities[href],
      languages,
    }));
  });
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const alternates = Object.entries(entry.languages)
        .map(
          ([lang, href]) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`,
        )
        .join("\n");

      return `<url>
  <loc>${escapeXml(entry.url)}</loc>
${alternates}
  <lastmod>${escapeXml(entry.lastModified)}</lastmod>
  <changefreq>${entry.changeFrequency}</changefreq>
  <priority>${entry.priority}</priority>
</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}
