import { NextRequest, NextResponse } from "next/server";

import { exchangeGmailCode, isGmailConfigured } from "@/lib/integrations/gmail";

export async function GET(request: NextRequest) {
  if (!isGmailConfigured()) {
    return NextResponse.redirect(new URL("/demo?gmail_error=not_configured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/demo?gmail_error=no_code", request.url));
  }

  try {
    const tokens = await exchangeGmailCode(code);
    const redirect = new URL("/demo", request.url);
    redirect.searchParams.set("gmail_connected", "1");

    const response = NextResponse.redirect(redirect);

    if (tokens.access_token) {
      response.cookies.set("gmail_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/demo?gmail_error=oauth_failed", request.url));
  }
}