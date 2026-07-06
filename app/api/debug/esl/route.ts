import { NextRequest } from "next/server";

import { getRequestId } from "@/lib/api/request-id";
import { apiError, jsonWithRequestId } from "@/lib/api/response";
import { createLogger } from "@/lib/logger";
import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

function storePath(): string {
  if (process.env.VERCEL) return "/tmp/ida-esl-store.json";
  return ".data/ida-esl-store.json";
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("debug.esl", requestId);

  log.info("request.start");

  try {
    const hydrated = await hydrateESLStore();
    const snapshot = eslStore.exportSnapshot();
    const counts = eslStore.getSnapshot().counts;
    const overview = queryEngine.overview();

    log.info("request.success", { counts });

    return jsonWithRequestId(
      {
        success: true,
        hydrated: hydrated !== null,
        storePath: storePath(),
        counts,
        lastSync: snapshot.lastSync,
        organizations: snapshot.organizations.map((o) => ({
          id: o.id,
          name: o.name,
          accountId: o.accountId,
        })),
        communications: snapshot.communications.length,
        artifacts: snapshot.artifacts.map((a) => ({
          id: a.id,
          type: a.type,
          summary: a.summary,
        })),
        graph: overview.graph.stats,
        attentionItems: overview.attentionItems.length,
      },
      requestId,
    );
  } catch (error) {
    log.error("request.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError(
      requestId,
      "ESL_DEBUG_FAILED",
      "Could not load ESL debug snapshot.",
      "Check server logs for the requestId and verify .data/ or /tmp persistence is writable.",
      500,
    );
  }
}