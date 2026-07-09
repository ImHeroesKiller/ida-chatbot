import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import {
  streamOpenAiCompatibleChat,
  type SimpleChatMessage,
} from "@/lib/admin/chat-stream";
import { getProviderApiKey, isProviderConfigured } from "@/lib/admin/models";
import { formatAskAnswer } from "@/lib/enterprise/i18n/ask-format";
import { getEnterpriseMessages } from "@/lib/enterprise/i18n/messages";
import type { EnterpriseLocale } from "@/lib/enterprise/i18n/types";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

import { buildAskIdaContext } from "./context";
import type {
  AskIdaLocale,
  AskIdaResponse,
  AskIdaStructuredAnswer,
  SuggestedAction,
} from "./types";

const SYSTEM_PROMPT_EN = `You are IDA — Enterprise Decision Operating System (Intelligent Decision Automation).

You have access to the organization's knowledge graph and corporate memory provided in CONTEXT.
Your job is to help leaders make better decisions by:
- Analyzing the situation using corporate data
- Giving clear, actionable recommendations
- Explaining risks and implications
- Suggesting next execution steps for Human Workforce and/or Digital Workforce

Rules:
- Always answer in an enterprise / board-level tone.
- Use only facts present in CONTEXT. If data is insufficient, say so honestly.
- Prefer decision packages over generic chat answers.
- Do not invent account metrics, invoices, or stakeholders not in CONTEXT.
- Humans retain final authority; you recommend, you do not auto-approve decisions.

Respond with ONLY valid JSON (no markdown fences) in this shape:
{
  "analysis": "string — situation analysis grounded in data",
  "recommendation": "string — clear recommended decision / next move",
  "risks": "string — key risks and implications (optional but preferred)",
  "suggestedActions": [
    {
      "action": "string — concrete step",
      "owner": "Human Workforce" | "Digital Workforce" | "Either",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

const SYSTEM_PROMPT_ID = `Anda adalah IDA — Enterprise Decision Operating System (Intelligent Decision Automation).

Anda memiliki akses ke knowledge graph dan memory organisasi di CONTEXT.
Tugas Anda membantu pemimpin mengambil keputusan yang lebih baik dengan:
- Menganalisis situasi berdasarkan data korporasi
- Memberikan rekomendasi yang jelas dan actionable
- Menjelaskan risiko dan implikasi
- Menyarankan langkah eksekusi berikutnya (Human Workforce atau Digital Workforce)

Aturan:
- Jawab dengan tone enterprise / board-level.
- Gunakan hanya fakta di CONTEXT. Jika data kurang, katakan jujur.
- Utamakan decision package, bukan jawaban chat generik.
- Jangan mengarang metrik, invoice, atau stakeholder yang tidak ada di CONTEXT.
- Manusia tetap otoritas final; Anda merekomendasikan, bukan menyetujui otomatis.

