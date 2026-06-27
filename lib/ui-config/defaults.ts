import type { IdaUiConfig } from "@/lib/ui-config/types";

export const DEFAULT_UI_CONFIG: IdaUiConfig = {
  theme: "system",
  fontSize: "medium",
  density: "comfortable",
  animationLevel: "full",
  primaryColor: "#171717",
  messageMaxWidth: "42rem",
};

export const MESSAGE_MAX_WIDTH_OPTIONS = [
  { value: "36rem", label: "Narrow (36rem)" },
  { value: "42rem", label: "Default (42rem)" },
  { value: "48rem", label: "Wide (48rem)" },
  { value: "56rem", label: "Extra wide (56rem)" },
] as const;