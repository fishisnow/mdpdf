import { listSitemapEntries, renderSitemapXml } from "@/lib/sitemap";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return new Response(renderSitemapXml(listSitemapEntries()), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
