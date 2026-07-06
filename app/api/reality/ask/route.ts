import { NextRequest, NextResponse } from "next/server";

import { formatAskAnswer } from "@/lib/enterprise/i18n/ask-format";
import { getEnterpriseMessages } from "@/lib/enterprise/i18n/messages";
import type { EnterpriseLocale } from "@/lib/enterprise/i18n/types";
import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

function resolveLocale(value: unknown): EnterpriseLocale {
  return value === "id" ? "id" : "en";
}

export async function POST(request: NextRequest) {
  try {
    await hydrateESLStore();
    const body = (await request.json()) as { q?: string; locale?: string };
    const q = body.q?.trim() ?? "";
    const locale = resolveLocale(body.locale);
    const { askResponses } = getEnterpriseMessages(locale);

    if (!q) {
      return NextResponse.json(
        { success: false, error: askResponses.questionRequired },
        { status: 400 },
      );
    }

    const snapshot = eslStore.getSnapshot();
    if (snapshot.communications.length === 0) {
      return NextResponse.json({
        success: true,
        answer: askResponses.noDataYet,
        hasLiveData: false,
        locale,
      });
    }

    const result = queryEngine.queryText(q);
    const overview = queryEngine.overview();
    const answer = formatAskAnswer(locale, q, result, snapshot, overview);

    return NextResponse.json({
      success: true,
      answer,
      hasLiveData: true,
      locale,
      result,
    });
  } catch (error) {
    const locale = resolveLocale(undefined);
    const message =
      error instanceof Error
        ? error.message
        : getEnterpriseMessages(locale).askResponses.askFailed;
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}