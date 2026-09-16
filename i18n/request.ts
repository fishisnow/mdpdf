import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";

const loadMessages: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("../messages/en.json"),
  zh: () => import("../messages/zh.json"),
  "zh-TW": () => import("../messages/zh-TW.json"),
  ja: () => import("../messages/ja.json"),
  ko: () => import("../messages/ko.json"),
  ru: () => import("../messages/ru.json"),
  es: () => import("../messages/es.json"),
  fr: () => import("../messages/fr.json"),
  de: () => import("../messages/de.json"),
  ar: () => import("../messages/ar.json"),
  pt: () => import("../messages/pt.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await loadMessages[locale]()).default,
  };
});
