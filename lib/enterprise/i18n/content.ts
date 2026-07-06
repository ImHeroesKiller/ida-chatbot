import type { BriefCard, MemoryItem, TimelineEvent } from "@/components/enterprise/experience/types";
import type { EnterpriseMessages } from "./types";
import { translate } from "./translate";

export function localizeBriefCards(
  base: BriefCard[],
  messages: EnterpriseMessages,
): BriefCard[] {
  const cards = messages.content.briefCards as Record<
    string,
    { title: string; description: string }
  >;

  return base.map((card) => {
    const localized = cards[card.id];
    if (!localized) return card;
    return {
      ...card,
      title: localized.title,
      description: localized.description,
      metric: card.metric ? localizeMetric(card.metric, messages) : card.metric,
    };
  });
}

function localizeMetric(metric: string, messages: EnterpriseMessages): string {
  const metrics = messages.content.metrics as Record<string, string>;
  if (metric === "Due in 24h" && metrics.dueIn24h) return metrics.dueIn24h;
  if (metric === "Health 94" && metrics.health94) return metrics.health94;
  if (metric === "Rp 450M exposure" && metrics.exposure450m) return metrics.exposure450m;
  return metric;
}

export function buildWorkforceMemoryEntry(messages: EnterpriseMessages): MemoryItem {
  const out = messages.workforce.workforceOutput as Record<string, string>;
  return {
    id: "wf-pln-analysis",
    tab: "decisions",
    title: out.memoryTitle,
    subtitle: out.memorySubtitle,
    date: out.justNow,
    entityType: "company",
    entityId: "pln",
    workforce: true,
  };
}

export function buildWorkforceCeoInsight(messages: EnterpriseMessages): BriefCard {
  const out = messages.workforce.workforceOutput as Record<string, string>;
  return {
    id: "wf-ceo-insight",
    tone: "opportunity",
    title: out.ceoInsightTitle,
    description: out.ceoInsightDesc,
    entityType: "company",
    entityId: "pln",
    metric: "Rp 4.2B",
    workforce: true,
  };
}

export function buildWorkforceTimelineEntry(messages: EnterpriseMessages): TimelineEvent {
  const out = messages.workforce.workforceOutput as Record<string, string>;
  return {
    id: "wf-timeline-pln",
    date: out.justNow,
    title: out.timelineTitle,
    type: "decision",
    entityType: "company",
    entityId: "pln",
    summary: out.timelineSummary,
  };
}

export function translateNested(
  messages: Record<string, unknown>,
  key: string,
  params?: Record<string, string | number>,
): string {
  return translate(messages, key, params);
}