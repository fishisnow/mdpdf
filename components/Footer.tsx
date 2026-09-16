"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="mt-auto border-t-2 border-border bg-secondary-background">
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-foreground/70 sm:gap-6">
              <Link href="/privacy-policy" className="font-heading hover:text-foreground">
                {t("privacyPolicy")}
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/terms-of-service" className="font-heading hover:text-foreground">
                {t("termsOfService")}
              </Link>
              <span aria-hidden="true">•</span>
              <a
                href="http://pixae.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading hover:text-foreground"
              >
                AI Image Creator
              </a>
              <span aria-hidden="true">•</span>
              <a
                href="https://pixae.app/ai-tools/text-to-video"
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading hover:text-foreground"
              >
                AI Video Generator
              </a>
            </div>
          </div>
          <p className="text-sm text-foreground/60">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
