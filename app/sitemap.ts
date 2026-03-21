import { MetadataRoute } from "next";

const routes = [
  {
    url: "https://mdpdf.net",
    priority: 1,
  },
  {
    url: "https://mdpdf.net/md-to-pdf",
    priority: 0.9,
  },
  {
    url: "https://mdpdf.net/privacy-policy",
    priority: 0.4,
  },
  {
    url: "https://mdpdf.net/terms-of-service",
    priority: 0.4,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: route.url,
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
