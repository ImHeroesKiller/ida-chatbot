import type { Locale } from "@/lib/config";
import { IDA_CONFIG } from "@/lib/config";

const GROQ_TRANSCRIBE_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";

const LOCALE_TO_WHISPER_LANG: Record<Locale, string> = {
  id: "id",
  en: "en",
  zh: "zh",
};

const WHISPER_PROMPTS: Record<Locale, string> = {
  id: "Transkripsi ucapan Bahasa Indonesia. Gunakan tanda baca dan ejaan standar.",
  en: "English speech transcription with proper punctuation and spelling.",
  zh: "中文语音转录，使用标准标点符号和汉字。",
};

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
};

function resolveExtension(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? mimeType;
  return MIME_TO_EXTENSION[base] ?? "webm";
}

export class GroqTranscribeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroqTranscribeError";
  }
}

export async function transcribeAudioWithGroq(options: {
  data: string;
  mimeType: string;
  locale: Locale;
}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new GroqTranscribeError("GROQ_API_KEY is not configured.");
  }

  const extension = resolveExtension(options.mimeType);
  const bytes = Buffer.from(options.data, "base64");
  const formData = new FormData();

  formData.append(
    "file",
    new Blob([bytes], { type: options.mimeType.split(";")[0] }),
    `recording.${extension}`,
  );
  formData.append("model", IDA_CONFIG.sttModel);
  formData.append("language", LOCALE_TO_WHISPER_LANG[options.locale]);
  formData.append("prompt", WHISPER_PROMPTS[options.locale]);
  formData.append("response_format", "json");
  formData.append("temperature", "0");

  const response = await fetch(GROQ_TRANSCRIBE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new GroqTranscribeError(
      `Groq transcribe failed (${response.status}): ${errorBody.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as { text?: string };

  return payload.text?.trim() ?? "";
}