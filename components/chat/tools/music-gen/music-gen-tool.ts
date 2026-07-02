import type { Tool } from "../types";

/** Registry metadata for Music Generation (placeholder + model config ready). */
export const musicGenTool: Tool = {
  id: "music-gen",
  label: "Music Generation",
  name: "Music Gen",
  enabled: true,
  enabledByDefault: false,
  description: "Generate music / audio from text prompts (model selection available in Admin > Media Models).",
};