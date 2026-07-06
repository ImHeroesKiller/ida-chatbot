import { NextRequest, NextResponse } from "next/server";

import { getRequestId } from "@/lib/api/request-id";
import { exchangeGmailCode, isGmailConfigured } from "@/lib/integrations/gmail";
import { createLogger } from "@/lib/logger";

function redirectWithGmailError(
  request: NextRequest,
  error: string,
  requestId: string,
): NextResponse {
  const redirect = new URL("/demo", request.url);
  redirect.searchParams.set("gmail_error", error);
  redirect.searchParams.set("requestId", requestId);
  const response = NextResponse.redirect(redirect);
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("gmail.callback", requestId);

  log.info("request.start");

  if (!isGmailConfigured()) {
    log.warn("gmail.not_configured");
    return redirectWithGmailError(request, "not_configured", requestId);
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    log.warn("oauth.denied", { error: oauthError });
    const code = oauthError === "access_denied" ? "access_denied" : "oauth_failed";
    return redirectWithGmailError(request, code, requestId);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    log.warn("oauth.no_code");
    return redirectWithGmailError(request, "no_code", requestId);
  }

  try {
    log.debug("oauth.exchange.start");
    const tokens = await exchangeGmailCode(code);
    log.info("oauth.exchange.done", { hasToken: !!tokens.access_token });

    const redirect = new URL("/demo", request.url);
    redirect.searchParams.set("gmail_connected", "1");
    redirect.searchParams.set("requestId", requestId);

    const response = NextResponse.redirect(redirect);
    response.headers.set("x-request-id", requestId);

    if (tokens.access_token) {
      response.cookies.set("gmail_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
    }

    log.info("request.success");
    return response;
  } catch (error) {
    log.error("oauth.exchange.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return redirectWithGmailError(request, "oauth_failed", requestId);
  }
}