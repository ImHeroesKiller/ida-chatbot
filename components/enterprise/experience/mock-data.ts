import type {
  BriefCard,
  Company,
  MemoryItem,
  Person,
  Project,
  SearchResult,
  TimelineEvent,
} from "./types";

export const COMPANIES: Company[] = [
  {
    id: "pln",
    name: "PT PLN Indonesia Power",
    sector: "Energy & Power Generation",
    health: 94,
    healthLabel: "Strong",
    revenue: "Rp 4.2B active pipeline",
    contacts: 14,
    activeProjects: 2,
    summary:
      "SCADA Modernization Phase II under final commercial review. 23 threaded communications with procurement and engineering in the past 7 days.",
  },
  {
    id: "mayora",
    name: "PT Mayora Indah Tbk",
    sector: "FMCG & National Distribution",
    health: 89,
    healthLabel: "Growing",
    revenue: "Rp 850M PO-8821 issued",
    contacts: 9,
    activeProjects: 1,
    summary:
      "Purchase order PO-8821 signed for National Distribution Analytics Platform. Kickoff scheduled with supply chain leadership.",
  },
  {
    id: "telkom",
    name: "PT Telkom Indonesia (Persero) Tbk",
    sector: "Telecommunications & Enterprise IT",
    health: 86,
    healthLabel: "Stable",
    revenue: "Rp 1.2B renewal scope",
    contacts: 7,
    activeProjects: 1,
    summary:
      "Q3 Enterprise Network Audit renewal in negotiation. Executive review aligned for 14 August with CIO office.",
  },
  {
    id: "hutama",
    name: "PT Hutama Karya (Persero)",
    sector: "Infrastructure & Construction",
    health: 68,
    healthLabel: "At Risk",
    revenue: "Rp 127M outstanding",
    contacts: 5,
    activeProjects: 1,
    summary:
      "Invoice INV-203 (Rp 127M) due 7 July. Segment 7 integration deliverables blocked pending steering committee decision.",
  },
];

export const PEOPLE: Person[] = [
  {
    id: "ary",
    name: "Ary Wibowo",
    role: "Founder & CEO",
    companyId: "ida",
    email: "ary@ida.id",
    engagements: 52,
    lastActive: "2 min ago",
    summary:
      "Executive sponsor for PLN Indonesia Power and Mayora accounts. Escalation owner for Hutama Karya Segment 7 recovery.",
  },
  {
    id: "budi",
    name: "Budi Santoso",
    role: "VP Strategic Accounts",
    companyId: "pln",
    email: "budi.santoso@pln.co.id",
    engagements: 23,
    lastActive: "6 min ago",
    summary:
      "Primary relationship owner for PT PLN Indonesia Power. Leading SCADA Phase II commercial and technical alignment.",
  },
  {
    id: "rina",
    name: "Rina Wijaya",
    role: "Director of Finance",
    companyId: "hutama",
    email: "rina.wijaya@hutamakarya.com",
    engagements: 11,
    lastActive: "1 hour ago",
    summary:
      "Commercial counterparty for INV-203 and milestone billing on Toll Road Segment 7 integration.",
  },
  {
    id: "david",
    name: "David Chen",
    role: "Senior Program Director",
    companyId: "ida",
    email: "david.chen@ida.id",
    engagements: 19,
    lastActive: "Yesterday",
    summary:
      "Delivery lead for Segment 7 Systems Integration. Accountable for milestone recovery and stakeholder reporting.",
  },
  {
    id: "siti",
    name: "Siti Rahmawati",
    role: "Head of Enterprise Procurement",
    companyId: "mayora",
    email: "siti.rahmawati@mayora.com",
    engagements: 14,
    lastActive: "3 hours ago",
    summary:
      "Issued PO-8821 and coordinates vendor onboarding for distribution analytics rollout.",
  },
  {
    id: "agung",
    name: "Agung Prasetyo",
    role: "CIO — Enterprise Division",
    companyId: "telkom",
    email: "agung.prasetyo@telkom.co.id",
    engagements: 9,
    lastActive: "Today",
    summary:
      "Executive sponsor for Q3 network audit renewal and annual enterprise architecture review.",
  },
];

