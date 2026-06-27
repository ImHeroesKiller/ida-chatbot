import type { Locale } from "@/lib/config";

import type { ConversationMessage } from "./memory/conversation-memory";

const HANDOFF_REPLY_PATTERNS = [
  /hubungi\s+tim\s+manusia/i,
  /talk\s+to\s+a\s+human/i,
  /联系人工客服/,
  /human\s+handoff/i,
  /handoff/i,
];

export function isHandoffQuickReply(reply: string): boolean {
  return HANDOFF_REPLY_PATTERNS.some((pattern) => pattern.test(reply.trim()));
}

export function filterQuickReplies(replies: string[]): string[] {
  return replies.filter((reply) => !isHandoffQuickReply(reply));
}

export interface QuickReplyContext {
  locale: Locale;
  messages: ConversationMessage[];
  assistantReply?: string;
  usedWebSearch?: boolean;
  usedRag?: boolean;
}

const MAX_QUICK_REPLIES = 3;

const WELCOME_REPLIES: Record<Locale, string[]> = {
  id: [
    "Apa yang bisa kamu bantu hari ini?",
    "Jelaskan fitur utama IDA",
    "Berikan contoh pertanyaan yang cocok untuk IDA",
  ],
  en: [
    "What can you help me with today?",
    "Explain IDA's main features",
    "Give me example questions I can ask",
  ],
  zh: [
    "今天你能帮我什么？",
    "介绍 IDA 的主要功能",
    "给我一些适合提问的例子",
  ],
};

const EXPLORATION_REPLIES: Record<Locale, string[]> = {
  id: [
    "Bisa jelaskan lebih sederhana?",
    "Ada contoh praktisnya?",
    "Apa langkah pertama yang disarankan?",
  ],
  en: [
    "Can you explain that more simply?",
    "Do you have a practical example?",
    "What first step do you recommend?",
  ],
  zh: [
    "能用更简单的方式说明吗？",
    "有实际例子吗？",
    "建议的第一步是什么？",
  ],
};

const DEEPEN_REPLIES: Record<Locale, string[]> = {
  id: [
    "Bisa lebih detail?",
    "Apa risiko atau kendalanya?",
    "Ada alternatif lain?",
  ],
  en: [
    "Can you go into more detail?",
    "What are the risks or constraints?",
    "Are there alternative approaches?",
  ],
  zh: [
    "能更详细一些吗？",
    "有哪些风险或限制？",
    "还有其他方案吗？",
  ],
};

const NEXT_STEP_REPLIES: Record<Locale, string[]> = {
  id: [
    "Apa langkah selanjutnya?",
    "Bagaimana cara memulainya?",
    "Apa yang perlu saya siapkan?",
  ],
  en: [
    "What should I do next?",
    "How do I get started?",
    "What should I prepare?",
  ],
  zh: [
    "下一步我该做什么？",
    "我该如何开始？",
    "我需要准备什么？",
  ],
};

const REALTIME_REPLIES: Record<Locale, string[]> = {
  id: [
    "Ada update terbaru hari ini?",
    "Bandingkan dengan periode sebelumnya",
    "Tunjukkan sumber yang kamu pakai",
  ],
  en: [
    "Any updates for today?",
    "Compare with the previous period",
    "Show the sources you used",
  ],
  zh: [
    "今天有最新更新吗？",
    "与之前相比如何？",
    "列出你使用的来源",
  ],
};

const TECHNICAL_REPLIES: Record<Locale, string[]> = {
  id: [
    "Bagaimana cara troubleshoot masalah ini?",
    "Apa best practice-nya?",
    "Ada dokumentasi resmi?",
  ],
  en: [
    "How do I troubleshoot this issue?",
    "What are the best practices?",
    "Is there official documentation?",
  ],
  zh: [
    "如何排查这个问题？",
    "最佳实践是什么？",
    "有官方文档吗？",
  ],
};

const BUSINESS_REPLIES: Record<Locale, string[]> = {
  id: [
    "Siapa stakeholder yang terlibat?",
    "Apa dampak bisnisnya?",
    "Bagaimana cara mengukur keberhasilannya?",
  ],
  en: [
    "Who are the key stakeholders?",
    "What is the business impact?",
    "How should success be measured?",
  ],
  zh: [
    "涉及哪些关键利益相关方？",
    "对业务有什么影响？",
    "如何衡量成功与否？",
  ],
};

const SUMMARY_REPLIES: Record<Locale, string[]> = {
  id: [
    "Ringkas poin utamanya",
    "Apa kesimpulanmu?",
    "Buatkan checklist singkat",
  ],
  en: [
    "Summarize the key points",
    "What is your conclusion?",
    "Create a short checklist",
  ],
  zh: [
    "总结要点",
    "你的结论是什么？",
    "给我一个简短清单",
  ],
};

