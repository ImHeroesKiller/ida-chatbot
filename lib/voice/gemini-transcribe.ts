import { IDA_CONFIG, type Locale } from "@/lib/config";

const TRANSCRIBE_PROMPTS: Record<Locale, string> = {
  id: `Transkripsikan audio berikut ke teks Bahasa Indonesia.
Aturan:
- Hanya kembalikan transkrip ucapan, tanpa penjelasan atau format tambahan.
- Pertahankan tanda baca yang wajar.
- Jika audio tidak jelas atau kosong, kembalikan string kosong.`,
  en: `Transcribe the following audio to English text.
Rules:
- Return only the spoken transcript, no explanation or extra formatting.
- Use reasonable punctuation.
- If audio is unclear or empty, return an empty string.`,
  zh: `将以下音频转录为中文文本。
规则：
- 仅返回语音转录内容，不要解释或额外格式。
- 使用合理的标点符号。
- 如果音频不清楚或为空，返回空字符串。`,
};

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

function normalizeMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? mimeType;
  return SUPPORTED_AUDIO_TYPES.has(base) ? base : "audio/webm";
}

export async function transcribeAudioWithGemini(options: {
  data: string;
  mimeType: string;
  locale: Locale;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const mimeType = normalizeMimeType(options.mimeType);
  const prompt = TRANSCRIBE_PROMPTS[options.locale];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IDA_CONFIG.model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: options.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Gemini transcribe failed (${response.status}): ${errorBody.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}