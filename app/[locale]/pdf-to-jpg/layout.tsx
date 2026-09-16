import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.pdfToJpg" });
  return pageMetadata({ locale, href: "/pdf-to-jpg", title: t("title"), description: t("description") });
}

export default function PdfToImageLayout({ children }: Props) {
  return children;
}
