import { z } from "zod";

import type { Locale } from "@/lib/config";

export const HANDOFF_TOOL_NAME = "trigger_handoff";

export const handoffToolSchema = z.object({
  reason: z
    .string()
    .describe("Brief reason why the user needs human consultation or support"),
  urgency: z
    .enum(["normal", "high"])
    .default("normal")
    .describe("Urgency level for the handoff request"),
});

export type HandoffToolInput = z.infer<typeof handoffToolSchema>;

export const handoffToolDefinition = {
  name: HANDOFF_TOOL_NAME,
  description:
    "Transfer the user to a human agent for consultation or escalated support. Call when the user explicitly asks to start consultation, speak with a human, or needs help beyond IDA's knowledge base.",
  schema: handoffToolSchema,
};

const KEYWORD_PATTERNS: Record<Locale, RegExp[]> = {
  id: [
    /mulai\s+konsultasi/i,
    /ingin\s+konsultasi/i,
    /hubungi\s+tim\s+manusia/i,
    /bicara\s+dengan\s+agen/i,
  ],
  en: [
    /start\s+(a\s+)?consultation/i,
    /talk\s+to\s+(a\s+)?human/i,
    /speak\s+with\s+(an\s+)?agent/i,
  ],
  zh: [/开始咨询/, /联系人工/, /转接人工/],
};

export type HandoffTriggerSource = "keyword" | "tool_call";

export function detectHandoffKeyword(
  message: string,
  locale: Locale,
): string | null {
  const patterns = KEYWORD_PATTERNS[locale];

  for (const pattern of patterns) {
    if (pattern.test(message)) {
      return pattern.source;
    }
  }

  return null;
}

export function getHandoffConfirmationMessage(locale: Locale): string {
  const messages: Record<Locale, string> = {
    id: "Baik, saya menyiapkan handoff ke tim manusia untuk konsultasi Anda. Ringkasan percakapan sudah disiapkan — silakan lanjutkan melalui dialog handoff.",
    en: "I'll prepare a handoff to our human team for your consultation. A conversation summary is ready — please continue via the handoff dialog.",
    zh: "好的，我正在为您准备转接人工客服进行咨询。对话摘要已准备好，请通过转接对话框继续。",
  };

  return messages[locale];
}