import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import type { Locale } from "@/lib/config";
import { IDA_CONFIG } from "@/lib/config";
import { buildHandoffPrefill, getQuickReplies } from "@/lib/handoff";
import {
  detectHandoffKeyword,
  getHandoffConfirmationMessage,
  handoffToolDefinition,
  HANDOFF_TOOL_NAME,
  type HandoffTriggerSource,
} from "@/lib/tools/handoff-tool";

import {
  buildConversationMemoryContext,
  persistSessionMessages,
  type ConversationMessage,
} from "./memory/conversation-memory";
import { retrieveContext } from "./rag/retriever";
import { buildIdaSystemPrompt } from "./system-prompt";
import type { IdaSseMetaPayload } from "./sse";
import type { IdaHandoffPrefill } from "./types";

export interface IdaChatHandlerInput {
  messages: ConversationMessage[];
  locale: Locale;
  sessionId?: string;
}

export interface IdaChatPreparedContext {
  model: ChatGoogleGenerativeAI;
  messages: (HumanMessage | AIMessage | SystemMessage)[];
  meta: IdaSseMetaPayload;
  sessionMessages: ConversationMessage[];
  locale: Locale;
  sessionId?: string;
  handoffResponse?: string;
}

export interface HandoffToolExecution {
  triggered: boolean;
  toolCall?: string;
  toolCallReason?: string;
  triggerSource?: HandoffTriggerSource;
  handoffPrefill?: IdaHandoffPrefill;
  responseMessage?: string;
}

export function executeHandoffTool(options: {
  messages: ConversationMessage[];
  locale: Locale;
  reason: string;
  triggerSource: HandoffTriggerSource;
}): HandoffToolExecution {
  const handoffPrefill = buildHandoffPrefill(options.messages, options.locale);

  return {
    triggered: true,
    toolCall: HANDOFF_TOOL_NAME,
    toolCallReason: options.reason,
    triggerSource: options.triggerSource,
    handoffPrefill,
    responseMessage: getHandoffConfirmationMessage(options.locale),
  };
}

export async function resolveHandoffTool(options: {
  lastMessage: string;
  messages: ConversationMessage[];
  locale: Locale;
}): Promise<HandoffToolExecution> {
  const keywordPattern = detectHandoffKeyword(
    options.lastMessage,
    options.locale,
  );

  if (!keywordPattern) {
    return { triggered: false };
  }

  return executeHandoffTool({
    messages: options.messages,
    locale: options.locale,
    reason: `keyword:${keywordPattern}`,
    triggerSource: "keyword",
  });
}

export async function prepareIdaChatContext(
  input: IdaChatHandlerInput,
): Promise<IdaChatPreparedContext> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Chat service is not configured.");
  }

  const { messages, locale, sessionId } = input;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from the user.");
  }

  const [retrieval, memoryContext] = await Promise.all([
    retrieveContext({ query: lastMessage.content, locale }),
    buildConversationMemoryContext(messages),
  ]);

  const systemInstruction = buildIdaSystemPrompt(locale, {
    retrievedContext: retrieval.usedRag ? retrieval.context : "",
    conversationMemory: memoryContext,
  });

  const handoffPrefill = buildHandoffPrefill(messages, locale);

  const langchainMessages: (HumanMessage | AIMessage | SystemMessage)[] = [
    new SystemMessage(systemInstruction),
    ...messages.slice(0, -1).map((message) =>
      message.role === "user"
        ? new HumanMessage(message.content)
        : new AIMessage(message.content),
    ),
    new HumanMessage(lastMessage.content),
  ];

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: IDA_CONFIG.model,
    temperature: 0.7,
    streaming: true,
  });

  const handoffExecution = await resolveHandoffTool({
    lastMessage: lastMessage.content,
    messages,
    locale,
  });

  const meta: IdaSseMetaPayload = {
    retrievedChunks: retrieval.retrievedChunkCount,
    usedRag: retrieval.usedRag,
    ragFallbackReason: retrieval.fallbackReason,
    maxSimilarity: retrieval.maxSimilarity,
    quickReplies: getQuickReplies(locale),
    handoffPrefill: handoffExecution.handoffPrefill ?? handoffPrefill,
    handoffTriggered: handoffExecution.triggered,
    toolCall: handoffExecution.toolCall,
    toolCallReason: handoffExecution.toolCallReason,
  };

  return {
    model,
    messages: langchainMessages,
    meta,
    sessionMessages: messages,
    locale,
    sessionId,
    handoffResponse: handoffExecution.responseMessage,
  };
}

export async function* streamIdaChatResponse(
  context: IdaChatPreparedContext,
): AsyncGenerator<string> {
  if (context.handoffResponse) {
    yield context.handoffResponse;
    await persistAssistantMessage(context, context.handoffResponse);
    return;
  }

  const stream = await context.model
    .bindTools([handoffToolDefinition])
    .stream(context.messages);

  let fullText = "";

  for await (const chunk of stream) {
    const text =
      typeof chunk.content === "string"
        ? chunk.content
        : Array.isArray(chunk.content)
          ? chunk.content
              .map((part) =>
                typeof part === "string" ? part : (part.text ?? ""),
              )
              .join("")
          : "";

    if (text) {
      fullText += text;
      yield text;
    }
  }

  const finalText = fullText.trim();

  if (!finalText) {
    throw new Error("Empty response from model.");
  }

  await persistAssistantMessage(context, finalText);
}

async function persistAssistantMessage(
  context: IdaChatPreparedContext,
  finalText: string,
): Promise<void> {
  if (!context.sessionId) return;

  const updatedMessages: ConversationMessage[] = [
    ...context.sessionMessages,
    { role: "assistant", content: finalText },
  ];

  void persistSessionMessages({
    sessionId: context.sessionId,
    locale: context.locale,
    messages: updatedMessages,
  });
}