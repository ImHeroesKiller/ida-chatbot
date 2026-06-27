import type { ModelProvider } from "@/lib/admin/models";
import { MODEL_PROVIDERS } from "@/lib/admin/models";

export interface SimpleChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

function parseSseDelta(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return null;

  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const text = parsed.choices?.[0]?.delta?.content;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

export async function* streamOpenAiCompatibleChat(options: {
  provider: ModelProvider;
  modelId: string;
  messages: SimpleChatMessage[];
}): AsyncGenerator<string> {
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const delta = parseSseDelta(line);
      if (delta) yield delta;
    }
  }
}