import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "md viewer - live markdown editor online - MdPdf",
  description:
    "Free MD Viewer for live Markdown preview in your browser. Split source and preview, copy, or download a .md file with this MD Viewer.",
  alternates: {
    canonical: "https://mdpdf.net/md-viewer",
  },
  openGraph: {
    title: "md viewer - live markdown editor online - MdPdf",
    description:
      "Free MD Viewer for live Markdown preview in your browser. Split source and preview, copy, or download a .md file with this MD Viewer.",
    url: "https://mdpdf.net/md-viewer",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function MarkdownPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
