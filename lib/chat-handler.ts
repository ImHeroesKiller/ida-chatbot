import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
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
  getProviderApiKey,
  isProviderConfigured,
  type ModelProvider,
} from "@/lib/admin/models";
import type { ModelSelection } from "@/lib/admin/types";
import type { Locale } from "@/lib/config";
import { buildHandoffPrefill } from "@/lib/handoff";
import { inferQuickReplies } from "@/lib/quick-replies";
import {
  detectHandoffKeyword,
  getHandoffConfirmationMessage,
  handoffToolDefinition,
  HANDOFF_TOOL_NAME,
  type HandoffTriggerSource,
} from "@/lib/tools/handoff-tool";
import {
  executeWebSearch,
  isWebSearchConfigured,
  looksLikeRealtimeQuery,
  WEB_SEARCH_TOOL_NAME,
  webSearchToolDefinition,
  webSearchToolSchema,
  type WebSearchSource,
} from "@/lib/tools/web-search";

import {
  buildConversationMemoryContext,
  persistSessionMessages,
  type ConversationMessage,
} from "./memory/conversation-memory";
import { retrieveContext } from "./rag/retriever";
import { buildIdaSystemPrompt } from "./system-prompt";
import type { IdaSseMetaPayload } from "./sse";
import type { IdaHandoffPrefill, IdaWebSearchSource } from "./types";

export interface IdaChatHandlerInput {
  messages: ConversationMessage[];
  locale: Locale;
  sessionId?: string;
  userId?: string;
  /** User-enabled web search toggle from chat composer */
  webSearch?: boolean;
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
  messages: (HumanMessage | AIMessage | SystemMessage | ToolMessage)[];
  meta: IdaSseMetaPayload;
  sessionMessages: ConversationMessage[];
  locale: Locale;
  sessionId?: string;
  userId?: string;
  handoffResponse?: string;
  webSearchEnabled: boolean;
  webSearchMaxResults: number;
  userRequestedWebSearch: boolean;
}

export interface IdaChatStreamResult extends StreamChatResult {
  usage: TokenUsage;
  quickReplies: string[];
  usedWebSearch?: boolean;
  webSearchSources?: IdaWebSearchSource[];
  webSearchQueries?: string[];
}

export interface HandoffToolExecution {
  triggered: boolean;
  toolCall?: string;
  toolCallReason?: string;
  triggerSource?: HandoffTriggerSource;
  handoffPrefill?: IdaHandoffPrefill;
  responseMessage?: string;
}

export interface IdaChatStreamCallbacks {
  onToken?: (token: string) => void;
  onMetaUpdate?: (meta: Partial<IdaSseMetaPayload>) => void;
}

const MAX_TOOL_ITERATIONS = 3;

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

function toIdaWebSearchSources(
  sources: WebSearchSource[],
): IdaWebSearchSource[] {
  return sources.map((source) => ({
    title: source.title,
    url: source.url,
    snippet: source.snippet,
  }));
}

function extractMessageText(message: AIMessage): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String(part.text ?? "");
        }
        return "";
      })
      .join("");
  }

  return "";
}

function extractStreamText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") return "";

  const content = (chunk as { content?: unknown }).content;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String(part.text ?? "");
        }
        return "";
      })
      .join("");
  }

  return "";
}

