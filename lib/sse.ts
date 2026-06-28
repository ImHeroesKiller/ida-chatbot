export type IdaSseEventType = "meta" | "token" | "done" | "error";

export interface IdaWebSearchSourcePayload {
  title: string;
  url: string;
  snippet: string;
}

export interface IdaSseWorksheetPayload {
  title: string;
  content: string;
}

export interface IdaSseMetaPayload {
  retrievedChunks: number;
  usedRag: boolean;
  ragFallbackReason?: string;
  maxSimilarity?: number;
  handoffTriggered?: boolean;
  toolCall?: string;
  toolCallReason?: string;
  handoffPrefill?: {
    topic: string;
    description: string;
  };
  usedWebSearch?: boolean;
  webSearchQueries?: string[];
  webSearchSources?: IdaWebSearchSourcePayload[];
  usedFallbackModel?: boolean;
  activeModel?: string;
  activeProvider?: string;
  worksheet?: IdaSseWorksheetPayload;
}

export interface IdaSseTokenPayload {
  text: string;
}

export interface IdaSseDonePayload {
  message: string;
  usedWebSearch?: boolean;
  webSearchSources?: IdaWebSearchSourcePayload[];
  worksheet?: IdaSseWorksheetPayload;
  worksheetError?: string;
}

export interface IdaSseErrorPayload {
  error: string;
}

export function formatSseEvent(
  event: IdaSseEventType,
  data:
    | IdaSseMetaPayload
    | IdaSseTokenPayload
    | IdaSseDonePayload
    | IdaSseErrorPayload,
): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function createSseStream(
  handler: (
    send: (event: IdaSseEventType, data: unknown) => void,
  ) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: IdaSseEventType, data: unknown) => {
        controller.enqueue(
          encoder.encode(formatSseEvent(event, data as never)),
        );
      };

      try {
        await handler(send);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate response.";
        controller.enqueue(
          encoder.encode(
            formatSseEvent("error", {
              error: message,
            } satisfies IdaSseErrorPayload),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}