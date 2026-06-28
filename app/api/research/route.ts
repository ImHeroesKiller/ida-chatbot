import { NextResponse } from "next/server";
import { z } from "zod";

import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { executeResearch } from "@/lib/tools/research";
import { retrieveContext } from "@/lib/rag/retriever";
import { loadAppConfig } from "@/lib/admin/config";
import type { IdaChatErrorResponse } from "@/lib/types";

const researchRequestSchema = z.object({
  topic: z.string().min(3).max(500),
  depth: z.enum(["quick", "standard", "deep"]).optional(),
  locale: z.enum(LOCALES).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = researchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Invalid research payload." },
      { status: 400 },
    );
  }

  const { topic, depth, locale = "id" } = parsed.data;

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request) })}:research`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json<IdaChatErrorResponse>(
        { error: error.message },
        { status: 429 },
      );
    }
    throw error;
  }

  const appConfig = await loadAppConfig();

  const retrieval = await retrieveContext({
    query: topic,
    locale,
    topK: appConfig.rag.topK,
    retrievalThreshold: appConfig.rag.retrievalThreshold,
    confidenceThreshold: appConfig.rag.confidenceThreshold,
  });

  const result = await executeResearch({
    topic,
    depth: depth ?? "standard",
    ragContext: retrieval.usedRag ? retrieval.context : undefined,
  });

  if (!result.success && result.error === "not_configured") {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Research is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    topic: result.topic,
    depth: result.depth,
    queries: result.queries,
    sources: result.sources,
    summary: result.summary,
    usedRag: retrieval.usedRag,
    error: result.error,
  });
}