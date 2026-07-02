import type { Tool } from "../types";

/** Registry metadata for Video Generation (placeholder + model config ready). */
export const videoGenTool: Tool = {
  id: "video-gen",
  label: "Video Generation",
  name: "Video Gen",
  enabled: true,
  enabledByDefault: false,
  description: "Generate short videos from prompts (model selection available in Admin > Media Models).",
};