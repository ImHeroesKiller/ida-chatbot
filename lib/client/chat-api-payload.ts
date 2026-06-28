import { buildAttachmentMessageContent } from "@/lib/client/build-attachment-message";
import type { Locale } from "@/lib/config";
import type { IdaMessage } from "@/lib/types";
import { isValidAnonymousUserId } from "@/lib/user-id";

const SESSION_ID_MIN = 8;
const SESSION_ID_MAX = 64;
/** Keep in sync with WELCOME_MESSAGE_ID in lib/chat-store.ts */
const WELCOME_MESSAGE_ID = "ida-welcome";

function createFallbackSessionId(): string {
  return `ida-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ensureApiSessionId(sessionId: string | undefined | null): string {
  const trimmed = sessionId?.trim() ?? "";
  if (
    trimmed.length >= SESSION_ID_MIN &&
    trimmed.length <= SESSION_ID_MAX
  ) {
    return trimmed;
  }
  return createFallbackSessionId();
}

export function toChatApiMessages(
  messages: IdaMessage[],
  locale: Locale,
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((message) => message.id !== WELCOME_MESSAGE_ID)
    .map((message) => {
      const trimmed = message.content.trim();
      if (trimmed.length > 0) {
        return { role: message.role, content: trimmed };
      }

      if (message.attachment) {
        const rebuilt = buildAttachmentMessageContent(
          message.caption ?? "",
          message.attachment,
          locale,
        ).trim();
        if (rebuilt.length > 0) {
          return { role: message.role, content: rebuilt };
        }
      }

      return null;
    })
    .filter(
      (entry): entry is { role: "user" | "assistant"; content: string } =>
        entry !== null,
    );
}

export interface ChatApiRequestBody {
  locale: Locale;
  sessionId: string;
  userId?: string;
  webSearch?: boolean;
  research?: boolean;
  worksheet?: boolean;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export function buildChatApiRequestBody(options: {
  locale: Locale;
  sessionId: string | undefined | null;
  userId: string | undefined | null;
  messages: IdaMessage[];
  webSearch?: boolean;
  research?: boolean;
  worksheet?: boolean;
}): ChatApiRequestBody {
  const apiMessages = toChatApiMessages(options.messages, options.locale);

  if (!apiMessages.length) {
    throw new Error("No valid messages to send.");
  }

  const lastMessage = apiMessages[apiMessages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from the user.");
  }

  const body: ChatApiRequestBody = {
    locale: options.locale,
    sessionId: ensureApiSessionId(options.sessionId),
    messages: apiMessages,
  };

  const userId = options.userId?.trim();
  if (userId && isValidAnonymousUserId(userId)) {
    body.userId = userId;
  }

  if (options.webSearch) {
    body.webSearch = true;
  }

  if (options.research) {
    body.research = true;
  }

  if (options.worksheet) {
    body.worksheet = true;
  }

  return body;
}