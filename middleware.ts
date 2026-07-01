import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function isPublicLocalizedPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") {
    return true;
  }

  return routing.locales.some(
    (locale) =>
      pathname === `/${locale}` ||
      pathname === `/${locale}/privacy` ||
      pathname === `/${locale}/terms`,
  );
}

function isAuthProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/account") ||
    pathname === "/auth/callback"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthProtectedPath(pathname)) {
    return updateSession(request);
  }

  if (isPublicLocalizedPath(pathname)) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/(id|en|zh)/:path*",
    "/privacy",
    "/terms",
    "/chat/:path*",
    "/agent/:path*",
    "/account/:path*",
    "/auth/callback",
  ],
};