const COMPARISON_REPLIES: Record<Locale, string[]> = {
  id: [
    "Bandingkan opsi A vs B",
    "Mana yang lebih cocok untuk saya?",
    "Apa kelebihan dan kekurangannya?",
  ],
  en: [
    "Compare option A vs B",
    "Which option fits me better?",
    "What are the pros and cons?",
  ],
  zh: [
    "比较 A 和 B 方案",
    "哪个更适合我？",
    "各有什么优缺点？",
  ],
};

const CLOSING_REPLIES: Record<Locale, string[]> = {
  id: [
    "Apa hal penting yang terlewat?",
    "Ada saran tambahan?",
    "Topik lain yang relevan?",
  ],
  en: [
    "Anything important I missed?",
    "Any additional recommendations?",
    "Other related topics to explore?",
  ],
  zh: [
    "有什么我遗漏的重点吗？",
    "还有其他建议吗？",
    "还有哪些相关主题？",
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function getUserMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return messages.filter(
    (message) => message.role === "user" && message.content.trim(),
  );
}

function getLastAssistantText(
  messages: ConversationMessage[],
  assistantReply?: string,
): string {
  if (assistantReply?.trim()) return assistantReply.trim();

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "assistant" && message.content.trim()) {
      return message.content.trim();
    }
  }

  return "";
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function detectTopicHints(text: string): {
  technical: boolean;
  business: boolean;
  comparison: boolean;
  procedural: boolean;
  realtime: boolean;
} {
  const normalized = normalizeText(text);

  return {
    technical: includesAny(normalized, [
      /\b(api|code|bug|error|deploy|server|database|sql|react|next\.?js)\b/i,
      /\b(teknis|program|koding|error|server|basis data)\b/i,
      /技术|代码|错误|部署/,
    ]),
    business: includesAny(normalized, [
      /\b(business|strategy|roi|revenue|market|stakeholder)\b/i,
      /\b(bisnis|strategi|pasar|pendapatan|stakeholder)\b/i,
      /商业|战略|市场|收益/,
    ]),
    comparison: includesAny(normalized, [
      /\b(compare|versus|vs|better|difference|pros|cons)\b/i,
      /\b(bandingkan|banding|lebih baik|perbedaan|kelebihan|kekurangan)\b/i,
      /比较|对比|优缺点|更好/,
    ]),
    procedural: includesAny(normalized, [
      /\b(step|how to|guide|process|workflow|checklist)\b/i,
      /\b(langkah|cara|panduan|proses|alur|checklist)\b/i,
      /步骤|如何|流程|指南/,
    ]),
    realtime: includesAny(normalized, [
      /\b(today|latest|current|now|202[4-9])\b/i,
      /\b(hari ini|terbaru|sekarang|saat ini|kurs|harga|berita)\b/i,
      /今天|最新|现在|价格|新闻/,
    ]),
  };
}

function pickUnique(
  locale: Locale,
  groups: Array<Record<Locale, string[]>>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const group of groups) {
    for (const reply of group[locale]) {
      const key = reply.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(key);
      if (result.length >= MAX_QUICK_REPLIES) {
        return filterQuickReplies(result);
      }
    }
  }

  return filterQuickReplies(result);
}

export function inferQuickReplies(context: QuickReplyContext): string[] {
  const { locale, messages, assistantReply, usedWebSearch, usedRag } = context;
  const userMessages = getUserMessages(messages);
  const lastAssistant = getLastAssistantText(messages, assistantReply);
  const combined = [
    ...messages.map((message) => message.content),
    assistantReply ?? "",
  ]
    .join("\n")
    .trim();

  if (userMessages.length === 0) {
    return filterQuickReplies(WELCOME_REPLIES[locale]);
  }

  const hints = detectTopicHints(`${combined}\n${lastAssistant}`);
  const groups: Array<Record<Locale, string[]>> = [];

  if (usedWebSearch || hints.realtime) {
    groups.push(REALTIME_REPLIES);
  }

  if (hints.procedural || includesAny(lastAssistant, [/\n\d+[\.)]/, /\n- /, /langkah/i, /step/i])) {
    groups.push(NEXT_STEP_REPLIES);
  }

  if (hints.comparison) {
    groups.push(COMPARISON_REPLIES);
  }

  if (hints.technical) {
    groups.push(TECHNICAL_REPLIES);
  }

  if (hints.business) {
    groups.push(BUSINESS_REPLIES);
  }

  if (userMessages.length >= 3 || lastAssistant.length > 700) {
    groups.push(SUMMARY_REPLIES);
  }

  if (usedRag) {
    groups.push(DEEPEN_REPLIES);
  }

  if (userMessages.length <= 1) {
    groups.push(EXPLORATION_REPLIES);
  } else {
    groups.push(DEEPEN_REPLIES, CLOSING_REPLIES);
  }

  groups.push(EXPLORATION_REPLIES, NEXT_STEP_REPLIES);

  const replies = pickUnique(locale, groups);
  if (replies.length > 0) return replies;

  return filterQuickReplies(WELCOME_REPLIES[locale]);
}