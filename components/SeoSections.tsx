"use client";

import { useTranslations } from "next-intl";

type SeoSectionItem = {
  title: string;
  body: string | string[];
};

export type SeoSection = {
  title: string;
  body?: string | string[];
  items?: SeoSectionItem[];
};

function paragraphList(body?: string | string[]): string[] {
  if (!body) return [];
  return Array.isArray(body) ? body.filter(Boolean) : [body];
}

function sectionId(title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `guide-${index + 1}-${slug || "section"}`;
}

function itemGridClass(count: number): string {
  if (count === 1) return "grid gap-4";
  if (count % 3 === 0) return "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
  return "grid gap-4 md:grid-cols-2";
}

export default function SeoSections({
  sections,
  className = "",
}: {
  sections: SeoSection[];
  className?: string;
}) {
  const t = useTranslations("common");

  if (!sections?.length) return null;

  return (
    <div className={`space-y-8 text-left sm:space-y-10 ${className}`.trim()}>
      {sections.length > 1 && (
        <nav
          aria-label={t("guide")}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            {t("guide")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#${sectionId(section.title, index)}`}
                  className="inline-flex max-w-full items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="mr-2 shrink-0 font-mono text-[11px] text-gray-400">{String(index + 1).padStart(2, "0")}</span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {sections.map((section, index) => {
        const paragraphs = paragraphList(section.body);
        const items = section.items ?? [];
        const id = sectionId(section.title, index);

        return (
          <section
            key={id}
            id={id}
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="border-l-[3px] border-blue-500 px-5 py-6 sm:px-8 sm:py-8">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">{section.title}</h2>

              {paragraphs.length > 0 && (
                <div className="mt-4 max-w-4xl space-y-4 text-[15px] leading-7 text-gray-600 sm:text-base sm:leading-8">
                  {paragraphs.map((paragraph, paragraphIndex) => (
                    <p
                      key={`${id}-p-${paragraphIndex}`}
                      className={paragraphIndex === 0 ? "text-gray-700" : undefined}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className={`mt-6 ${itemGridClass(items.length)}`}>
                  {items.map((item) => (
                    <article
                      key={item.title}
                      className="flex h-full flex-col rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5"
                    >
                      <h3 className="text-base font-semibold leading-snug text-gray-900">{item.title}</h3>
                      <div className="mt-2 space-y-2.5 text-sm leading-7 text-gray-600">
                        {paragraphList(item.body).map((paragraph, paragraphIndex) => (
                          <p key={`${item.title}-${paragraphIndex}`}>{paragraph}</p>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
