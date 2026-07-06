import { getEnterpriseMessages } from "./messages";
import { interpolate } from "./translate";
import type { EnterpriseLocale } from "./types";

type OrgResult = {
  found: boolean;
  organization?: string;
  signals?: {
    totalMessages: number;
    invoiceCount: number;
    meetingCount: number;
    highPriority: number;
  };
  communications?: Array<{ subject: string }>;
};

type AttentionResult = {
  items: Array<{ title: string; organization?: string; priority?: string }>;
};

export function formatAskAnswer(
  locale: EnterpriseLocale,
  q: string,
  result: unknown,
  snapshot: {
    communications: unknown[];
    artifacts: unknown[];
    organizations: unknown[];
  },
  overview: { attentionItems: Array<{ title: string; organization?: string }> },
): string {
  const { askResponses: t } = getEnterpriseMessages(locale);
  const lower = q.toLowerCase();

  if (result && typeof result === "object" && "found" in result) {
    const org = result as OrgResult;
    if (!org.found) return t.noAccount;

    const signals = org.signals;
    const latest = org.communications?.[0]?.subject;
    const lines = [
      interpolate(t.orgHeader, { organization: org.organization ?? "" }),
      signals ? interpolate(t.communications, { count: signals.totalMessages }) : null,
      signals
        ? interpolate(t.meetingsCommercial, {
            meetings: signals.meetingCount,
            invoices: signals.invoiceCount,
          })
        : null,
      signals?.highPriority
        ? interpolate(t.highPriority, { count: signals.highPriority })
        : null,
      latest ? interpolate(t.latest, { subject: latest }) : null,
    ].filter(Boolean);

    return lines.join("\n");
  }

  if (result && typeof result === "object" && "items" in result) {
    const items = (result as AttentionResult).items;
    if (items.length === 0) return t.noAttention;

    return [
      t.attentionHeader,
      ...items.map((item, i) =>
        interpolate(t.attentionItem, {
          index: i + 1,
          title: item.title,
          org: item.organization ? ` (${item.organization})` : "",
          priority: item.priority === "high" ? t.highPriorityTag : "",
        }),
      ),
    ].join("\n");
  }

  if (lower.includes("how many") || lower.includes("berapa")) {
    return interpolate(t.indexedSummary, {
      communications: snapshot.communications.length,
      artifacts: snapshot.artifacts.length,
      organizations: snapshot.organizations.length,
    });
  }

  if (overview.attentionItems.length > 0) {
    const top = overview.attentionItems[0];
    const orgSuffix = top.organization
      ? locale === "en"
        ? ` for ${top.organization}`
        : ` untuk ${top.organization}`
      : "";
    return interpolate(t.topItem, { title: top.title, org: orgSuffix });
  }

  return t.importFirst;
}