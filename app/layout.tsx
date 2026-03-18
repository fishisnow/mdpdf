import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF to MD & MD to PDF Converter – Free Online Tool",
  description: "Convert PDF to MD or MD to PDF instantly with MdPdf. Free, fast, and accurate online converter for seamless Markdown and PDF conversion. No signup required.",
  alternates: {
    canonical: "https://mdpdf.net",
  },
  openGraph: {
    title: "PDF to MD & MD to PDF Converter – Free Online Tool",
    description: "Convert PDF to MD and MD to PDF instantly with MdPdf. Fast, accurate, and free online converter.",
    url: "https://mdpdf.net",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