async function maybePrefetchWebSearchContext(options: {
  query: string;
  enabled: boolean;
  maxResults: number;
  force?: boolean;
}): Promise<{
  context: string;
  sources: IdaWebSearchSource[];
  queries: string[];
}> {
  if (!options.enabled || !isWebSearchConfigured()) {
    return { context: "", sources: [], queries: [] };
  }

  if (!options.force && !looksLikeRealtimeQuery(options.query)) {
    return { context: "", sources: [], queries: [] };
  }

  const result = await executeWebSearch({
    query: options.query,
    maxResults: options.maxResults,
  });

  if (!result.sources.length) {
    return { context: "", sources: [], queries: [] };
  }

  return {
    context: result.formattedForLlm,
    sources: toIdaWebSearchSources(result.sources),
    queries: [result.query],
  };
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

  const apiKey = getProviderApiKey(selectedModel.provider);
  const useGoogle = selectedModel.provider === "google";

  if (useGoogle && !apiKey) {
    throw new Error("Chat service is not configured.");
  }

  const { messages, locale, sessionId, userId } = input;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    throw new Error("Last message must be from the user.");
  }

  const webSearchAvailable =
    appConfig.features.webSearch && isWebSearchConfigured();
  const userRequestedWebSearch = input.webSearch === true;
  const webSearchActive = webSearchAvailable && userRequestedWebSearch;
  const webSearchMaxResults = appConfig.webSearch.maxResults;

  const [retrieval, memoryContext, prefetchedWebSearch] = await Promise.all([
    retrieveContext({
      query: lastMessage.content,
      locale,
      enabled: appConfig.features.rag,
      topK: appConfig.rag.topK,
      retrievalThreshold: appConfig.rag.retrievalThreshold,
      confidenceThreshold: appConfig.rag.confidenceThreshold,
    }),
    buildConversationMemoryContext(messages),
    webSearchActive
      ? maybePrefetchWebSearchContext({
          query: lastMessage.content,
          enabled: true,
          maxResults: webSearchMaxResults,
          force: true,
        })
      : Promise.resolve({ context: "", sources: [], queries: [] }),
  ]);

  const systemInstruction = buildIdaSystemPrompt(locale, {
    retrievedContext: retrieval.usedRag ? retrieval.context : "",
    conversationMemory: memoryContext,
    webSearchContext: prefetchedWebSearch.context,
    webSearchEnabled: webSearchActive && useGoogle && !prefetchedWebSearch.context,
    basePromptOverride: appConfig.systemPromptOverride,
  });

  const handoffPrefill = buildHandoffPrefill(messages, locale);

  const langchainMessages: (
    | HumanMessage
    | AIMessage
    | SystemMessage
    | ToolMessage
  )[] = [
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
    quickReplies: inferQuickReplies({
      locale,
      messages,
      usedRag: retrieval.usedRag,
      usedWebSearch: prefetchedWebSearch.sources.length > 0,
    }),
    handoffPrefill: handoffExecution.handoffPrefill ?? handoffPrefill,
    handoffTriggered: handoffExecution.triggered,
    toolCall: handoffExecution.toolCall,
    toolCallReason: handoffExecution.toolCallReason,
    usedWebSearch: prefetchedWebSearch.sources.length > 0,
    webSearchQueries: prefetchedWebSearch.queries,
    webSearchSources: prefetchedWebSearch.sources,
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
    webSearchEnabled: webSearchActive && useGoogle && !prefetchedWebSearch.context,
    webSearchMaxResults,
    userRequestedWebSearch: webSearchActive,
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

async function runGeminiToolLoop(
  context: IdaChatPreparedContext,
  callbacks?: IdaChatStreamCallbacks,
): Promise<{
  messages: (HumanMessage | AIMessage | SystemMessage | ToolMessage)[];
  finalText?: string;
  handoffExecution: HandoffToolExecution | null;
  usedWebSearch: boolean;
  webSearchSources: IdaWebSearchSource[];
  webSearchQueries: string[];
}> {
  const tools = context.webSearchEnabled
    ? [handoffToolDefinition, webSearchToolDefinition]
    : [handoffToolDefinition];

  const boundModel = context.model!.bindTools(tools);
  let workingMessages = [...context.messages];
  let handoffExecution: HandoffToolExecution | null = null;
  const webSearchSources: IdaWebSearchSource[] = [
    ...(context.meta.webSearchSources ?? []),
  ];
  const webSearchQueries = [...(context.meta.webSearchQueries ?? [])];
  let usedWebSearch = Boolean(context.meta.usedWebSearch);

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const response = await boundModel.invoke(workingMessages);
    const toolCalls = response.tool_calls ?? [];

    if (!toolCalls.length) {
      const text = extractMessageText(response).trim();
      return {
        messages: text ? [...workingMessages, response] : workingMessages,
        finalText: text || undefined,
        handoffExecution,
        usedWebSearch,
        webSearchSources,
        webSearchQueries,
      };
    }

    workingMessages = [...workingMessages, response];

    for (const toolCall of toolCalls) {
      const toolCallId = toolCall.id ?? `tool-${iteration}-${toolCall.name}`;

      if (toolCall.name === HANDOFF_TOOL_NAME) {
        const args =
          typeof toolCall.args === "object" && toolCall.args
            ? (toolCall.args as { reason?: string })
            : {};
        handoffExecution = executeHandoffTool({
          messages: context.sessionMessages,
          locale: context.locale,
          reason: args.reason ?? "tool_call",
          triggerSource: "tool_call",
        });

        callbacks?.onMetaUpdate?.({
          handoffTriggered: true,
          toolCall: HANDOFF_TOOL_NAME,
          toolCallReason: handoffExecution.toolCallReason,
          handoffPrefill: handoffExecution.handoffPrefill,
        });

        workingMessages = [
          ...workingMessages,
          new ToolMessage({
            content: "Handoff request acknowledged.",
            tool_call_id: toolCallId,
          }),
        ];
        continue;
      }

      if (
        toolCall.name === WEB_SEARCH_TOOL_NAME &&
        context.webSearchEnabled
      ) {
        const parsed = webSearchToolSchema.safeParse(toolCall.args ?? {});
        const query = parsed.success
          ? parsed.data.query
          : context.sessionMessages[context.sessionMessages.length - 1]
              ?.content ?? "latest information";

        const searchResult = await executeWebSearch({
          query,
          maxResults: context.webSearchMaxResults,
        });

        if (searchResult.sources.length > 0) {
          usedWebSearch = true;
          webSearchQueries.push(searchResult.query);
          webSearchSources.push(...toIdaWebSearchSources(searchResult.sources));
        }

        callbacks?.onMetaUpdate?.({
          usedWebSearch,
          webSearchQueries,
          webSearchSources,
          toolCall: WEB_SEARCH_TOOL_NAME,
          toolCallReason: parsed.success ? parsed.data.reason : undefined,
        });

        console.log("[IDA chat] Tool call: web_search", {
          query: searchResult.query,
          resultCount: searchResult.sources.length,
          success: searchResult.success,
        });

        workingMessages = [
          ...workingMessages,
          new ToolMessage({
            content: searchResult.formattedForLlm,
            tool_call_id: toolCallId,
          }),
        ];
      }
    }

    if (handoffExecution?.triggered) {
      return {
        messages: workingMessages,
        handoffExecution,
        usedWebSearch,
        webSearchSources,
        webSearchQueries,
      };
    }
  }

  return {
    messages: workingMessages,
    handoffExecution,
    usedWebSearch,
    webSearchSources,
    webSearchQueries,
  };
}

