import { NextRequest, NextResponse } from "next/server";

import { buildRealityViewModel } from "@/lib/enterprise/reality-adapter";
import { fetchRecentEmails, isGmailConfigured } from "@/lib/integrations/gmail";
import { hydrateESLStore } from "@ida/esl/persistence";
import { runESLPipelineFromEmails } from "@ida/esl/pipeline";
import { eslStore } from "@ida/esl/store";
import { DEMO_GMAIL_EMAILS } from "@ida/representation";

export async function POST(request: NextRequest) {
  try {
    await hydrateESLStore();

    const body = (await request.json().catch(() => ({}))) as {
      access_token?: string;
      useDemo?: boolean;
      reset?: boolean;
    };

    const token =
      body.access_token ?? request.cookies.get("gmail_access_token")?.value;

    if (body.useDemo || !token) {
      if (!body.useDemo && !isGmailConfigured()) {
        const result = await runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", {
          reset: body.reset ?? false,
        });
        const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
        return NextResponse.json({
          success: true,
          source: "demo",
          message: "Gmail not connected — loaded realistic demo emails instead.",
          pipeline: result,
          ...viewModel,
        });
      }

      if (!token) {
        const result = await runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", {
          reset: body.reset ?? false,
        });
        const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
        return NextResponse.json({
          success: true,
          source: "demo",
          pipeline: result,
          ...viewModel,
        });
      }
    }

    if (!isGmailConfigured()) {
      return NextResponse.json(
        { success: false, error: "Gmail OAuth not configured on server." },
        { status: 503 },
      );
    }

    const emails = await fetchRecentEmails(token!, 25);
    const result = await runESLPipelineFromEmails(emails, "gmail", {
      reset: body.reset ?? false,
    });
    const viewModel = buildRealityViewModel(eslStore.exportSnapshot());

    return NextResponse.json({
      success: true,
      source: "gmail",
      emailCount: emails.length,
      pipeline: result,
      ...viewModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}