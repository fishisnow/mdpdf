import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "pdf to jpg - pdf to png converter free online - MdPdf",
  description:
    "Free PDF to JPG converter and PDF to PNG converter. Convert PDF to JPG or convert PDF to PNG online in your browser for faster exports and better privacy.",
  alternates: {
    canonical: "https://mdpdf.net/pdf-to-jpg",
  },
  openGraph: {
    title: "pdf to jpg - pdf to png converter free online - MdPdf",
    description:
      "Free PDF to JPG converter and PDF to PNG converter. Convert PDF to JPG or convert PDF to PNG online in your browser for faster exports and better privacy.",
    url: "https://mdpdf.net/pdf-to-jpg",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function PdfToImageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
