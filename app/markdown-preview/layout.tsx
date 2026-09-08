import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "markdown preview - live markdown editor online - MdPdf",
  description:
    "Free Markdown preview. Write Markdown and see a live rendered preview in your browser. Split source and preview, copy, or download a .md file.",
  alternates: {
    canonical: "https://mdpdf.net/markdown-preview",
  },
  openGraph: {
    title: "markdown preview - live markdown editor online - MdPdf",
    description:
      "Free Markdown preview. Write Markdown and see a live rendered preview in your browser. Split source and preview, copy, or download a .md file.",
    url: "https://mdpdf.net/markdown-preview",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function MarkdownPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
