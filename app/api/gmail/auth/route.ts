import { NextRequest, NextResponse } from "next/server";

import { GMAIL_ERRORS } from "@/lib/api/errors";
import { getRequestId } from "@/lib/api/request-id";
import { apiError } from "@/lib/api/response";
import { getGmailAuthUrl, isGmailConfigured } from "@/lib/integrations/gmail";
import { createLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("gmail.auth", requestId);

  log.info("request.start");

  if (!isGmailConfigured()) {
    log.warn("gmail.not_configured");
    const accept = request.headers.get("accept") ?? "";
    const spec = GMAIL_ERRORS.GMAIL_NOT_CONFIGURED;

    if (accept.includes("text/html")) {
      const redirect = new URL("/demo", request.url);
      redirect.searchParams.set("gmail_error", "not_configured");
      redirect.searchParams.set("requestId", requestId);
      return NextResponse.redirect(redirect);
    }

    return apiError(
      requestId,
      "GMAIL_NOT_CONFIGURED",
      spec.message,
      spec.suggestion,
      spec.status,
    );
  }

  try {
    const url = getGmailAuthUrl();
    log.info("redirect.oauth", { configured: true });
    const response = NextResponse.redirect(url);
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    log.error("oauth.url.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const spec = GMAIL_ERRORS.GMAIL_OAUTH_FAILED;
    return apiError(
      requestId,
      "GMAIL_OAUTH_FAILED",
      spec.message,
      spec.suggestion,
      spec.status,
    );
  }
}