import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to MD & MD to PDF Converter – Free Online Tool",
  description:
    "Convert PDF to MD or MD to PDF instantly with MdPdf. Free, fast, and accurate online converter for seamless Markdown and PDF conversion. No signup required."
};

export default function PdfToMdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

