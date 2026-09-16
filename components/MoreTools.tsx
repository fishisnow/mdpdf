"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_TOOLS, type SiteToolHref } from "@/lib/tools";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const accentClass: Record<(typeof SITE_TOOLS)[number]["accent"], string> = {
  blue: "bg-main",
  indigo: "bg-chart-5",
  sky: "bg-chart-1",
  emerald: "bg-chart-4",
  violet: "bg-chart-5",
  amber: "bg-chart-3",
  rose: "bg-chart-2",
};

function ToolIcon({ href, className }: { href: SiteToolHref; className: string }) {
  if (href === "/md-to-pdf") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  if (href === "/pdf-to-jpg") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (href === "/md-viewer") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  if (href === "/md-diff") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h5M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      </svg>
    );
  }
  if (href === "/json-viewer") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (href === "/text-replacer") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

export default function MoreTools({ currentHref }: { currentHref: SiteToolHref }) {
  const t = useTranslations();
  const tools = SITE_TOOLS.filter((tool) => tool.href !== currentHref);

  return (
    <section className="mt-12 mb-12 sm:mt-16 sm:mb-16">
      <h2 className="mb-6 text-center text-2xl font-heading sm:mb-8">{t("common.moreTools")}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group block">
            <Card size="sm" className="h-full bg-secondary-background transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none">
              <CardHeader className="grid-cols-[auto_1fr] gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-base border-2 border-border ${accentClass[tool.accent]}`}>
                  <ToolIcon href={tool.href} className="size-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{t(`tools.${tool.id}.card`)} →</CardTitle>
                  <CardDescription className="mt-1 text-foreground/70">{t(`tools.${tool.id}.description`)}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
