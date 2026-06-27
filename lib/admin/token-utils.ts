export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export const EMPTY_TOKEN_USAGE: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};

/** Rough estimate: ~4 characters per token for Latin/CJK mixed text */
export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateUsageFromMessages(options: {
  systemPrompt?: string;
  messages: Array<{ role: string; content: string }>;
  completion: string;
}): TokenUsage {
  const promptText = [
    options.systemPrompt ?? "",
    ...options.messages.map((message) => message.content),
  ].join("\n");

  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(options.completion);
  const totalTokens = promptTokens + completionTokens;

  return { promptTokens, completionTokens, totalTokens };
}

export function mergeTokenUsage(
  primary: TokenUsage,
  fallback: TokenUsage,
): TokenUsage {
  if (primary.totalTokens > 0) return primary;
  return fallback;
}

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatUsd(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}