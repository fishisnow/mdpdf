"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 sm:gap-6">
              <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">
                {t("privacyPolicy")}
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/terms-of-service" className="hover:text-gray-700 transition-colors">
                {t("termsOfService")}
              </Link>
              <span className="text-gray-300">•</span>
              <a
                href="http://pixae.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                AI Image Creator
              </a>
              <span className="text-gray-300">•</span>
              <a
                href="https://pixae.app/ai-tools/text-to-video"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors"
              >
                AI Video Generator
              </a>
            </div>
            <p className="text-sm text-gray-400">{t("copyright", { year: 2026 })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
