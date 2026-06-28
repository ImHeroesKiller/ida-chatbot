export const FOCUS_CHAT_COMPOSER_EVENT = "ida:focus-chat-composer";

export function requestChatComposerFocus(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FOCUS_CHAT_COMPOSER_EVENT));
}