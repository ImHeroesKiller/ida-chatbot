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
  buildConversationMemoryContext,
  persistSessionMessages,
  type ConversationMessage,
} from "./memory/conversation-memory";
import { retrieveContext } from "./rag/retriever";
import { buildIdaSystemPrompt } from "./system-prompt";
import type { IdaSseMetaPayload } from "./sse";

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
    retrievedContext: retrieval.context,
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

  return {
    model,
    messages: langchainMessages,
    meta: {
      retrievedChunks: retrieval.chunks.length,
      usedRag: retrieval.chunks.length > 0,
      quickReplies: getQuickReplies(locale),
      handoffPrefill,
    },
    sessionMessages: messages,
    locale,
    sessionId,
  };
}

export async function* streamIdaChatResponse(
  context: IdaChatPreparedContext,
): AsyncGenerator<string> {
  const stream = await context.model.stream(context.messages);

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

  if (context.sessionId) {
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
}