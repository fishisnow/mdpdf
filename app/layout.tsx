import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF to MD & MD to PDF",
  description: "MdPdf is a free pdf to md converter. Convert pdf to md online and turn PDF files into clean markdown quickly and accurately.",
  alternates: {
    canonical: "https://mdpdf.net",
  },
  openGraph: {
    title: "PDF to MD & MD to PDF",
    description: "MdPdf is a free pdf to md converter. Convert pdf to md online and turn PDF files into clean markdown quickly and accurately.",
    url: "https://mdpdf.net",
    siteName: "MdPdf",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H29RTX0PPF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H29RTX0PPF');
          `}
        </Script>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
