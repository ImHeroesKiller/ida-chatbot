import { NextRequest, NextResponse } from "next/server";

import { exchangeGmailCode, isGmailConfigured } from "@/lib/integrations/gmail";

export async function GET(request: NextRequest) {
  if (!isGmailConfigured()) {
    return NextResponse.json({ error: "Gmail OAuth not configured" }, { status: 503 });
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    const tokens = await exchangeGmailCode(code);
    return NextResponse.json({
      success: true,
      message: "Gmail connected. POST access_token to /api/esl/sync",
      access_token: tokens.access_token,
      expires_in: tokens.expiry_date,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}