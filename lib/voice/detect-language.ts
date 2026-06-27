import type { Locale } from "@/lib/config";

const INDONESIAN_MARKERS =
  /\b(saya|anda|kamu|yang|dengan|untuk|adalah|ini|itu|dari|akan|bisa|tidak|apa|bagaimana|silakan|terima kasih|halo|tolong|juga|sudah|belum|harus|mohon|informasi|pertanyaan)\b/gi;

export function detectSpeechLanguage(text: string): Locale {
  const sample = text.replace(/\s+/g, " ").trim().slice(0, 800);
  if (!sample) return "id";

  const cjkChars = (sample.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  const latinChars = (sample.match(/[a-zA-Z]/g) ?? []).length;
  const total = Math.max(sample.length, 1);

  if (cjkChars / total > 0.12) return "zh";

  const idHits = (sample.match(INDONESIAN_MARKERS) ?? []).length;
  if (idHits >= 2) return "id";

  if (latinChars / total > 0.5) return "en";

  return "id";
}