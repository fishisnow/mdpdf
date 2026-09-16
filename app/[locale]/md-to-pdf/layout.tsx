import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.mdToPdf" });
  return pageMetadata({ locale, href: "/md-to-pdf", title: t("title"), description: t("description") });
}

export default function MdToPdfLayout({ children }: Props) {
  return children;
}