export const PROJECTS: Project[] = [
  {
    id: "segment-7",
    name: "Toll Road Segment 7 — Systems Integration",
    companyId: "hutama",
    ownerId: "david",
    status: "stalled",
    budget: "Rp 450M",
    progress: 38,
    summary:
      "No milestone update for 11 days. Three deliverables blocked: API gateway handover, UAT sign-off, and operations runbook.",
    updatedAt: "11 days ago",
  },
  {
    id: "pln-scada",
    name: "SCADA Modernization Phase II",
    companyId: "pln",
    ownerId: "budi",
    status: "on-track",
    budget: "Rp 4.2B",
    progress: 71,
    summary:
      "Technical design approved. Commercial terms under final review with procurement — board submission targeted 11 July.",
    updatedAt: "Today",
  },
  {
    id: "mayora-analytics",
    name: "National Distribution Analytics Platform",
    companyId: "mayora",
    ownerId: "siti",
    status: "on-track",
    budget: "Rp 850M",
    progress: 58,
    summary:
      "PO-8821 executed. Data integration workshop completed; warehouse schema mapping in progress with supply chain team.",
    updatedAt: "Yesterday",
  },
  {
    id: "telkom-audit",
    name: "Enterprise Network Audit — Q3 Renewal",
    companyId: "telkom",
    ownerId: "agung",
    status: "at-risk",
    budget: "Rp 1.2B",
    progress: 52,
    summary:
      "Renewal scope confirmed but delivery window overlaps PLN steering committee — resource conflict flagged.",
    updatedAt: "2 days ago",
  },
];

export const BRIEF_CARDS: BriefCard[] = [
  {
    id: "c1",
    tone: "critical",
    title: "Segment 7 integration stalled — 11 days without milestone update",
    description:
      "PT Hutama Karya steering committee has not assigned decision owner. UAT sign-off and API gateway handover blocked.",
    entityType: "project",
    entityId: "segment-7",
    metric: "Rp 450M exposure",
  },
  {
    id: "c2",
    tone: "critical",
    title: "Invoice INV-203 due 7 July 2026",
    description:
      "PT Hutama Karya — Rp 127M for Segment 7 milestone 3. Payment confirmation required from Finance Director.",
    entityType: "company",
    entityId: "hutama",
    metric: "Due in 24h",
  },
  {
    id: "o1",
    tone: "opportunity",
    title: "PLN Indonesia Power SCADA Phase II advancing",
    description:
      "Commercial thread volume up 41% this week. Procurement aligned on technical annex — board submission window open.",
    entityType: "company",
    entityId: "pln",
    metric: "Health 94",
  },
  {
    id: "o2",
    tone: "opportunity",
    title: "Mayora PO-8821 executed — Rp 850M",
    description:
      "National Distribution Analytics Platform approved. Fast-track kickoff recommended before Q3 planning cycle.",
    entityType: "company",
    entityId: "mayora",
    metric: "Rp 850M",
  },
  {
    id: "h1",
    tone: "health",
    title: "PT PLN Indonesia Power — relationship health strong",
    description:
      "14 active stakeholders, 6 meetings this quarter, renewal trajectory positive. NPS 8.7 from last executive review.",
    entityType: "company",
    entityId: "pln",
    metric: "94%",
  },
  {
    id: "h2",
    tone: "health",
    title: "Organization intelligence score",
    description:
      "147 indexed relationships, 31 knowledge updates today across communications, decisions, and commercial records.",
    metric: "91%",
  },
  {
    id: "r1",
    tone: "risk",
    title: "Hutama Karya payment delay may cascade to Segment 7",
    description:
      "Outstanding INV-203 could delay subcontractor mobilization and push Q3 go-live past committed window.",
    entityType: "company",
    entityId: "hutama",
  },
  {
    id: "r2",
    tone: "risk",
    title: "Q3 delivery capacity conflict — Telkom vs PLN",
    description:
      "Enterprise Network Audit renewal overlaps PLN steering committee week of 14 July. Shared delivery lead flagged.",
    entityType: "company",
    entityId: "telkom",
  },
  {
    id: "a1",
    tone: "action",
    title: "Confirm SCADA Phase II board submission with Budi Santoso",
    description:
      "Lock commercial annex and executive summary before PLN Indonesia Power board review on 11 July.",
    entityType: "person",
    entityId: "budi",
  },
  {
    id: "a2",
    tone: "action",
    title: "Assign recovery owner for Segment 7 deliverables",
    description:
      "Publish 14-day recovery plan to Hutama Karya steering committee and unblock UAT sign-off.",
    entityType: "project",
    entityId: "segment-7",
  },
];

