import {
  findModelDefinition,
  isProviderConfigured,
} from "@/lib/admin/models";
import type { ModelSelection } from "@/lib/admin/types";

export function isSameModel(
  a: ModelSelection | null | undefined,
  b: ModelSelection | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.id === b.id && a.provider === b.provider;
}

export function isModelConfigured(selection: ModelSelection): boolean {
  if (!isProviderConfigured(selection.provider)) return false;
  const definition = findModelDefinition(selection.id, selection.provider);
  return Boolean(definition);
}

export function shouldRetryWithFallback(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("503") ||
      message.includes("failed") ||
      message.includes("empty response") ||
      message.includes("not configured") ||
      message.includes("timeout")
    );
  }
  return true;
}