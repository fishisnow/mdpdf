"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { SITE_TOOLS } from "@/lib/tools";

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations("tools");

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              MdPdf
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {SITE_TOOLS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {t(`${item.id}.nav`)}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex shrink-0 items-center">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
