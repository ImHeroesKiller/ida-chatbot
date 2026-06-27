import type { ModelProvider } from "@/lib/admin/models";
import type { TokenUsage } from "@/lib/admin/token-utils";
import { formatUsd } from "@/lib/admin/token-utils";

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

/** USD per 1M tokens — approximate list prices (Jun 2026) */
export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  "google:gemini-3.1-flash-lite": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "google:gemini-3.5-flash": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "google:gemini-3-flash-preview": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "google:gemini-3.1-pro-preview": { inputPer1M: 1.25, outputPer1M: 5.0 },
  "google:gemini-2.5-flash": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "google:gemini-2.5-flash-lite": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "google:gemini-2.5-pro": { inputPer1M: 1.25, outputPer1M: 5.0 },
  "google:gemini-2.0-flash": { inputPer1M: 0.1, outputPer1M: 0.4 },
  "google:gemini-2.0-flash-lite": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "google:gemini-1.5-pro": { inputPer1M: 1.25, outputPer1M: 5.0 },
  "google:gemini-1.5-flash": { inputPer1M: 0.075, outputPer1M: 0.3 },
  "groq:llama-3.3-70b-versatile": { inputPer1M: 0.59, outputPer1M: 0.79 },
  "groq:llama-3.1-8b-instant": { inputPer1M: 0.05, outputPer1M: 0.08 },
  "groq:gemma2-9b-it": { inputPer1M: 0.2, outputPer1M: 0.2 },
  "xai:grok-4.3": { inputPer1M: 1.25, outputPer1M: 2.5 },
  "xai:grok-4.20-0309-reasoning": { inputPer1M: 1.25, outputPer1M: 2.5 },
  "xai:grok-4.20-0309-non-reasoning": { inputPer1M: 1.25, outputPer1M: 2.5 },
  "xai:grok-build-0.1": { inputPer1M: 1.0, outputPer1M: 2.0 },
  "xai:grok-2-1212": { inputPer1M: 2.0, outputPer1M: 10.0 },
  "huggingface:meta-llama/Meta-Llama-3-8B-Instruct": {
    inputPer1M: 0.2,
    outputPer1M: 0.2,
  },
  "huggingface:mistralai/Mistral-7B-Instruct-v0.3": {
    inputPer1M: 0.2,
    outputPer1M: 0.2,
  },
};

const FALLBACK_PRICING: ModelPricing = { inputPer1M: 0.5, outputPer1M: 1.5 };

export function modelPricingKey(
  provider: ModelProvider | string,
  model: string,
): string {
  return `${provider}:${model}`;
}

export function getModelPricing(
  provider: ModelProvider | string,
  model: string,
  overrides?: Record<string, ModelPricing>,
): ModelPricing {
  const key = modelPricingKey(provider, model);
  return overrides?.[key] ?? DEFAULT_MODEL_PRICING[key] ?? FALLBACK_PRICING;
}

export function estimateRequestCost(options: {
  provider: ModelProvider | string;
  model: string;
  usage: TokenUsage;
  pricingOverrides?: Record<string, ModelPricing>;
}): number {
  const pricing = getModelPricing(
    options.provider,
    options.model,
    options.pricingOverrides,
  );

  const inputCost =
    (options.usage.promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost =
    (options.usage.completionTokens / 1_000_000) * pricing.outputPer1M;

  return inputCost + outputCost;
}

export function formatCostUsd(value: number): string {
  return formatUsd(value);
}