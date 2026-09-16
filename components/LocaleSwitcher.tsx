"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { persistExplicitLocale } from "@/i18n/locale-preference";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, routing, type AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const choose = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    persistExplicitLocale(nextLocale);
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="neutral" className="h-10 px-2.5" />}
        aria-label={t("language")}
      >
        <Globe className="size-4" />
        <span className="max-w-[7.5rem] truncate">{localeNames[locale as AppLocale]}</span>
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[min(28rem,70vh)] min-w-[13rem] overflow-auto">
        {routing.locales.map((code) => {
          const selected = code === locale;
          return (
            <DropdownMenuItem key={code} onClick={() => choose(code)}>
              <span>{localeNames[code]}</span>
              {selected ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
