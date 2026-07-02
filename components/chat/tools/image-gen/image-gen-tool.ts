import type { Tool } from "../types";

/** Registry metadata for Image Generation tool (Grok Imagine default). */
export const imageGenTool: Tool = {
  id: "image-gen",
  label: "Image Generation",
  name: "Image Gen",
  enabled: true,
  enabledByDefault: true,
  description: "Generate images from text prompts using Grok Imagine or configured media model.",
  // iconName can be used if needed
};