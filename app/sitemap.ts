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
    url: "https://mdpdf.net/pdf-to-jpg",
    priority: 0.9,
  },
  {
    url: "https://mdpdf.net/markdown-preview",
    priority: 0.8,
  },
  {
    url: "https://mdpdf.net/json-preview",
    priority: 0.8,
  },
  {
    url: "https://mdpdf.net/text-replacer",
    priority: 0.8,
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
