import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF to Markdown",
  description: "Convert PDF files to Markdown online",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
