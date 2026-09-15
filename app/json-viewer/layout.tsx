import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "json viewer - json formatter and tree viewer online - MdPdf",
  description:
    "Free JSON Viewer and formatter. Validate JSON, pretty-print it, minify it, and inspect a collapsible tree in this JSON Viewer. Everything runs in your browser.",
  alternates: {
    canonical: "https://mdpdf.net/json-viewer",
  },
  openGraph: {
    title: "json viewer - json formatter and tree viewer online - MdPdf",
    description:
      "Free JSON Viewer and formatter. Validate JSON, pretty-print it, minify it, and inspect a collapsible tree in this JSON Viewer. Everything runs in your browser.",
    url: "https://mdpdf.net/json-viewer",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function JsonPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
