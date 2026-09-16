import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  EXPLICIT_LOCALE_COOKIE,
  isAppLocale,
  isCrawlerUserAgent,
  matchLocaleFromHeader,
} from "./i18n/locale-preference";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const locale = resolveHomepageLocale(request);
    if (locale !== routing.defaultLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

function resolveHomepageLocale(request: NextRequest) {
  if (isCrawlerUserAgent(request.headers.get("user-agent"))) {
    return routing.defaultLocale;
  }

  const explicit = request.cookies.get(EXPLICIT_LOCALE_COOKIE)?.value;
  if (isAppLocale(explicit)) {
    return explicit;
  }

  return matchLocaleFromHeader(request.headers.get("accept-language"));
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
