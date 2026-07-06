import type { EnterpriseMessages } from "@/lib/enterprise/i18n/types";
import {
  buildWorkforceCeoInsight,
  buildWorkforceMemoryEntry,
  buildWorkforceTimelineEntry,
} from "@/lib/enterprise/i18n/content";
import { translate } from "@/lib/enterprise/i18n/translate";

import type {
  DigitalWorker,
  PerspectiveConfig,
  PerspectiveId,
} from "./types";

export const WORKER_DEFS: Array<{
  id: string;
  perspectives: PerspectiveId[];
  accent: string;
}> = [
  {
    id: "proposal-analyst",
    perspectives: ["sales", "ceo"],
    accent: "from-violet-500/20 to-violet-600/5 text-violet-700",
  },
  {
    id: "contract-reviewer",
    perspectives: ["cfo", "ceo"],
    accent: "from-blue-500/20 to-blue-600/5 text-blue-700",
  },
  {
    id: "relationship-analyst",
    perspectives: ["hr", "sales", "ceo"],
    accent: "from-emerald-500/20 to-emerald-600/5 text-emerald-700",
  },
  {
    id: "delivery-monitor",
    perspectives: ["project", "ceo"],
    accent: "from-amber-500/20 to-amber-600/5 text-amber-700",
  },
  {
    id: "commercial-analyst",
    perspectives: ["cfo"],
    accent: "from-rose-500/20 to-rose-600/5 text-rose-700",
  },
];

const METRIC_KEYS: Record<PerspectiveId, string[]> = {
  ceo: ["activeAccounts", "pipeline", "criticalItems", "workforceInsights"],
  cfo: ["pipelineValue", "outstanding", "poExecuted", "paymentRisk"],
  sales: ["activePipeline", "proposalsInReview", "winRate", "workforceTasks"],
  project: ["onTrack", "atRisk", "stalled", "blockedDeliverables"],
  hr: ["activeStakeholders", "engagementScore", "atRiskRelationships", "championChanges"],
};

const METRIC_VALUES: Record<PerspectiveId, Array<{ value: string; delta?: string; tone?: "neutral" | "positive" | "warning" | "critical" }>> = {
  ceo: [
    { value: "4", delta: "+1 this quarter", tone: "positive" },
    { value: "Rp 6.4B", tone: "positive" },
    { value: "2", tone: "critical" },
    { value: "0", tone: "neutral" },
  ],
  cfo: [
    { value: "Rp 6.4B", tone: "positive" },
    { value: "Rp 127M", delta: "INV-203 due 7 Jul", tone: "critical" },
    { value: "Rp 850M", tone: "positive" },
    { value: "1 account", tone: "warning" },
  ],
  sales: [
    { value: "Rp 6.4B", tone: "positive" },
    { value: "3", tone: "neutral" },
    { value: "68%", delta: "+4% QoQ", tone: "positive" },
    { value: "1 queued", tone: "neutral" },
  ],
  project: [
    { value: "2", tone: "positive" },
    { value: "1", tone: "warning" },
    { value: "1", tone: "critical" },
    { value: "3", tone: "critical" },
  ],
  hr: [
    { value: "147", tone: "positive" },
    { value: "91%", tone: "positive" },
    { value: "1", tone: "warning" },
    { value: "0", tone: "positive" },
  ],
};

const FOCUS_CARDS: Record<PerspectiveId, PerspectiveConfig["focusCards"]> = {
  ceo: [
    {
      id: "ceo-pln",
      title: "PLN SCADA Phase II — board window open",
      description: "Rp 4.2B pipeline advancing. Commercial annex aligned — submission targeted 11 July.",
      metric: "Health 94",
      entityType: "company",
      entityId: "pln",
      tone: "opportunity",
    },
    {
      id: "ceo-hutama",
      title: "Segment 7 recovery needs steering decision",
      description: "11 days without milestone update. Rp 450M exposure if Q3 go-live slips.",
      metric: "At risk",
      entityType: "project",
      entityId: "segment-7",
      tone: "critical",
    },
  ],
  cfo: [
    {
      id: "cfo-inv",
      title: "Invoice INV-203 — Rp 127M due tomorrow",
      description: "PT Hutama Karya milestone 3. Payment confirmation required from Finance Director.",
      metric: "Due 7 Jul",
      entityType: "company",
      entityId: "hutama",
      tone: "critical",
    },
    {
      id: "cfo-mayora",
      title: "Mayora PO-8821 executed",
      description: "Rp 850M National Distribution Analytics Platform — revenue recognized on kickoff.",
      metric: "Rp 850M",
      entityType: "company",
      entityId: "mayora",
      tone: "opportunity",
    },
  ],
  sales: [
    {
      id: "sales-pln",
      title: "PLN SCADA Phase II — final commercial review",
      description: "Proposal Analyst queued: competitive analysis vs Siemens substation module bid.",
      metric: "Rp 4.2B",
      entityType: "company",
      entityId: "pln",
      tone: "opportunity",
    },
    {
      id: "sales-telkom",
      title: "Telkom Q3 renewal — executive review 14 Aug",
      description: "Rp 1.2B renewal scope confirmed. Relationship Analyst monitoring CIO engagement.",
      metric: "Rp 1.2B",
      entityType: "company",
      entityId: "telkom",
      tone: "health",
    },
  ],
  project: [
    {
      id: "proj-seg7",
      title: "Segment 7 — 3 deliverables blocked",
      description: "API gateway handover, UAT sign-off, operations runbook. No update in 11 days.",
      metric: "38% complete",
      entityType: "project",
      entityId: "segment-7",
      tone: "critical",
    },
    {
      id: "proj-pln",
      title: "PLN SCADA — technical design approved",
      description: "71% complete. Commercial terms under final review with procurement.",
      metric: "71% complete",
      entityType: "project",
      entityId: "pln-scada",
      tone: "opportunity",
    },
  ],
  hr: [
    {
      id: "hr-pln",
      title: "PLN — 14 stakeholders, strong engagement",
      description: "Budi Santoso primary champion. 6 meetings this quarter, NPS 8.7 from executive review.",
      metric: "NPS 8.7",
      entityType: "person",
      entityId: "budi",
      tone: "health",
    },
    {
      id: "hr-hutama",
      title: "Hutama Karya — relationship cooling",
      description: "Rina Wijaya last active 1 hour ago. Steering committee engagement dropped 40% in 2 weeks.",
      metric: "Watch",
      entityType: "person",
      entityId: "rina",
      tone: "risk",
    },
  ],
};

