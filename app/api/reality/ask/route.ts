import { NextRequest, NextResponse } from "next/server";

import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

function formatAnswer(q: string, result: unknown): string {
  const lower = q.toLowerCase();

  if (result && typeof result === "object" && "found" in result) {
    const org = result as {
      found: boolean;
      organization?: string;
      signals?: { totalMessages: number; invoiceCount: number; meetingCount: number; highPriority: number };
      communications?: Array<{ subject: string }>;
    };
    if (!org.found) {
      return `I don't have imported data for that account yet. Connect Gmail or upload a PDF/DOCX to build organizational knowledge.`;
    }
    const signals = org.signals;
    const latest = org.communications?.[0]?.subject;
    return [
      `Here's what IDA knows about ${org.organization} from your imported data:`,
      signals ? `• ${signals.totalMessages} communications indexed` : null,
      signals ? `• ${signals.meetingCount} meetings, ${signals.invoiceCount} commercial records` : null,
      signals?.highPriority ? `• ${signals.highPriority} items flagged high priority` : null,
      latest ? `• Latest: "${latest}"` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (result && typeof result === "object" && "items" in result) {
    const items = (result as { items: Array<{ title: string; organization?: string; priority?: string }> }).items;
    if (items.length === 0) {
      return "No attention items yet. Import emails or documents to populate your executive brief.";
    }
    return [
      "Items requiring attention from imported data:",
      ...items.map((item, i) => `${i + 1}. ${item.title}${item.organization ? ` (${item.organization})` : ""}${item.priority === "high" ? " — high priority" : ""}`),
    ].join("\n");
  }

  if (lower.includes("how many") || lower.includes("berapa")) {
    const snapshot = eslStore.getSnapshot();
    return `IDA has indexed ${snapshot.communications.length} communications, ${snapshot.artifacts.length} business signals, and ${snapshot.organizations.length} organizations from your imports.`;
  }

  const overview = queryEngine.overview();
  if (overview.attentionItems.length > 0) {
    const top = overview.attentionItems[0];
    return `Based on imported data, the top item is "${top.title}"${top.organization ? ` for ${top.organization}` : ""}. Ask about a specific account like PLN, Mayora, or Telkom for more detail.`;
  }

  return "Import Gmail emails or upload PDF/DOCX files first — then I can answer from your organization's real data.";
}

export async function POST(request: NextRequest) {
  try {
    await hydrateESLStore();
    const body = (await request.json()) as { q?: string };
    const q = body.q?.trim() ?? "";

    if (!q) {
      return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 });
    }

    const snapshot = eslStore.getSnapshot();
    if (snapshot.communications.length === 0) {
      return NextResponse.json({
        success: true,
        answer:
          "No imported data yet. Connect Gmail or upload a PDF/DOCX — then Ask IDA will answer from your organization's real records.",
        hasLiveData: false,
      });
    }

    const result = queryEngine.queryText(q);
    const answer = formatAnswer(q, result);

    return NextResponse.json({
      success: true,
      answer,
      hasLiveData: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ask IDA failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}