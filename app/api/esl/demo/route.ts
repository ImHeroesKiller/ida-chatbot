import { NextResponse } from "next/server";

import { runDemoESLPipeline } from "@ida/esl/pipeline";

export async function POST() {
  try {
    const result = await runDemoESLPipeline();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Demo pipeline failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}