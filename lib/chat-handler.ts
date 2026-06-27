import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import {
  streamOpenAiCompatibleChat,
  type StreamChatResult,
} from "@/lib/admin/chat-stream";
import type { TokenUsage } from "@/lib/admin/token-utils";
import {
  estimateUsageFromMessages,
  mergeTokenUsage,
} from "@/lib/admin/token-utils";
import { loadAppConfig } from "@/lib/admin/config";
import {
  findModelDefinition,
  isProviderConfigured,
  type ModelProvider,
} from "@/lib/admin/models";
import type { ModelSelection } from "@/lib/admin/types";
import type { Locale } from "@/lib/config";
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
  userId?: string;
}

export interface IdaChatPreparedContext {
  model: ChatGoogleGenerativeAI | null;
  modelId: string;
  provider: ModelProvider;
  systemPrompt: string;
  openAiMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  messages: (HumanMessage | AIMessage | SystemMessage)[];
  meta: IdaSseMetaPayload;
  sessionMessages: ConversationMessage[];
  locale: Locale;
  sessionId?: string;
  userId?: string;
  handoffResponse?: string;
}

export interface IdaChatStreamResult extends StreamChatResult {
  usage: TokenUsage;
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
  options?: { model?: ModelSelection },
): Promise<IdaChatPreparedContext> {
  const appConfig = await loadAppConfig();
  const selectedModel = options?.model ?? appConfig.defaultModel;
  const modelDefinition = findModelDefinition(
    selectedModel.id,
    selectedModel.provider,
  );

  if (!modelDefinition?.capabilities.includes("chat")) {
    throw new Error("Chat service is not configured.");
  }

  if (!isProviderConfigured(selectedModel.provider)) {
    throw new Error("Chat service is not configured.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const useGoogle = selectedModel.provider === "google";

  if (useGoogle && !apiKey) {
    throw new Error("Chat service is not configured.");
  }

  const { messages, locale, sessionId, userId } = input;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from the user.");
  }

  const [retrieval, memoryContext] = await Promise.all([
    retrieveContext({
      query: lastMessage.content,
      locale,
      enabled: appConfig.features.rag,
      topK: appConfig.rag.topK,
      retrievalThreshold: appConfig.rag.retrievalThreshold,
      confidenceThreshold: appConfig.rag.confidenceThreshold,
    }),
    buildConversationMemoryContext(messages),
  ]);

  const systemInstruction = buildIdaSystemPrompt(locale, {
    retrievedContext: retrieval.usedRag ? retrieval.context : "",
    conversationMemory: memoryContext,
    basePromptOverride: appConfig.systemPromptOverride,
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

  const openAiMessages = [
    { role: "system" as const, content: systemInstruction },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const model = useGoogle
    ? new ChatGoogleGenerativeAI({
        apiKey: apiKey!,
        model: selectedModel.id,
        temperature: 0.7,
        streaming: true,
      })
    : null;

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
    modelId: selectedModel.id,
    provider: selectedModel.provider,
    systemPrompt: systemInstruction,
    openAiMessages,
    messages: langchainMessages,
    meta,
    sessionMessages: messages,
    locale,
    sessionId,
    userId,
    handoffResponse: handoffExecution.responseMessage,
  };
}

function extractGeminiUsage(chunk: unknown): TokenUsage | null {
  if (!chunk || typeof chunk !== "object") return null;

  const metadata = (chunk as { usage_metadata?: Record<string, number> })
    .usage_metadata;

  if (!metadata) return null;

  const promptTokens = metadata.input_tokens ?? metadata.prompt_tokens ?? 0;
  const completionTokens =
    metadata.output_tokens ?? metadata.completion_tokens ?? 0;
  const totalTokens =
    metadata.total_tokens ?? promptTokens + completionTokens;

  if (totalTokens <= 0) return null;

  return { promptTokens, completionTokens, totalTokens };
}

function buildEstimatedUsage(
  context: IdaChatPreparedContext,
  completion: string,
): TokenUsage {
  return estimateUsageFromMessages({
    systemPrompt: context.systemPrompt,
    messages: context.sessionMessages,
    completion,
  });
}

export async function runIdaChatStream(
  context: IdaChatPreparedContext,
  onToken?: (token: string) => void,
): Promise<IdaChatStreamResult> {
  if (context.handoffResponse) {
    onToken?.(context.handoffResponse);
    await persistAssistantMessage(context, context.handoffResponse);

    const usage = buildEstimatedUsage(context, context.handoffResponse);
    return { fullText: context.handoffResponse, usage };
  }

  if (context.provider === "google" && context.model) {
    const stream = await context.model
      .bindTools([handoffToolDefinition])
      .stream(context.messages);

    let fullText = "";
    let usage: TokenUsage | null = null;

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
        onToken?.(text);
      }

      const chunkUsage = extractGeminiUsage(chunk);
      if (chunkUsage) usage = chunkUsage;
    }

    const finalText = fullText.trim();
    if (!finalText) {
      throw new Error("Empty response from model.");
    }

    await persistAssistantMessage(context, finalText);

    return {
      fullText: finalText,
      usage: mergeTokenUsage(
        usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        buildEstimatedUsage(context, finalText),
      ),
    };
  }

  const result = await streamOpenAiCompatibleChat({
    provider: context.provider,
    modelId: context.modelId,
    messages: context.openAiMessages,
    onToken,
  });

  if (!result.fullText) {
    throw new Error("Empty response from model.");
  }

  await persistAssistantMessage(context, result.fullText);

  return {
    fullText: result.fullText,
    usage: mergeTokenUsage(
      result.usage,
      buildEstimatedUsage(context, result.fullText),
    ),
  };
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
    userId: context.userId,
  });
}