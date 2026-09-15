import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "pdf to md - free pdf to md converter online | mdpdf.net",
  description: "Free pdf to md converter. Convert pdf to md online in your browser and turn PDF files into clean Markdown.",
  alternates: {
    canonical: "https://mdpdf.net",
  },
  openGraph: {
    title: "pdf to md - free pdf to md converter online | mdpdf.net",
    description: "Free pdf to md converter. Convert pdf to md online in your browser and turn PDF files into clean Markdown.",
    url: "https://mdpdf.net",
    siteName: "MdPdf",
    type: "website",
    images: [
      {
        url: "https://mdpdf.net/pdf-to-md.png",
        width: 1982,
        height: 1256,
        alt: "Free PDF to MD converter online - convert PDF to Markdown with MdPdf",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pdf to md - free pdf to md converter online | mdpdf.net",
    description: "Free pdf to md converter. Convert pdf to md online in your browser and turn PDF files into clean Markdown.",
    images: ["https://mdpdf.net/pdf-to-md.png"],
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
