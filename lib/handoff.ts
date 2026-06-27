import type { Locale } from "@/lib/config";
import type { IdaHandoffPrefill } from "@/lib/types";

import type { ConversationMessage } from "./memory/conversation-memory";

const TOPIC_RULES: { topic: string; keywords: string[] }[] = [
  {
    topic: "general",
    keywords: ["help", "bantuan", "assist", "帮助", "general", "umum"],
  },
  {
    topic: "technical",
    keywords: [
      "technical",
      "teknis",
      "bug",
      "error",
      "api",
      "code",
      "技术",
      "编程",
    ],
  },
  {
    topic: "consultation",
    keywords: [
      "konsultasi",
      "consultation",
      "咨询",
      "mulai konsultasi",
      "start consultation",
    ],
  },
  {
    topic: "business",
    keywords: [
      "business",
      "bisnis",
      "strategy",
      "strategi",
      "商业",
      "战略",
      "consulting",
    ],
  },
  {
    topic: "support",
    keywords: ["support", "dokumen", "document", "faq", "支持", "文档"],
  },
];

const SUMMARY_HEADERS: Record<Locale, string> = {
  id: "Ringkasan percakapan dengan IDA:",
  en: "Summary of conversation with IDA:",
  zh: "与 IDA 的对话摘要：",
};

function scoreTopic(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, keyword) => {
    return lower.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

export function inferHandoffTopic(messages: ConversationMessage[]): string {
  const combined = messages.map((message) => message.content).join("\n");

  let best = TOPIC_RULES[0]!;
  let bestScore = 0;

  for (const rule of TOPIC_RULES) {
    const score = scoreTopic(combined, rule.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  return best.topic;
}

export function buildConversationSummary(
  messages: ConversationMessage[],
  locale: Locale,
  maxLength = 1800,
): string {
  const header = SUMMARY_HEADERS[locale];
  const lines = messages
    .filter((message) => message.content.trim())
    .map((message) => {
      const roleLabel =
        message.role === "user"
          ? locale === "zh"
            ? "用户"
            : locale === "en"
              ? "User"
              : "Pengguna"
          : "IDA";
      return `${roleLabel}: ${message.content.trim()}`;
    });

  const body = lines.join("\n");
  const summary = `${header}\n\n${body}`;

  if (summary.length <= maxLength) return summary;

  return `${summary.slice(0, maxLength - 3)}...`;
}

export function buildHandoffPrefill(
  messages: ConversationMessage[],
  locale: Locale,
): IdaHandoffPrefill {
  const apiMessages = messages.filter((message) => message.content.trim());
  const topic = inferHandoffTopic(apiMessages);

  return {
    topic,
    description: buildConversationSummary(apiMessages, locale),
  };
}

export function getQuickReplies(locale: Locale): string[] {
  const replies: Record<Locale, string[]> = {
    id: [
      "Apa yang bisa kamu bantu?",
      "Jelaskan fitur IDA",
      "Butuh bantuan lanjutan",
    ],
    en: [
      "What can you help with?",
      "Explain IDA features",
      "Need further assistance",
    ],
    zh: ["你能帮我什么？", "介绍 IDA 功能", "需要进一步帮助"],
  };

  return replies[locale];
}