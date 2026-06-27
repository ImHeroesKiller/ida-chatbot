export type UiTheme = "light" | "dark" | "system";
export type UiFontSize = "small" | "medium" | "large";
export type UiDensity = "compact" | "comfortable" | "spacious";
export type UiAnimationLevel = "full" | "reduced" | "none";

export interface IdaUiConfig {
  theme: UiTheme;
  fontSize: UiFontSize;
  density: UiDensity;
  animationLevel: UiAnimationLevel;
  primaryColor: string;
  messageMaxWidth: string;
}

export interface IdaUiConfigRow {
  id: string;
  theme: UiTheme;
  font_size: UiFontSize;
  density: UiDensity;
  animation_level: UiAnimationLevel;
  primary_color: string;
  message_max_width: string;
  updated_at: string;
}