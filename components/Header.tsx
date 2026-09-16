"use client";

import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { SITE_TOOLS } from "@/lib/tools";

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations("tools");

  return (
    <header className="border-b-2 border-border bg-secondary-background">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-base border-2 border-border bg-main px-2.5 py-1 text-2xl font-heading text-main-foreground shadow-shadow sm:text-3xl"
          >
            MdPdf
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {SITE_TOOLS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: isActive ? "default" : "neutral", size: "sm" }),
                    "text-sm",
                  )}
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
