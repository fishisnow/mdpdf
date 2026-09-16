import type { MetadataRoute } from "next";
import { languageAlternates, localizedUrl, PAGE_PATHS } from "@/lib/seo";

const priorities: Record<(typeof PAGE_PATHS)[number], number> = {
  "/": 1,
  "/md-to-pdf": 0.9,
  "/pdf-to-jpg": 0.9,
  "/md-viewer": 0.8,
  "/json-viewer": 0.8,
  "/text-replacer": 0.8,
  "/privacy-policy": 0.3,
  "/terms-of-service": 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const publicRoutes = PAGE_PATHS.filter((href) => href !== "/privacy-policy" && href !== "/terms-of-service");

  return publicRoutes.map((href) => ({
    url: localizedUrl("en", href),
    lastModified,
    changeFrequency: "weekly",
    priority: priorities[href],
    alternates: {
      languages: languageAlternates(href),
    },
  }));
}
