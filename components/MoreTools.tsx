"use client";

import Link from "next/link";
import { SITE_TOOLS, type SiteToolHref } from "@/lib/tools";

const accentClass: Record<(typeof SITE_TOOLS)[number]["accent"], { box: string; icon: string; hover: string; title: string }> = {
  blue: {
    box: "bg-blue-100",
    icon: "text-blue-600",
    hover: "hover:border-blue-200",
    title: "group-hover:text-blue-600",
  },
  indigo: {
    box: "bg-indigo-100",
    icon: "text-indigo-600",
    hover: "hover:border-indigo-200",
    title: "group-hover:text-indigo-600",
  },
  sky: {
    box: "bg-sky-100",
    icon: "text-sky-600",
    hover: "hover:border-sky-200",
    title: "group-hover:text-sky-600",
  },
  emerald: {
    box: "bg-emerald-100",
    icon: "text-emerald-600",
    hover: "hover:border-emerald-200",
    title: "group-hover:text-emerald-600",
  },
  amber: {
    box: "bg-amber-100",
    icon: "text-amber-600",
    hover: "hover:border-amber-200",
    title: "group-hover:text-amber-600",
  },
  rose: {
    box: "bg-rose-100",
    icon: "text-rose-600",
    hover: "hover:border-rose-200",
    title: "group-hover:text-rose-600",
  },
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
  if (href === "/markdown-preview") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  if (href === "/json-preview") {
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

export default function MoreTools({ currentHref, heading = "More tools" }: { currentHref: SiteToolHref; heading?: string }) {
  const tools = SITE_TOOLS.filter((tool) => tool.href !== currentHref);

  return (
    <section className="mt-12 mb-12 sm:mt-16 sm:mb-16">
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:mb-8">{heading}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const colors = accentClass[tool.accent];
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all ${colors.hover} hover:shadow-md sm:p-6`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.box}`}>
                  <ToolIcon href={tool.href} className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="min-w-0">
                  <span className={`block font-semibold text-gray-900 transition-colors ${colors.title}`}>
                    {tool.cardTitle} →
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{tool.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
