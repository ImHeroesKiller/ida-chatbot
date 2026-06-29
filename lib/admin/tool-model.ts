import type { IdaAppConfig, ModelSelection, ToolModelKey } from "./types";

/**
 * Resolve the model for a tool/agent key. Explicit null or undefined entries
 * inherit the next fallback key, then the default chat model.
 */
export function resolveToolModel(
  config: IdaAppConfig,
  key: ToolModelKey,
  ...fallbackKeys: ToolModelKey[]
): ModelSelection {
  for (const candidate of [key, ...fallbackKeys]) {
    const override = config.toolModels[candidate];
    if (override) return override;
  }

  return config.defaultModel;
}