async function streamGeminiFinalResponse(
  context: IdaChatPreparedContext,
  messages: (HumanMessage | AIMessage | SystemMessage | ToolMessage)[],
  callbacks?: IdaChatStreamCallbacks,
): Promise<{ fullText: string; usage: TokenUsage | null }> {
  const stream = await context.model!.stream(messages);

  let fullText = "";
  let usage: TokenUsage | null = null;

  for await (const chunk of stream) {
    const text = extractStreamText(chunk);
    if (text) {
      fullText += text;
      callbacks?.onToken?.(text);
    }

    const chunkUsage = extractGeminiUsage(chunk);
    if (chunkUsage) usage = chunkUsage;
  }

  return { fullText: fullText.trim(), usage };
}

function buildStreamQuickReplies(
  context: IdaChatPreparedContext,
  assistantReply: string,
  usedWebSearch?: boolean,
): string[] {
  return inferQuickReplies({
    locale: context.locale,
    messages: context.sessionMessages,
    assistantReply,
    usedRag: context.meta.usedRag,
    usedWebSearch: usedWebSearch ?? context.meta.usedWebSearch,
  });
}

export async function runIdaChatStream(
  context: IdaChatPreparedContext,
  callbacks?: IdaChatStreamCallbacks,
): Promise<IdaChatStreamResult> {
  if (context.handoffResponse) {
    callbacks?.onToken?.(context.handoffResponse);
    await persistAssistantMessage(context, context.handoffResponse);

    const usage = buildEstimatedUsage(context, context.handoffResponse);
    return {
      fullText: context.handoffResponse,
      usage,
      quickReplies: buildStreamQuickReplies(
        context,
        context.handoffResponse,
      ),
    };
  }

  if (context.provider === "google" && context.model) {
    const toolLoop = await runGeminiToolLoop(context, callbacks);

    if (toolLoop.handoffExecution?.triggered) {
      const response =
        toolLoop.handoffExecution.responseMessage ??
        getHandoffConfirmationMessage(context.locale);
      callbacks?.onToken?.(response);
      await persistAssistantMessage(context, response);

      return {
        fullText: response,
        usage: buildEstimatedUsage(context, response),
        quickReplies: buildStreamQuickReplies(context, response, toolLoop.usedWebSearch),
        usedWebSearch: toolLoop.usedWebSearch,
        webSearchSources: toolLoop.webSearchSources,
        webSearchQueries: toolLoop.webSearchQueries,
      };
    }

    if (toolLoop.finalText) {
      callbacks?.onToken?.(toolLoop.finalText);
      await persistAssistantMessage(context, toolLoop.finalText);

      return {
        fullText: toolLoop.finalText,
        usage: buildEstimatedUsage(context, toolLoop.finalText),
        quickReplies: buildStreamQuickReplies(
          context,
          toolLoop.finalText,
          toolLoop.usedWebSearch,
        ),
        usedWebSearch: toolLoop.usedWebSearch,
        webSearchSources: toolLoop.webSearchSources,
        webSearchQueries: toolLoop.webSearchQueries,
      };
    }

    const streamed = await streamGeminiFinalResponse(
      context,
      toolLoop.messages,
      callbacks,
    );

    if (!streamed.fullText) {
      throw new Error("Empty response from model.");
    }

    await persistAssistantMessage(context, streamed.fullText);

    return {
      fullText: streamed.fullText,
      usage: mergeTokenUsage(
        streamed.usage ?? {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        buildEstimatedUsage(context, streamed.fullText),
      ),
      quickReplies: buildStreamQuickReplies(
        context,
        streamed.fullText,
        toolLoop.usedWebSearch,
      ),
      usedWebSearch: toolLoop.usedWebSearch,
      webSearchSources: toolLoop.webSearchSources,
      webSearchQueries: toolLoop.webSearchQueries,
    };
  }

  const result = await streamOpenAiCompatibleChat({
    provider: context.provider,
    modelId: context.modelId,
    messages: context.openAiMessages,
    onToken: callbacks?.onToken,
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
    quickReplies: buildStreamQuickReplies(
      context,
      result.fullText,
      context.meta.usedWebSearch,
    ),
    usedWebSearch: context.meta.usedWebSearch,
    webSearchSources: context.meta.webSearchSources,
    webSearchQueries: context.meta.webSearchQueries,
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