export const TIMELINE: TimelineEvent[] = [
  {
    id: "t1",
    date: "6 Jul, 10:24 WIB",
    title: "RE: SCADA Phase II — Commercial Annex v4",
    type: "communication",
    entityType: "company",
    entityId: "pln",
    summary:
      "23 messages with Budi Santoso and PLN procurement on pricing schedule and SLA appendix.",
  },
  {
    id: "t2",
    date: "6 Jul, 09:00 WIB",
    title: "Steering Committee — Segment 7 Recovery",
    type: "meeting",
    entityType: "project",
    entityId: "segment-7",
    summary:
      "Executive sync on blocked deliverables. Decision owner not yet assigned; recovery plan requested.",
  },
  {
    id: "t3",
    date: "5 Jul, 16:45 WIB",
    title: "PO-8821 executed — Mayora Indah",
    type: "commercial",
    entityType: "company",
    entityId: "mayora",
    summary:
      "Rp 850M purchase order for National Distribution Analytics Platform signed by Head of Procurement.",
  },
  {
    id: "t4",
    date: "5 Jul, 11:30 WIB",
    title: "Telkom Q3 audit scope approved",
    type: "decision",
    entityType: "company",
    entityId: "telkom",
    summary:
      "CIO office confirmed renewal scope for Enterprise Network Audit — delivery window 14–28 August.",
  },
  {
    id: "t5",
    date: "4 Jul, 14:00 WIB",
    title: "Invoice INV-203 issued",
    type: "commercial",
    entityType: "company",
    entityId: "hutama",
    summary:
      "Rp 127M milestone billing for Toll Road Segment 7 — payment terms Net-14, due 7 July 2026.",
  },
  {
    id: "t6",
    date: "3 Jul, 13:00 WIB",
    title: "PLN Indonesia Power — Technical Design Review",
    type: "meeting",
    entityType: "company",
    entityId: "pln",
    summary:
      "Architecture review for SCADA integration completed. 4 action items logged; 3 already resolved.",
  },
];

