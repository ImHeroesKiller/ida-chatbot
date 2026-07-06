import { NextRequest } from "next/server";

import { getRequestId } from "@/lib/api/request-id";
import { jsonWithRequestId } from "@/lib/api/response";
import { isGmailConfigured } from "@/lib/integrations/gmail";
import { createLogger } from "@/lib/logger";
import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("health", requestId);

  const checks: Record<string, string> = {
    runtime: "ok",
    gmail: isGmailConfigured() ? "configured" : "not_configured",
  };

  try {
    await hydrateESLStore();
    const snapshot = eslStore.getSnapshot();
    checks.esl = "ok";
    checks.persistence = "ok";
    log.info("health.ok", { counts: snapshot.counts });

    return jsonWithRequestId(
      {
        success: true,
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
        checks,
        eslCounts: snapshot.counts,
      },
      requestId,
    );
  } catch (error) {
    checks.esl = "error";
    log.error("health.degraded", {
      error: error instanceof Error ? error.message : String(error),
    });

    return jsonWithRequestId(
      {
        success: true,
        status: "degraded",
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
        checks,
        error: error instanceof Error ? error.message : "ESL check failed",
      },
      requestId,
      { status: 503 },
    );
  }
}