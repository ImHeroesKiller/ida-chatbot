import { NextResponse } from "next/server";

import { buildRealityViewModel } from "@/lib/enterprise/reality-adapter";
import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

export async function GET() {
  try {
    await hydrateESLStore();
    const snapshot = eslStore.exportSnapshot();
    const viewModel = buildRealityViewModel(snapshot);
    const overview = queryEngine.overview();

    return NextResponse.json({
      success: true,
      ...viewModel,
      overview: {
        attentionItems: overview.attentionItems,
        organizationSummaries: overview.organizationSummaries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reality state";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}