import { locales, type AppLocale } from "./routing";

export const EXPLICIT_LOCALE_COOKIE = "mdpdf-locale";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const BOT_UA =
  /googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|slackbot|linkedinbot|applebot|semrushbot|ahrefsbot|dotbot|duckduckbot|bytespider|petalbot|gptbot|claudebot|ccbot/i;

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function isCrawlerUserAgent(userAgent: string | null): boolean {
  return !!userAgent && BOT_UA.test(userAgent);
}

export function matchLocaleFromHeader(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) return "en";

  const tags = acceptLanguage
    .split(",")
    .map((part) => {
      const [rawTag, rawQ] = part.trim().split(";");
      const quality = rawQ?.toLowerCase().startsWith("q=") ? Number(rawQ.slice(2)) : 1;
      return { tag: rawTag.trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of tags) {
    const matched = matchTag(tag);
    if (matched) return matched;
  }

  return "en";
}

function matchTag(tag: string): AppLocale | null {
  if (tag.startsWith("zh-hant") || tag.startsWith("zh-tw") || tag.startsWith("zh-hk") || tag.startsWith("zh-mo")) {
    return "zh-TW";
  }
  if (tag === "zh" || tag.startsWith("zh-")) return "zh";
  if (tag === "ja" || tag.startsWith("ja-")) return "ja";
  if (tag === "ko" || tag.startsWith("ko-")) return "ko";
  if (tag === "ru" || tag.startsWith("ru-")) return "ru";
  if (tag === "es" || tag.startsWith("es-")) return "es";
  if (tag === "fr" || tag.startsWith("fr-")) return "fr";
  if (tag === "de" || tag.startsWith("de-")) return "de";
  if (tag === "ar" || tag.startsWith("ar-")) return "ar";
  if (tag === "pt" || tag.startsWith("pt-")) return "pt";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  return null;
}

export function persistExplicitLocale(locale: AppLocale) {
  document.cookie = `${EXPLICIT_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
