import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "md to pdf - md to pdf converter - markdown to pdf - MdPdf",
  description:
    "MdPdf provides a free md to pdf converter that lets you write, preview, and export markdown to pdf directly in your browser. Fast, simple, and accurate.",
  alternates: {
    canonical: "https://mdpdf.net/md-to-pdf",
  },
  openGraph: {
    title: "md to pdf - md to pdf converter - markdown to pdf - MdPdf",
    description:
      "MdPdf provides a free md to pdf converter that lets you write, preview, and export markdown to pdf directly in your browser. Fast, simple, and accurate.",
    url: "https://mdpdf.net/md-to-pdf",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function MdToPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

