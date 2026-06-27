import { NextResponse } from "next/server";
import { z } from "zod";

import {
  prepareIdaChatContext,
  streamIdaChatResponse,
} from "@/lib/chat-handler";
import { IDA_CONFIG, LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { isValidAnonymousUserId } from "@/lib/user-id";
import { createSseStream, sseResponse } from "@/lib/sse";
import type { IdaChatErrorResponse } from "@/lib/types";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .min(1)
          .max(IDA_CONFIG.maxMessageLength),
      }),
    )
    .min(1)
    .max(IDA_CONFIG.maxMessages),
  locale: z.enum(LOCALES),
  sessionId: z.string().min(8).max(64).optional(),
  userId: z.string().uuid().optional(),
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

  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Invalid chat payload." },
      { status: 400 },
    );
  }

  const { messages, locale, sessionId, userId } = parsed.data;

  if (userId && !isValidAnonymousUserId(userId)) {
    return NextResponse.json<IdaChatErrorResponse>(
      { error: "Invalid user id." },
      { status: 400 },
    );
  }

  try {
    await enforceIdaRateLimit(
      buildRateLimitKey({
        ip: getClientIp(request),
        sessionId: userId ?? sessionId,
      }),
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json<IdaChatErrorResponse>(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSec) },
        },
      );
    }

    throw error;
  }

  try {
    const context = await prepareIdaChatContext({
      messages,
      locale,
      sessionId,
      userId,
    });

    if (context.meta.handoffTriggered) {
      console.log("[IDA chat] Tool call: trigger_handoff", {
        toolCall: context.meta.toolCall,
        reason: context.meta.toolCallReason,
        locale,
        sessionId: sessionId ?? null,
        topic: context.meta.handoffPrefill?.topic,
      });
    }

    if (!context.meta.usedRag) {
      console.log("[IDA chat] RAG fallback", {
        reason: context.meta.ragFallbackReason ?? "unknown",
        maxSimilarity: context.meta.maxSimilarity ?? 0,
        retrievedChunks: context.meta.retrievedChunks,
        threshold: IDA_CONFIG.ragConfidenceThreshold,
        locale,
        sessionId: sessionId ?? null,
      });
    } else {
      console.log("[IDA chat] RAG active", {
        retrievedChunks: context.meta.retrievedChunks,
        maxSimilarity: context.meta.maxSimilarity ?? 0,
        threshold: IDA_CONFIG.ragConfidenceThreshold,
        locale,
        sessionId: sessionId ?? null,
      });
    }

    const stream = createSseStream(async (send) => {
      send("meta", context.meta);

      let fullMessage = "";

      for await (const token of streamIdaChatResponse(context)) {
        fullMessage += token;
        send("token", { text: token });
      }

      send("done", { message: fullMessage.trim() });
    });

    return sseResponse(stream);
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "Chat service is not configured."
        ? "Chat service is not configured."
        : "Failed to generate response.";

    const status =
      error instanceof Error &&
      error.message === "Chat service is not configured."
        ? 503
        : 500;

    console.error("[IDA chat]", error);

    return NextResponse.json<IdaChatErrorResponse>({ error: message }, { status });
  }
}