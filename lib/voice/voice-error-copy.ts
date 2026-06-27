import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";

import type { VoiceInputErrorCode } from "./use-voice-input";

export function getVoiceErrorMessage(
  locale: Locale,
  code: VoiceInputErrorCode | null,
): string | null {
  if (!code || code === "aborted") return null;

  const copy = COPY[locale];

  switch (code) {
    case "not-allowed":
      return copy.voiceErrorNotAllowed;
    case "no-speech":
      return copy.voiceErrorNoSpeech;
    case "network":
      return copy.voiceErrorNetwork;
    case "unsupported":
      return copy.voiceErrorUnsupported;
    case "mic-failed":
      return copy.voiceErrorMic;
    default:
      return copy.voiceError;
  }
}