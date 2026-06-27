import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAppConfig } from "@/lib/admin/config";
import { logRequest } from "@/lib/admin/request-logs";
import {
  prepareIdaChatContext,
  runIdaChatStream,
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
      const appConfig = await loadAppConfig();

      void logRequest({
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        model: appConfig.defaultModel.id,
        provider: appConfig.defaultModel.provider,
        route: "chat",
        status: "rate_limit",
        errorMessage: "Rate limit exceeded.",
      });

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

  let preparedModel: { modelId: string; provider: string } | null = null;

  try {
    const appConfig = await loadAppConfig();
    const context = await prepareIdaChatContext({
      messages,
      locale,
      sessionId,
      userId,
    });

    preparedModel = {
      modelId: context.modelId,
      provider: context.provider,
    };

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
        threshold: appConfig.rag.confidenceThreshold,
        locale,
        sessionId: sessionId ?? null,
      });
    } else {
      console.log("[IDA chat] RAG active", {
        retrievedChunks: context.meta.retrievedChunks,
        maxSimilarity: context.meta.maxSimilarity ?? 0,
        threshold: appConfig.rag.confidenceThreshold,
        locale,
        sessionId: sessionId ?? null,
      });
    }

    const stream = createSseStream(async (send) => {
      send("meta", context.meta);

      try {
        const result = await runIdaChatStream(context, (token) => {
          send("token", { text: token });
        });

        send("done", { message: result.fullText });

        void logRequest({
          userId: userId ?? null,
          sessionId: sessionId ?? null,
          model: context.modelId,
          provider: context.provider,
          route: "chat",
          usage: result.usage,
          status: "success",
        });
      } catch (streamError) {
        const errorMessage =
          streamError instanceof Error
            ? streamError.message
            : "Stream failed.";

        void logRequest({
          userId: userId ?? null,
          sessionId: sessionId ?? null,
          model: context.modelId,
          provider: context.provider,
          route: "chat",
          status: "error",
          errorMessage,
        });

        throw streamError;
      }
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

    if (preparedModel) {
      void logRequest({
        userId: userId ?? null,
        sessionId: sessionId ?? null,
        model: preparedModel.modelId,
        provider: preparedModel.provider,
        route: "chat",
        status: "error",
        errorMessage: error instanceof Error ? error.message : message,
      });
    }

    console.error("[IDA chat]", error);

    return NextResponse.json<IdaChatErrorResponse>({ error: message }, { status });
  }
}