Jawab HANYA JSON valid (tanpa markdown fence) dengan bentuk:
{
  "analysis": "string",
  "recommendation": "string",
  "risks": "string (opsional tapi disarankan)",
  "suggestedActions": [
    {
      "action": "string",
      "owner": "Human Workforce" | "Digital Workforce" | "Either",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

function messageContentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string"
          ? part
          : part && typeof part === "object" && "text" in part
            ? String((part as { text: unknown }).text)
            : "",
      )
      .join("");
  }
  return "";
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function normalizeOwner(
  value: unknown,
): SuggestedAction["owner"] {
  const s = String(value ?? "").toLowerCase();
  if (s.includes("digital")) return "Digital Workforce";
  if (s.includes("either") || s.includes("both")) return "Either";
  return "Human Workforce";
}

function normalizePriority(
  value: unknown,
): SuggestedAction["priority"] {
  const s = String(value ?? "").toLowerCase();
  if (s === "high" || s === "medium" || s === "low") return s;
  return "medium";
}

export function parseStructuredAnswer(
  raw: string,
): AskIdaStructuredAnswer | null {
  try {
    const parsed = JSON.parse(stripCodeFences(raw)) as Record<string, unknown>;
    const analysis = String(parsed.analysis ?? "").trim();
    const recommendation = String(parsed.recommendation ?? "").trim();
    if (!analysis && !recommendation) return null;

    const risks =
      typeof parsed.risks === "string" && parsed.risks.trim()
        ? parsed.risks.trim()
        : undefined;

    const actionsRaw = Array.isArray(parsed.suggestedActions)
      ? parsed.suggestedActions
      : [];

    const suggestedActions: SuggestedAction[] = [];
    for (const item of actionsRaw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const action = String(row.action ?? row.step ?? "").trim();
      if (!action) continue;
      suggestedActions.push({
        action,
        owner: normalizeOwner(row.owner),
        priority: normalizePriority(row.priority),
      });
      if (suggestedActions.length >= 8) break;
    }

    return {
      analysis: analysis || recommendation,
      recommendation: recommendation || analysis,
      risks,
      suggestedActions,
    };
  } catch {
    return null;
  }
}

export function formatStructuredMarkdown(
  structured: AskIdaStructuredAnswer,
  locale: AskIdaLocale,
): string {
  const labels =
    locale === "id"
      ? {
          analysis: "Analisis",
          recommendation: "Rekomendasi",
          risks: "Risiko & implikasi",
          actions: "Langkah eksekusi",
        }
      : {
          analysis: "Analysis",
          recommendation: "Recommendation",
          risks: "Risks & implications",
          actions: "Suggested actions",
        };

  const lines = [
    `**${labels.analysis}**`,
    structured.analysis,
    "",
    `**${labels.recommendation}**`,
    structured.recommendation,
  ];

  if (structured.risks) {
    lines.push("", `**${labels.risks}**`, structured.risks);
  }

  if (structured.suggestedActions.length > 0) {
    lines.push("", `**${labels.actions}**`);
    for (const a of structured.suggestedActions) {
      const p = a.priority ? ` [${a.priority}]` : "";
      lines.push(`- (${a.owner})${p} ${a.action}`);
    }
  }

  return lines.join("\n");
}

async function invokeChatModel(options: {
  system: string;
  user: string;
}): Promise<string> {
  const appConfig = await loadAppConfig();
  const selected = appConfig.defaultModel;
  const apiKey = getProviderApiKey(selected.provider);

  if (!apiKey || !isProviderConfigured(selected.provider)) {
    throw new Error("Chat model is not configured.");
  }

  if (selected.provider === "google") {
    const model = new ChatGoogleGenerativeAI({
      apiKey,
      model: selected.id,
      temperature: 0.35,
    });
    const response = await model.invoke([
      new SystemMessage(options.system),
      new HumanMessage(options.user),
    ]);
    return messageContentToText(response.content).trim();
  }

  const messages: SimpleChatMessage[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  const result = await streamOpenAiCompatibleChat({
    provider: selected.provider,
    modelId: selected.id,
    messages,
  });

  return result.fullText.trim();
}

function heuristicFallback(
  question: string,
  locale: EnterpriseLocale,
  queryResult: unknown,
  hasLiveData: boolean,
): { answer: string; source: "heuristic" | "empty" } {
  const { askResponses } = getEnterpriseMessages(locale);

  if (!hasLiveData && !queryResult) {
    // Still have demo memory — give a short pointer rather than empty
    return {
      answer:
        locale === "id"
          ? "Model AI belum dikonfigurasi. Gunakan data demo: fokus pada PLN (SCADA Phase II), Hutama Karya (INV-203 / Segment 7 stalled), Mayora (PO-8821), dan Telkom (renewal). Konfigurasi GEMINI_API_KEY untuk jawaban Decision OS penuh."
          : "AI model is not configured. Using demo memory: focus on PLN (SCADA Phase II), Hutama Karya (INV-203 / Segment 7 stalled), Mayora (PO-8821), and Telkom (renewal). Configure GEMINI_API_KEY for full Decision OS answers.",
      source: "heuristic",
    };
  }

  if (hasLiveData) {
    const snapshot = eslStore.getSnapshot();
    const overview = queryEngine.overview();
    const result = queryResult ?? queryEngine.queryText(question);
    return {
      answer: formatAskAnswer(locale, question, result, snapshot, overview),
      source: "heuristic",
    };
  }

  return { answer: askResponses.noDataYet, source: "empty" };
}

export async function runAskIda(options: {
  question: string;
  locale?: string;
}): Promise<AskIdaResponse> {
  const locale: AskIdaLocale = options.locale === "id" ? "id" : "en";
  const question = options.question.trim();
  const { askResponses } = getEnterpriseMessages(locale);

  if (!question) {
    return {
      success: false,
      answer: "",
      error: askResponses.questionRequired,
      hasLiveData: false,
      source: "empty",
      locale,
    };
  }

  const { contextText, hasLiveData, queryResult } =
    await buildAskIdaContext(question);

  try {
    const system = locale === "id" ? SYSTEM_PROMPT_ID : SYSTEM_PROMPT_EN;
    const user = [
      `QUESTION:\n${question}`,
      "",
      "CONTEXT (Organization Memory + ESL / Knowledge Graph):",
      contextText,
      "",
      "Return JSON only.",
    ].join("\n");

    const raw = await invokeChatModel({ system, user });
    const structured = parseStructuredAnswer(raw);
    const answer = structured
      ? formatStructuredMarkdown(structured, locale)
      : raw || askResponses.askFailed;

    return {
      success: true,
      answer,
      structured,
      hasLiveData,
      source: "llm",
      locale,
    };
  } catch (error) {
    console.error("[Ask IDA]", error);
    const fallback = heuristicFallback(
      question,
      locale,
      queryResult,
      hasLiveData,
    );
    return {
      success: true,
      answer: fallback.answer,
      structured: null,
      hasLiveData,
      source: fallback.source,
      locale,
    };
  }
}
