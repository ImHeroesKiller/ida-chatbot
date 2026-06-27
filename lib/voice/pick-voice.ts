import type { Locale } from "@/lib/config";

const LOCALE_TAGS: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
  zh: "zh-CN",
};

const VOICE_PRIORITY: Record<Locale, string[]> = {
  id: [
    "Gadis Online (Natural)",
    "Google Bahasa Indonesia",
    "id-id-x-idc",
    "id-id-x-idd",
    "Damayanti",
    "id-ID",
  ],
  en: [
    "Natural) - English (United States)",
    "Samantha",
    "Google US English",
    "Karen",
    "Daniel",
    "en-US",
  ],
  zh: [
    "Xiaoxiao Online (Natural)",
    "Google 普通话",
    "cmn-CN-x-ccc",
    "Tingting",
    "Lilian",
    "zh-CN",
    "cmn-CN",
  ],
};

const LOW_QUALITY_HINTS = [
  "compact",
  "espeak",
  "festival",
  "mbrola",
  "novelty",
];

function scoreVoice(voice: SpeechSynthesisVoice, locale: Locale): number {
  const name = voice.name;
  const lang = voice.lang.toLowerCase();
  const target = LOCALE_TAGS[locale].toLowerCase();
  let score = 0;

  if (lang === target) score += 40;
  else if (lang.startsWith(locale)) score += 25;
  else if (lang.includes(locale)) score += 10;

  VOICE_PRIORITY[locale].forEach((hint, index) => {
    if (name.includes(hint)) score += 30 - index * 2;
  });

  if (name.includes("Natural")) score += 20;
  if (name.includes("Online")) score += 12;
  if (name.includes("Google")) score += 8;
  if (name.includes("Microsoft")) score += 8;
  if (!voice.localService) score += 6;

  if (LOW_QUALITY_HINTS.some((hint) => name.toLowerCase().includes(hint))) {
    score -= 30;
  }

  return score;
}

export function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  locale: Locale,
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const ranked = [...voices].sort(
    (a, b) => scoreVoice(b, locale) - scoreVoice(a, locale),
  );

  return ranked[0] ?? null;
}

export function getLocaleTag(locale: Locale): string {
  return LOCALE_TAGS[locale];
}