export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/privacy-policy", "/terms-of-service"],
    },
    sitemap: "https://mdpdf.net/sitemap.xml",
  };
}
