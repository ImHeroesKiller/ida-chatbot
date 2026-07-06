import type {
  MetricItem,
  OrganizationNode,
  PriorityItem,
  QuickAction,
} from "@/components/enterprise/types";

export const DEFAULT_NODE: OrganizationNode = {
  id: "ary",
  name: "Ary Wibowo",
  role: "Founder & CEO",
  health: "High Engagement",
  comm: 23,
  meetings: 7,
  invoices: 2,
  projects: 5,
};

export const ORGANIZATION_OVERVIEW: OrganizationNode = {
  id: "overview",
  name: "Organization Overview",
  role: "Healthy",
  health: "82",
  comm: 47,
  meetings: 12,
  invoices: 8,
  projects: 5,
};

export const PRIORITY_ITEMS: PriorityItem[] = [
  {
    id: "pln",
    title: "Communication with PLN",
    subtitle: "+35% last 24 hours",
    detail: "18 new messages",
    meta: "Last message: 8 minutes ago",
    badge: "HIGH",
    tone: "emerald",
    icon: "users",
  },
  {
    id: "invoice",
    title: "Invoice #INV-203",
    subtitle: "Rp 1.2M",
    detail: "From: PT ABC Construction",
    badge: "DUE TOMORROW",
    tone: "amber",
    icon: "briefcase",
  },
  {
    id: "alpha",
    title: "Project Alpha",
    subtitle: "No update for 9 days",
    detail: "Budget Rp 45M • 3 deliverables pending",
    badge: "STALLED",
    tone: "red",
    icon: "alert",
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "ask",
    title: "Ask IDA",
    description: "Context-aware answers",
  },
  {
    id: "upload",
    title: "Upload Document",
    description: "Add to Memory",
  },
];

export const METRICS: MetricItem[] = [
  { id: "connections", value: "128", label: "Active Connections", tone: "emerald" },
  { id: "updates", value: "24", label: "Updates Today", tone: "emerald" },
  { id: "risk", value: "5", label: "At Risk Items", tone: "amber" },
  { id: "health", value: "92%", label: "Organization Health Score", tone: "emerald" },
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
    name: "PLN",
    role: "Customer Health",
    health: "92",
    comm: 12,
    meetings: 4,
    invoices: 3,
    projects: 2,
    position: "left-top",
    accent: "border-blue-400 text-blue-600",
  },
  {
    id: "alpha",
    name: "Project Alpha",
    role: "At Risk",
    health: "Stalled",
    comm: 8,
    meetings: 3,
    invoices: 1,
    projects: 1,
    position: "right-top",
    accent: "border-amber-400 text-amber-600",
  },
  {
    id: "finance",
    name: "Finance",
    role: "On Track",
    health: "87",
    comm: 15,
    meetings: 5,
    invoices: 12,
    projects: 3,
    position: "bottom",
    accent: "border-emerald-400 text-emerald-600",
  },
  {
    id: "operations",
    name: "Operations",
    role: "Active",
    health: "Stable",
    comm: 10,
    meetings: 6,
    invoices: 4,
    projects: 2,
    position: "left-mid",
    accent: "border-violet-400 text-violet-600",
    compact: true,
  },
  {
    id: "sales",
    name: "Sales",
    role: "Growing",
    health: "88",
    comm: 14,
    meetings: 8,
    invoices: 5,
    projects: 4,
    position: "right-mid",
    accent: "border-pink-400 text-pink-600",
    compact: true,
  },
  {
    id: "legal",
    name: "Legal",
    role: "Monitoring",
    health: "Clear",
    comm: 6,
    meetings: 2,
    invoices: 1,
    projects: 1,
    position: "bottom-left",
    accent: "border-muted-foreground/40 text-muted-foreground",
    compact: true,
  },
];