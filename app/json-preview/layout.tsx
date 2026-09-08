import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "json preview - json formatter and tree viewer online - MdPdf",
  description:
    "Free JSON preview and formatter. Validate JSON, pretty-print it, minify it, and inspect a collapsible tree. Everything runs in your browser.",
  alternates: {
    canonical: "https://mdpdf.net/json-preview",
  },
  openGraph: {
    title: "json preview - json formatter and tree viewer online - MdPdf",
    description:
      "Free JSON preview and formatter. Validate JSON, pretty-print it, minify it, and inspect a collapsible tree. Everything runs in your browser.",
    url: "https://mdpdf.net/json-preview",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function JsonPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
