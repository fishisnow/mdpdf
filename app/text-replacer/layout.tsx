import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "text replacer - replace \\n with newlines online - MdPdf",
  description:
    "Free text replacer. Replace characters or strings in your browser, including turning literal \\n into real line breaks. Nothing is uploaded.",
  alternates: {
    canonical: "https://mdpdf.net/text-replacer",
  },
  openGraph: {
    title: "text replacer - replace \\n with newlines online - MdPdf",
    description:
      "Free text replacer. Replace characters or strings in your browser, including turning literal \\n into real line breaks. Nothing is uploaded.",
    url: "https://mdpdf.net/text-replacer",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function TextReplacerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
