import { NextRequest, NextResponse } from "next/server";

import { hydrateESLStore } from "@ida/esl/persistence";
import { runESLPipelineFromEmails } from "@ida/esl/pipeline";
import { DEMO_GMAIL_EMAILS } from "@ida/representation";
import { fetchRecentEmails, isGmailConfigured } from "@/lib/integrations/gmail";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      mode?: "demo" | "gmail";
      access_token?: string;
      reset?: boolean;
    };

    await hydrateESLStore();

    if (body.mode === "demo" || !body.access_token) {
      const result = await runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", {
        reset: body.reset ?? false,
      });
      return NextResponse.json({
        success: true,
        source: "demo",
        gmailConfigured: isGmailConfigured(),
        ...result,
      });
    }

    if (!isGmailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gmail OAuth not configured. Use mode:demo or set GOOGLE_CLIENT_ID/SECRET.",
        },
        { status: 400 },
      );
    }

    const emails = await fetchRecentEmails(body.access_token, 30);
    const result = await runESLPipelineFromEmails(emails, "gmail", {
      reset: body.reset ?? false,
    });

    return NextResponse.json({
      success: true,
      source: "gmail",
      emailCount: emails.length,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ESL sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}