const ACTIVE_WORKERS: Record<PerspectiveId, string[]> = {
  ceo: ["proposal-analyst", "contract-reviewer", "relationship-analyst", "delivery-monitor"],
  cfo: ["contract-reviewer", "commercial-analyst"],
  sales: ["proposal-analyst", "relationship-analyst"],
  project: ["delivery-monitor"],
  hr: ["relationship-analyst"],
};

export function getLocalizedWorkers(messages: EnterpriseMessages): DigitalWorker[] {
  return WORKER_DEFS.map((def) => {
    const worker = messages.workforce.workers as Record<
      string,
      { name: string; specialty: string; description: string; workingTask?: string }
    >;
    const data = worker[def.id];
    return {
      id: def.id,
      name: data?.name ?? def.id,
      specialty: data?.specialty ?? "",
      description: data?.description ?? "",
      perspectives: def.perspectives,
      accent: def.accent,
    };
  });
}

export function getPerspectiveConfig(
  id: PerspectiveId,
  messages: EnterpriseMessages,
  workforceInsightReady: boolean,
): PerspectiveConfig {
  const p = (messages.workforce.perspectives as Record<
    string,
    { title: string; greeting: string; description: string }
  >)[id];
  const metrics = (messages.workforce.metrics as Record<string, string>);
  const metricKeys = METRIC_KEYS[id];
  const metricValues = METRIC_VALUES[id];

  const config: PerspectiveConfig = {
    id,
    label: translate(messages.enterprise, `perspective.${id}`),
    title: p?.title ?? id,
    greeting: p?.greeting ?? "",
    description: p?.description ?? "",
    metrics: metricKeys.map((key, i) => ({
      label: metrics[key] ?? key,
      value: metricValues[i]?.value ?? "",
      delta: metricValues[i]?.delta,
      tone: metricValues[i]?.tone,
    })),
    focusCards: FOCUS_CARDS[id],
    activeWorkers: ACTIVE_WORKERS[id],
  };

  if (id !== "ceo" || !workforceInsightReady) {
    return config;
  }

  const insight = buildWorkforceCeoInsight(messages);
  return {
    ...config,
    metrics: config.metrics.map((m) =>
      m.label === metrics.workforceInsights
        ? { ...m, value: "1", tone: "positive" as const }
        : m,
    ),
    focusCards: [
      {
        id: "ceo-workforce",
        title: insight.title,
        description: insight.description,
        metric: insight.metric,
        entityType: "company",
        entityId: "pln",
        tone: "opportunity",
      },
      ...config.focusCards,
    ],
  };
}

export function getWorkforceOutputs(messages: EnterpriseMessages) {
  return {
    memoryEntry: buildWorkforceMemoryEntry(messages),
    ceoInsight: buildWorkforceCeoInsight(messages),
    timelineEntry: buildWorkforceTimelineEntry(messages),
  };
}

export function getWorkerStatus(
  workerId: string,
  phase: string,
  activeWorkerId: string | null,
): "idle" | "working" | "completed" {
  if (phase === "idle") return "idle";
  if (phase === "complete" && workerId === "proposal-analyst") return "completed";
  if (workerId === activeWorkerId && (phase === "analyst_working" || phase === "memory_updated")) {
    return "working";
  }
  if (phase === "ceo_ready" || phase === "complete") {
    if (workerId === "proposal-analyst") return "completed";
  }
  return "idle";
}