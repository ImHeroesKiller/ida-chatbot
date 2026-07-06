import { NextRequest } from "next/server";

import { GMAIL_ERRORS } from "@/lib/api/errors";
import { getRequestId } from "@/lib/api/request-id";
import { apiError, jsonWithRequestId } from "@/lib/api/response";
import { buildRealityViewModel } from "@/lib/enterprise/reality-adapter";
import { fetchRecentEmails, isGmailConfigured } from "@/lib/integrations/gmail";
import { createLogger } from "@/lib/logger";
import { hydrateESLStore } from "@ida/esl/persistence";
import { runESLPipelineFromEmails } from "@ida/esl/pipeline";
import { eslStore } from "@ida/esl/store";
import { DEMO_GMAIL_EMAILS } from "@ida/representation";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("reality.gmail-sync", requestId);

  log.info("request.start");

  try {
    log.debug("hydrate.start");
    await hydrateESLStore();
    log.debug("hydrate.done");

    const body = (await request.json().catch(() => ({}))) as {
      access_token?: string;
      useDemo?: boolean;
      reset?: boolean;
    };

    const token =
      body.access_token ?? request.cookies.get("gmail_access_token")?.value;

    const gmailConfigured = isGmailConfigured();
    log.info("config.checked", { gmailConfigured, useDemo: !!body.useDemo, hasToken: !!token });

    if (body.useDemo || !token) {
      if (!body.useDemo && !gmailConfigured) {
        log.info("fallback.demo", { reason: "gmail_not_configured" });
        const result = await runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", {
          reset: body.reset ?? false,
        });
        const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
        log.info("request.success", { source: "demo", processed: result.processed });
        return jsonWithRequestId(
          {
            success: true,
            source: "demo",
            message: "Gmail not connected — loaded realistic demo emails instead.",
            pipeline: result,
            ...viewModel,
          },
          requestId,
        );
      }

      if (!token) {
        log.info("fallback.demo", { reason: "no_token" });
        const result = await runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", {
          reset: body.reset ?? false,
        });
        const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
        log.info("request.success", { source: "demo", processed: result.processed });
        return jsonWithRequestId(
          {
            success: true,
            source: "demo",
            pipeline: result,
            ...viewModel,
          },
          requestId,
        );
      }
    }

    if (!gmailConfigured) {
      log.warn("gmail.not_configured");
      const spec = GMAIL_ERRORS.GMAIL_NOT_CONFIGURED;
      return apiError(
        requestId,
        "GMAIL_NOT_CONFIGURED",
        spec.message,
        spec.suggestion,
        spec.status,
      );
    }

    log.debug("gmail.fetch.start");
    const emails = await fetchRecentEmails(token!, 25);
    log.info("gmail.fetch.done", { emailCount: emails.length });

    log.debug("pipeline.start");
    const result = await runESLPipelineFromEmails(emails, "gmail", {
      reset: body.reset ?? false,
    });
    log.info("pipeline.done", { processed: result.processed });

    const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
    log.info("request.success", { source: "gmail", emailCount: emails.length });

    return jsonWithRequestId(
      {
        success: true,
        source: "gmail",
        emailCount: emails.length,
        pipeline: result,
        ...viewModel,
      },
      requestId,
    );
  } catch (error) {
    log.error("request.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const spec = GMAIL_ERRORS.GMAIL_SYNC_FAILED;
    return apiError(
      requestId,
      "GMAIL_SYNC_FAILED",
      error instanceof Error ? `${spec.message} (${error.message})` : spec.message,
      spec.suggestion,
      spec.status,
    );
  }
}