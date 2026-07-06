import { NextResponse } from "next/server";

import { getGmailAuthUrl, isGmailConfigured } from "@/lib/integrations/gmail";

export async function GET() {
  if (!isGmailConfigured()) {
    return NextResponse.json(
      {
        error: "Gmail OAuth not configured",
        hint: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI",
        demoAlternative: "/api/esl/demo",
      },
      { status: 503 },
    );
  }

  const url = getGmailAuthUrl();
  return NextResponse.redirect(url);
}