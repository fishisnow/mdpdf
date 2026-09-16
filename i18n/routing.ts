import { defineRouting } from "next-intl/routing";

export const locales = ["en", "zh", "zh-TW", "ja", "ko", "ru", "es", "fr", "de", "ar", "pt"] as const;

export type AppLocale = (typeof locales)[number];

export const localeNames: Record<AppLocale, string> = {
  en: "English",
  zh: "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ar: "العربية",
  pt: "Português",
};

export const localeHtmlLang: Record<AppLocale, string> = {
  en: "en",
  zh: "zh-CN",
  "zh-TW": "zh-TW",
  ja: "ja",
  ko: "ko",
  ru: "ru",
  es: "es",
  fr: "fr",
  de: "de",
  ar: "ar",
  pt: "pt",
};

export const localeOg: Record<AppLocale, string> = {
  en: "en_US",
  zh: "zh_CN",
  "zh-TW": "zh_TW",
  ja: "ja_JP",
  ko: "ko_KR",
  ru: "ru_RU",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ar: "ar_AR",
  pt: "pt_BR",
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});
