import type {
  MetricItem,
  OrganizationNode,
  PriorityItem,
  QuickAction,
} from "@/components/enterprise/types";

export const DEFAULT_NODE: OrganizationNode = {
  id: "ary",
  name: "Ary Wibowo",
  role: "Executive Leadership",
  health: "High Engagement",
  comm: 28,
  meetings: 9,
  invoices: 3,
  projects: 6,
};

export const ORGANIZATION_OVERVIEW: OrganizationNode = {
  id: "overview",
  name: "Organization Overview",
  role: "91% Health",
  health: "91",
  comm: 52,
  meetings: 14,
  invoices: 9,
  projects: 6,
};

export const PRIORITY_ITEMS: PriorityItem[] = [
  {
    id: "pln",
    title: "PT PLN Indonesia Power",
    subtitle: "+41% communication volume this week",
    detail: "23 active threads on SCADA Phase II",
    meta: "Last message: 6 minutes ago",
    badge: "HIGH",
    tone: "emerald",
    icon: "users",
  },
  {
    id: "invoice",
    title: "Invoice INV-203",
    subtitle: "Rp 127M",
    detail: "From: PT Hutama Karya (Persero)",
    badge: "DUE 7 JUL",
    tone: "amber",
    icon: "briefcase",
  },
  {
    id: "segment-7",
    title: "Segment 7 Integration",
    subtitle: "No update for 11 days",
    detail: "Budget Rp 450M • 3 deliverables blocked",
    badge: "STALLED",
    tone: "red",
    icon: "alert",
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "ask",
    title: "Query Knowledge",
    description: "Context-aware organizational answers",
  },
  {
    id: "upload",
    title: "Capture to Memory",
    description: "Add communications, decisions, or records",
  },
];

export const METRICS: MetricItem[] = [
  { id: "connections", value: "147", label: "Indexed Relationships", tone: "emerald" },
  { id: "updates", value: "31", label: "Knowledge Updates Today", tone: "emerald" },
  { id: "risk", value: "4", label: "Items Requiring Attention", tone: "amber" },
  { id: "health", value: "91%", label: "Organization Intelligence Score", tone: "emerald" },
];

export const MAP_NODES: Array<
  OrganizationNode & {
    position: string;
    accent: string;
    compact?: boolean;
  }
> = [
  {
    ...DEFAULT_NODE,
    position: "center",
    accent: "border-primary text-primary shadow-lg",
  },
  {
    id: "pln",
    name: "PLN Indonesia Power",
    role: "Customer • 94% Health",
    health: "94",
    comm: 23,
    meetings: 6,
    invoices: 2,
    projects: 2,
    position: "left-top",
    accent: "border-blue-400 text-blue-600",
  },
  {
    id: "segment-7",
    name: "Segment 7 Integration",
    role: "At Risk • Stalled",
    health: "38%",
    comm: 9,
    meetings: 4,
    invoices: 1,
    projects: 1,
    position: "right-top",
    accent: "border-amber-400 text-amber-600",
  },
  {
    id: "finance",
    name: "Finance",
    role: "Commercial Records",
    health: "88",
    comm: 18,
    meetings: 5,
    invoices: 14,
    projects: 2,
    position: "bottom",
    accent: "border-emerald-400 text-emerald-600",
  },
  {
    id: "mayora",
    name: "Mayora Indah",
    role: "Growing • PO-8821",
    health: "89",
    comm: 12,
    meetings: 3,
    invoices: 4,
    projects: 1,
    position: "left-mid",
    accent: "border-violet-400 text-violet-600",
    compact: true,
  },
  {
    id: "telkom",
    name: "Telkom Enterprise",
    role: "Renewal Q3",
    health: "86",
    comm: 11,
    meetings: 5,
    invoices: 3,
    projects: 1,
    position: "right-mid",
    accent: "border-pink-400 text-pink-600",
    compact: true,
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    role: "Monitoring",
    health: "Clear",
    comm: 7,
    meetings: 2,
    invoices: 1,
    projects: 1,
    position: "bottom-left",
    accent: "border-muted-foreground/40 text-muted-foreground",
    compact: true,
  },
];