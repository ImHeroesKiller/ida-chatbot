import type {
  IdaSseDonePayload,
  IdaSseErrorPayload,
  IdaSseMetaPayload,
  IdaSseTokenPayload,
} from "@/lib/sse";

export interface ParsedIdaSseStream {
  meta?: IdaSseMetaPayload;
  message: string;
  done?: IdaSseDonePayload;
  error?: string;
}

export async function consumeIdaSseStream(
  response: Response,
  onToken: (text: string) => void,
  onMeta?: (meta: IdaSseMetaPayload) => void,
  onDone?: (payload: IdaSseDonePayload) => void,
): Promise<ParsedIdaSseStream> {
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Streaming response is not supported.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let meta: IdaSseMetaPayload | undefined;
  let donePayload: IdaSseDonePayload | undefined;
  let message = "";
  let error: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLine = line.slice(5).trim();
        }
      }

      if (!dataLine) continue;

      const payload = JSON.parse(dataLine) as unknown;

      if (eventType === "meta") {
        meta = payload as IdaSseMetaPayload;
        onMeta?.(meta);
      } else if (eventType === "token") {
        const token = (payload as IdaSseTokenPayload).text;
        message += token;
        onToken(token);
      } else if (eventType === "done") {
        donePayload = payload as IdaSseDonePayload;
        message = donePayload.message || message;
        onDone?.(donePayload);
      } else if (eventType === "error") {
        error = (payload as IdaSseErrorPayload).error;
      }
    }
  }

  if (error) {
    throw new Error(error);
  }

  return {
    meta,
    message: message.trim(),
    done: donePayload,
  };
}