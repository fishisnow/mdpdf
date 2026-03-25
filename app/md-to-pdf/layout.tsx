import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "md to pdf - md to pdf converter - markdown to pdf - MdPdf",
  description:
    "Free md to pdf converter. Convert md to pdf online in your browser with a free md to pdf converter that is fast, private, and easy to use.",
  alternates: {
    canonical: "https://mdpdf.net/md-to-pdf",
  },
  openGraph: {
    title: "md to pdf - md to pdf converter - markdown to pdf - MdPdf",
    description:
      "Free md to pdf converter. Convert md to pdf online in your browser with a free md to pdf converter that is fast, private, and easy to use.",
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