export const MEMORY_ITEMS: MemoryItem[] = [
  {
    id: "m1",
    tab: "communications",
    title: "RE: SCADA Phase II — Commercial Annex v4",
    subtitle: "Budi Santoso • 23 messages • PLN Indonesia Power",
    date: "6 Jul 2026",
    entityType: "company",
    entityId: "pln",
  },
  {
    id: "m2",
    tab: "communications",
    title: "URGENT: Segment 7 milestone recovery",
    subtitle: "David Chen • Internal escalation • 8 recipients",
    date: "6 Jul 2026",
    entityType: "project",
    entityId: "segment-7",
  },
  {
    id: "m3",
    tab: "communications",
    title: "PO-8821 onboarding — data integration",
    subtitle: "Siti Rahmawati • Mayora supply chain",
    date: "5 Jul 2026",
    entityType: "company",
    entityId: "mayora",
  },
  {
    id: "m4",
    tab: "meetings",
    title: "Telkom Enterprise Review — Q3 Planning",
    subtitle: "Agung Prasetyo • 6 attendees • 14 Aug 2026",
    date: "Scheduled",
    entityType: "company",
    entityId: "telkom",
  },
  {
    id: "m5",
    tab: "meetings",
    title: "PLN Technical Design Review — recap",
    subtitle: "Notes captured • 4 action items • 3 resolved",
    date: "3 Jul 2026",
    entityType: "company",
    entityId: "pln",
  },
  {
    id: "m6",
    tab: "projects",
    title: "SCADA Modernization Phase II",
    subtitle: "71% complete • On track • Rp 4.2B",
    date: "6 Jul 2026",
    entityType: "project",
    entityId: "pln-scada",
  },
  {
    id: "m7",
    tab: "projects",
    title: "Segment 7 Systems Integration — recovery",
    subtitle: "38% complete • Stalled • Decision pending",
    date: "11 days idle",
    entityType: "project",
    entityId: "segment-7",
  },
  {
    id: "m8",
    tab: "commercial",
    title: "Invoice INV-203",
    subtitle: "PT Hutama Karya • Rp 127M • Due 7 Jul",
    date: "Due tomorrow",
    entityType: "company",
    entityId: "hutama",
  },
  {
    id: "m9",
    tab: "commercial",
    title: "PO-8821 — National Distribution Analytics",
    subtitle: "PT Mayora Indah • Rp 850M • Executed",
    date: "5 Jul 2026",
    entityType: "company",
    entityId: "mayora",
  },
  {
    id: "m10",
    tab: "decisions",
    title: "Telkom Q3 audit scope approved",
    subtitle: "Executive decision logged • CIO office",
    date: "5 Jul 2026",
    entityType: "company",
    entityId: "telkom",
  },
  {
    id: "m11",
    tab: "decisions",
    title: "Segment 7 escalation — owner assignment",
    subtitle: "Pending steering committee resolution",
    date: "6 Jul 2026",
    entityType: "project",
    entityId: "segment-7",
  },
  {
    id: "m12",
    tab: "notes",
    title: "PLN Indonesia Power — account strategy",
    subtitle: "Expand from SCADA pilot to enterprise-wide operations intelligence",
    date: "This week",
    entityType: "company",
    entityId: "pln",
  },
  {
    id: "m13",
    tab: "notes",
    title: "Q3 capacity planning",
    subtitle: "Delivery overlap between Telkom audit and PLN steering committee",
    date: "6 Jul 2026",
    entityType: "company",
    entityId: "telkom",
  },
];

export const SEARCH_INDEX: SearchResult[] = [
  ...COMPANIES.map((c) => ({
    id: `s-${c.id}`,
    group: "Companies" as const,
    title: c.name,
    subtitle: `${c.sector} • Health ${c.health}%`,
    entityType: "company" as const,
    entityId: c.id,
  })),
  ...PEOPLE.map((p) => ({
    id: `s-${p.id}`,
    group: "People" as const,
    title: p.name,
    subtitle: `${p.role} • ${p.email}`,
    entityType: "person" as const,
    entityId: p.id,
  })),
  ...PROJECTS.map((p) => ({
    id: `s-${p.id}`,
    group: "Projects" as const,
    title: p.name,
    subtitle: `${p.status} • ${p.budget}`,
    entityType: "project" as const,
    entityId: p.id,
  })),
  ...MEMORY_ITEMS.slice(0, 8).map((m) => ({
    id: `s-${m.id}`,
    group: "Memory" as const,
    title: m.title,
    subtitle: m.subtitle,
    entityType: "memory" as const,
    entityId: m.id,
  })),
  {
    id: "s-dec-1",
    group: "Decisions",
    title: "Telkom Q3 audit scope approved",
    subtitle: "Executive decision • 5 Jul 2026",
    entityType: "memory",
    entityId: "m10",
  },
  {
    id: "s-dec-2",
    group: "Decisions",
    title: "Segment 7 escalation — owner assignment",
    subtitle: "Pending • Steering committee",
    entityType: "memory",
    entityId: "m11",
  },
];

export function getCompany(id: string) {
  return COMPANIES.find((c) => c.id === id);
}

export function getPerson(id: string) {
  return PEOPLE.find((p) => p.id === id);
}

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id);
}