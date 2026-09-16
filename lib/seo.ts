import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { localeOg, routing, type AppLocale } from "@/i18n/routing";

export const SITE_URL = "https://mdpdf.net";

export const PAGE_PATHS = [
  "/",
  "/md-to-pdf",
  "/pdf-to-jpg",
  "/md-viewer",
  "/json-viewer",
  "/text-replacer",
  "/privacy-policy",
  "/terms-of-service",
] as const;

export type PagePath = (typeof PAGE_PATHS)[number];

export function localizedUrl(locale: string, href: PagePath): string {
  const path = getPathname({ locale: locale as AppLocale, href });
  return `${SITE_URL}${path}`;
}

export function languageAlternates(href: PagePath): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": localizedUrl(routing.defaultLocale, href),
  };
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, href);
  }
  return languages;
}

export function pageMetadata(input: {
  locale: string;
  href: PagePath;
  title: string;
  description: string;
  type?: "website" | "article";
}): Metadata {
  const url = localizedUrl(input.locale, input.href);
  const ogLocale = localeOg[input.locale as AppLocale] ?? "en_US";

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      languages: languageAlternates(input.href),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "MdPdf",
      type: input.type ?? "website",
      locale: ogLocale,
      images: [
        {
          url: "https://mdpdf.net/pdf-to-md.png",
          width: 1982,
          height: 1256,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: ["https://mdpdf.net/pdf-to-md.png"],
    },
  };
}
