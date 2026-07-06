import type {
  BriefCard,
  DigitalWorker,
  MemoryItem,
  PerspectiveConfig,
  PerspectiveId,
} from "./types";

export const WORKFORCE_SLOGAN =
  "Your Organization. Your Digital Workforce. One Intelligence.";

export const DIGITAL_WORKERS: DigitalWorker[] = [
  {
    id: "proposal-analyst",
    name: "Proposal Analyst",
    specialty: "Commercial proposals & competitive positioning",
    description:
      "Reads proposals, RFPs, and bid documents — surfaces opportunities, gaps, and competitive risks into Organization Memory.",
    perspectives: ["sales", "ceo"],
    accent: "from-violet-500/20 to-violet-600/5 text-violet-700",
  },
  {
    id: "contract-reviewer",
    name: "Contract Reviewer",
    specialty: "Terms, liability & commercial clauses",
    description:
      "Reviews contracts and MSAs — flags payment terms, liability exposure, and renewal clauses for finance and legal.",
    perspectives: ["cfo", "ceo"],
    accent: "from-blue-500/20 to-blue-600/5 text-blue-700",
  },
  {
    id: "relationship-analyst",
    name: "Relationship Analyst",
    specialty: "Stakeholder health & engagement",
    description:
      "Monitors communication patterns across accounts — detects relationship drift, champion changes, and engagement drops.",
    perspectives: ["hr", "sales", "ceo"],
    accent: "from-emerald-500/20 to-emerald-600/5 text-emerald-700",
  },
  {
    id: "delivery-monitor",
    name: "Delivery Monitor",
    specialty: "Milestones, blockers & delivery risk",
    description:
      "Tracks initiative progress against commitments — escalates stalled milestones and resource conflicts to program leads.",
    perspectives: ["project", "ceo"],
    accent: "from-amber-500/20 to-amber-600/5 text-amber-700",
  },
  {
    id: "commercial-analyst",
    name: "Commercial Analyst",
    specialty: "Invoices, payments & revenue risk",
    description:
      "Watches commercial records — predicts payment delays, flags outstanding invoices, and models cash-flow exposure.",
    perspectives: ["cfo"],
    accent: "from-rose-500/20 to-rose-600/5 text-rose-700",
  },
];

export const WORKFORCE_MEMORY_ENTRY: MemoryItem = {
  id: "wf-pln-analysis",
  tab: "decisions",
  title: "Proposal Analysis — PLN SCADA Phase II",
  subtitle:
    "Digital Workforce · Proposal Analyst · Siemens bid 12% lower on substation module — value-engineering response recommended",
  date: "Just now",
  entityType: "company",
  entityId: "pln",
  workforce: true,
};

export const WORKFORCE_CEO_INSIGHT: BriefCard = {
  id: "wf-ceo-insight",
  tone: "opportunity",
  title: "Digital Workforce insight — PLN competitive positioning",
  description:
    "Proposal Analyst flagged Siemens 12% lower on substation module. Recommend value-engineering response before 11 July board submission — protects Rp 4.2B pipeline.",
  entityType: "company",
  entityId: "pln",
  metric: "Rp 4.2B",
  workforce: true,
};

export const WORKFORCE_TIMELINE_ENTRY = {
  id: "wf-timeline-pln",
  date: "Just now",
  title: "Proposal Analyst completed PLN SCADA competitive analysis",
  type: "decision" as const,
  entityType: "company" as const,
  entityId: "pln",
  summary:
    "Digital Workforce output indexed to Organization Memory. CEO Executive Brief updated with competitive positioning insight.",
};

export const DEMO_STEPS = [
  { id: 1, label: "Sales perspective", detail: "Proposal Analyst receives PLN SCADA proposal" },
  { id: 2, label: "Digital Workforce works", detail: "Analyzes competitive positioning vs Siemens bid" },
  { id: 3, label: "Organization Memory", detail: "Result indexed — same memory humans and agents share" },
  { id: 4, label: "CEO perspective", detail: "New strategic insight appears on Executive Brief" },
] as const;

