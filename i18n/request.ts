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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merge locale messages over English so new SEO keys do not break other locales. */
function mergeMessages(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = mergeMessages(existing, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const localeMessages = (await loadMessages[locale]()).default;

  if (locale === "en") {
    return { locale, messages: localeMessages };
  }

  const english = (await loadMessages.en()).default;
  return {
    locale,
    messages: mergeMessages(english, localeMessages),
  };
});
