import type { Locale } from "@/lib/config";

import { transcribeAudioWithGemini } from "./gemini-transcribe";
import { GroqTranscribeError, transcribeAudioWithGroq } from "./groq-transcribe";

export type SttProvider = "groq" | "gemini";

export interface TranscribeResult {
  transcript: string;
  provider: SttProvider;
}

export async function transcribeAudio(options: {
  data: string;
  mimeType: string;
  locale: Locale;
}): Promise<TranscribeResult> {
  if (process.env.GROQ_API_KEY) {
    try {
      const transcript = await transcribeAudioWithGroq(options);
      return { transcript, provider: "groq" };
    } catch (error) {
      console.warn(
        "[IDA STT] Groq Whisper failed, falling back to Gemini:",
        error instanceof Error ? error.message : error,
      );

      if (
        error instanceof GroqTranscribeError &&
        error.message === "GROQ_API_KEY is not configured."
      ) {
        throw error;
      }
    }
  }

  const transcript = await transcribeAudioWithGemini(options);
  return { transcript, provider: "gemini" };
}