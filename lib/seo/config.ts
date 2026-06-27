import { BRAND, getMetadataBase } from "@/lib/brand";

export const SEO_KEYWORDS = [
  "IDA",
  "Intelligent Digital Assistant",
  "AI chatbot",
  "asisten AI",
  "chatbot Indonesia",
  "RAG",
  "AI assistant",
  "multilingual chatbot",
  "customer support AI",
] as const;

export const SEO_LOCALES = {
  id: {
    tag: "id-ID",
    hreflang: "id",
    title: "IDA — Intelligent Digital Assistant",
    description:
      "IDA — Asisten AI cerdas dengan RAG, memori percakapan, dan dukungan multibahasa (Indonesia, English, 中文).",
  },
  en: {
    tag: "en-US",
    hreflang: "en",
    title: "IDA — Intelligent Digital Assistant",
    description:
      "IDA — Intelligent Digital Assistant. AI chatbot with RAG, conversation memory, and multilingual support.",
  },
} as const;

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/chat", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.5 },
] as const;

export function getSiteUrl(): string {
  return getMetadataBase().origin;
}

export function getCanonicalUrl(path = "/"): string {
  return new URL(path, getSiteUrl()).toString();
}

export function getOgImageUrl(): string {
  return new URL("/opengraph-image", getSiteUrl()).toString();
}

export { BRAND };