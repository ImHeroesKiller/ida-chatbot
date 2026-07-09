import { NextRequest, NextResponse } from "next/server";

import { runAskIda } from "@/lib/enterprise/ask-ida";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      q?: string;
      question?: string;
      locale?: string;
    };

    const question = (body.question ?? body.q ?? "").trim();
    const result = await runAskIda({
      question,
      locale: body.locale,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ask IDA failed.";
    console.error("[api/demo/ask-ida]", error);
    return NextResponse.json(
      {
        success: false,
        answer: "",
        error: message,
        hasLiveData: false,
        source: "empty",
        locale: "en",
      },
      { status: 500 },
    );
  }
}
