import type { ModelProvider } from "@/lib/admin/models";
import { MODEL_PROVIDERS } from "@/lib/admin/models";
import type { TokenUsage } from "@/lib/admin/token-utils";
import { EMPTY_TOKEN_USAGE } from "@/lib/admin/token-utils";

export interface SimpleChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChatResult {
  fullText: string;
  usage: TokenUsage;
}

function getProviderEndpoint(provider: ModelProvider, modelId: string): string {
  switch (provider) {
    case "groq":
      return "https://api.groq.com/openai/v1/chat/completions";
    case "xai":
      return "https://api.x.ai/v1/chat/completions";
    case "huggingface":
      return `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function parseSseChunk(line: string): {
  text: string | null;
  usage: TokenUsage | null;
} {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) {
    return { text: null, usage: null };
  }

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") {
    return { text: null, usage: null };
  }

  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const text = parsed.choices?.[0]?.delta?.content ?? null;
    const usage = parsed.usage;

    if (usage) {
      return {
        text: typeof text === "string" ? text : null,
        usage: {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens:
            usage.total_tokens ??
            (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
        },
      };
    }

    return {
      text: typeof text === "string" ? text : null,
      usage: null,
    };
  } catch {
    return { text: null, usage: null };
  }
}

export async function streamOpenAiCompatibleChat(options: {
  provider: ModelProvider;
  modelId: string;
  messages: SimpleChatMessage[];
  onToken?: (token: string) => void;
}): Promise<StreamChatResult> {
  const envKey = MODEL_PROVIDERS[options.provider].envKey;
  const apiKey = process.env[envKey]?.trim();

  if (!apiKey) {
    throw new Error(`${envKey} is not configured.`);
  }

  const response = await fetch(
    getProviderEndpoint(options.provider, options.modelId),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.modelId,
        messages: options.messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.7,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `${options.provider} chat failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  if (!response.body) {
    throw new Error("Empty response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let usage = EMPTY_TOKEN_USAGE;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const chunk = parseSseChunk(line);
      if (chunk.text) {
        fullText += chunk.text;
        options.onToken?.(chunk.text);
      }
      if (chunk.usage && chunk.usage.totalTokens > 0) {
        usage = chunk.usage;
      }
    }
  }

  return { fullText: fullText.trim(), usage };
}