const BASE_PERSPECTIVES: Record<PerspectiveId, PerspectiveConfig> = {
  ceo: {
    id: "ceo",
    label: "CEO",
    title: "Executive Command",
    greeting: "Good morning, Ary",
    description:
      "Strategic view across accounts, initiatives, and Digital Workforce insights — one intelligence for every decision.",
    metrics: [
      { label: "Active accounts", value: "4", delta: "+1 this quarter", tone: "positive" },
      { label: "Pipeline", value: "Rp 6.4B", tone: "positive" },
      { label: "Critical items", value: "2", tone: "critical" },
      { label: "Workforce insights", value: "0", tone: "neutral" },
    ],
    focusCards: [
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
    activeWorkers: ["proposal-analyst", "contract-reviewer", "relationship-analyst", "delivery-monitor"],
  },
  cfo: {
    id: "cfo",
    label: "CFO",
    title: "Commercial Control",
    greeting: "Good morning, Finance",
    description:
      "Revenue pipeline, outstanding invoices, and payment risk — with Commercial Analyst watching every record.",
    metrics: [
      { label: "Pipeline value", value: "Rp 6.4B", tone: "positive" },
      { label: "Outstanding", value: "Rp 127M", delta: "INV-203 due 7 Jul", tone: "critical" },
      { label: "PO executed", value: "Rp 850M", tone: "positive" },
      { label: "Payment risk", value: "1 account", tone: "warning" },
    ],
    focusCards: [
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
    activeWorkers: ["contract-reviewer", "commercial-analyst"],
  },
  sales: {
    id: "sales",
    label: "Sales",
    title: "Pipeline Intelligence",
    greeting: "Good morning, Sales",
    description:
      "Active proposals, account momentum, and competitive signals — Proposal Analyst works alongside your team.",
    metrics: [
      { label: "Active pipeline", value: "Rp 6.4B", tone: "positive" },
      { label: "Proposals in review", value: "3", tone: "neutral" },
      { label: "Win rate", value: "68%", delta: "+4% QoQ", tone: "positive" },
      { label: "Workforce tasks", value: "1 queued", tone: "neutral" },
    ],
    focusCards: [
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
    activeWorkers: ["proposal-analyst", "relationship-analyst"],
  },
  project: {
    id: "project",
    label: "Project",
    title: "Delivery Command",
    greeting: "Good morning, Programs",
    description:
      "Initiative health, milestone tracking, and blocker escalation — Delivery Monitor keeps programs on track.",
    metrics: [
      { label: "On track", value: "2", tone: "positive" },
      { label: "At risk", value: "1", tone: "warning" },
      { label: "Stalled", value: "1", tone: "critical" },
      { label: "Blocked deliverables", value: "3", tone: "critical" },
    ],
    focusCards: [
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
    activeWorkers: ["delivery-monitor"],
  },
  hr: {
    id: "hr",
    label: "HR",
    title: "People Intelligence",
    greeting: "Good morning, People Ops",
    description:
      "Stakeholder engagement, relationship health, and organizational connectivity — Relationship Analyst surfaces drift early.",
    metrics: [
      { label: "Active stakeholders", value: "147", tone: "positive" },
      { label: "Engagement score", value: "91%", tone: "positive" },
      { label: "At-risk relationships", value: "1", tone: "warning" },
      { label: "Champion changes", value: "0", tone: "positive" },
    ],
    focusCards: [
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
    activeWorkers: ["relationship-analyst"],
  },
};

export function getPerspectiveConfig(
  id: PerspectiveId,
  workforceInsightReady: boolean,
): PerspectiveConfig {
  const base = BASE_PERSPECTIVES[id];
  if (id !== "ceo" || !workforceInsightReady) return base;

  return {
    ...base,
    metrics: base.metrics.map((m) =>
      m.label === "Workforce insights" ? { ...m, value: "1", tone: "positive" as const } : m,
    ),
    focusCards: [
      {
        id: "ceo-workforce",
        title: WORKFORCE_CEO_INSIGHT.title,
        description: WORKFORCE_CEO_INSIGHT.description,
        metric: WORKFORCE_CEO_INSIGHT.metric,
        entityType: "company",
        entityId: "pln",
        tone: "opportunity",
      },
      ...base.focusCards,
    ],
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