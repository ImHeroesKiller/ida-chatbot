import { ACCOUNT_DIRECTORY } from "@ida/observation";
import type { ESLSnapshot } from "@ida/esl/persistence";
import type {
  BriefCard,
  Company,
  MemoryItem,
  Person,
  Project,
  SearchResult,
  TimelineEvent,
} from "@/components/enterprise/experience/types";

const ACCOUNT_PROFILES: Record<
  string,
  Omit<Company, "health" | "healthLabel" | "contacts" | "activeProjects" | "summary" | "revenue"> & {
    sector: string;
    baseHealth: number;
  }
> = {
  pln: { id: "pln", name: "PT PLN Indonesia Power", sector: "Energy & Power Generation", baseHealth: 94 },
  mayora: { id: "mayora", name: "PT Mayora Indah Tbk", sector: "FMCG & National Distribution", baseHealth: 89 },
  telkom: { id: "telkom", name: "PT Telkom Indonesia (Persero) Tbk", sector: "Telecommunications", baseHealth: 86 },
  hutama: { id: "hutama", name: "PT Hutama Karya (Persero)", sector: "Infrastructure & Construction", baseHealth: 68 },
};

function formatRp(amount?: number): string {
  if (!amount) return "—";
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp ${Math.round(amount / 1_000_000)}M`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function mapArtifactToMemoryTab(type: string): MemoryItem["tab"] {
  if (type === "Meeting") return "meetings";
  if (type === "Invoice" || type === "Purchase Order" || type === "Contract") return "commercial";
  if (type === "Proposal" || type === "Information") return "projects";
  return "communications";
}

// Reuse cached DateTimeFormat instances to avoid expensive Intl locale resolution per call
const shortDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export type RealityViewModel = {
  hasLiveData: boolean;
  lastSync: string | null;
  counts: { communications: number; artifacts: number; organizations: number };
  companies: Company[];
  people: Person[];
  projects: Project[];
  briefCards: BriefCard[];
  timeline: TimelineEvent[];
  memoryItems: MemoryItem[];
  searchIndex: SearchResult[];
};

export function buildRealityViewModel(snapshot: ESLSnapshot): RealityViewModel {
  const hasLiveData = snapshot.communications.length > 0;

  if (!hasLiveData) {
    return {
      hasLiveData: false,
      lastSync: null,
      counts: { communications: 0, artifacts: 0, organizations: 0 },
      companies: [],
      people: [],
      projects: [],
      briefCards: [],
      timeline: [],
      memoryItems: [],
      searchIndex: [],
    };
  }

  // Performance optimization: Pre-index snapshot entities into Map lookups to avoid O(N²) array scans
  const orgById = new Map(snapshot.organizations.map((o) => [o.id, o]));

  // Index organization IDs by account ID (supports multiple organizations per account)
  const orgIdsByAccountId = new Map<string, Set<string>>();
  for (const org of snapshot.organizations) {
    if (org.accountId) {
      const set = orgIdsByAccountId.get(org.accountId) ?? new Set();
      set.add(org.id);
      orgIdsByAccountId.set(org.accountId, set);
    }
  }

  const personById = new Map(snapshot.persons.map((p) => [p.id, p]));
  const commById = new Map(snapshot.communications.map((c) => [c.id, c]));

  // Artifact lookup by communication ID and company ID
  const artifactByCommId = new Map(snapshot.artifacts.map((a) => [a.communicationId, a]));
  const artifactsByCompanyId = new Map<string, (typeof snapshot.artifacts)[number][]>();
  for (const a of snapshot.artifacts) {
    if (a.companyId) {
      const existing = artifactsByCompanyId.get(a.companyId) ?? [];
      existing.push(a);
      artifactsByCompanyId.set(a.companyId, existing);
    }
  }

  // Communications grouped by organization ID
  const commsByOrgId = new Map<string, (typeof snapshot.communications)[number][]>();
  for (const c of snapshot.communications) {
    if (c.organizationId) {
      const existing = commsByOrgId.get(c.organizationId) ?? [];
      existing.push(c);
      commsByOrgId.set(c.organizationId, existing);
    }
  }

  // Communication counts by person ID
  const commCountByPersonId = new Map<string, number>();
  for (const c of snapshot.communications) {
    if (c.fromPersonId) {
      commCountByPersonId.set(c.fromPersonId, (commCountByPersonId.get(c.fromPersonId) ?? 0) + 1);
    }
  }

  // Persons grouped by account ID without duplicates
  const peopleByAccountId = new Map<string, (typeof snapshot.persons)[number][]>();
  for (const p of snapshot.persons) {
    const seenAccountIds = new Set<string>();
    for (const oid of p.organizationIds) {
      const org = orgById.get(oid);
      if (org?.accountId && !seenAccountIds.has(org.accountId)) {
        seenAccountIds.add(org.accountId);
        const existing = peopleByAccountId.get(org.accountId) ?? [];
        existing.push(p);
        peopleByAccountId.set(org.accountId, existing);
      }
    }
  }

  const companies: Company[] = ACCOUNT_DIRECTORY.map((account) => {
    const accountOrgIds = orgIdsByAccountId.get(account.id);
    const comms: (typeof snapshot.communications)[number][] = [];
    if (accountOrgIds) {
      for (const orgId of accountOrgIds) {
        const orgComms = commsByOrgId.get(orgId);
        if (orgComms) comms.push(...orgComms);
      }
    }

    const commIds = new Set(comms.map((c) => c.id));
    const artifacts = snapshot.artifacts.filter((a) => commIds.has(a.communicationId));
    const people = peopleByAccountId.get(account.id) ?? [];
    const pipeline = artifacts.reduce((sum, a) => sum + (a.amount ?? 0), 0);
    const highPriority = artifacts.filter((a) => a.priority === "high").length;

    return {
      id: account.id,
      name: account.name,
      sector: ACCOUNT_PROFILES[account.id]?.sector ?? "Enterprise",
      health: Math.max(50, (ACCOUNT_PROFILES[account.id]?.baseHealth ?? 80) - highPriority * 3),
      healthLabel: comms.length > 0 ? (highPriority > 0 ? "Watch" : "Active") : "No activity",
      revenue: pipeline > 0 ? `${formatRp(pipeline)} from imports` : "No commercial data yet",
      contacts: people.length,
      activeProjects: artifacts.filter((a) => a.type === "Proposal" || a.type === "Meeting").length,
      summary:
        comms.length > 0
          ? `${comms.length} imported record${comms.length > 1 ? "s" : ""} — ${artifacts.length} business signal${artifacts.length !== 1 ? "s" : ""} detected.`
          : "No imported activity yet for this account.",
    };
  }).filter((c) => {
    const firstOrg = snapshot.organizations.find((o) => o.accountId === c.id);
    const hasComms = firstOrg ? (commsByOrgId.get(firstOrg.id)?.length ?? 0) > 0 : false;
    const hasCompanyArtifacts = (artifactsByCompanyId.get(c.id)?.length ?? 0) > 0;
    return hasComms || hasCompanyArtifacts;
  });

  const people: Person[] = snapshot.persons.map((p) => {
    const org = snapshot.organizations.find((o) => p.organizationIds.includes(o.id));
    const accountId = org?.accountId ?? "ida";
    const commCount = commCountByPersonId.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.name ?? p.email.split("@")[0],
      role: org ? `Contact — ${org.name}` : "Stakeholder",
      companyId: accountId,
      email: p.email,
      engagements: commCount,
      lastActive: p.updatedAt,
      summary: `${commCount} imported communication${commCount !== 1 ? "s" : ""} indexed.`,
    };
  });

  const projects: Project[] = snapshot.artifacts
    .filter((a) => ["Proposal", "Meeting", "Contract", "Purchase Order"].includes(a.type))
    .map((a) => {
      const comm = commById.get(a.communicationId);
      const accountId = a.companyId ?? "unknown";
      return {
        id: a.id,
        name: comm?.subject ?? a.summary,
        companyId: accountId,
        ownerId: comm?.fromPersonId ?? snapshot.persons[0]?.id ?? "unknown",
        status: a.priority === "high" ? ("at-risk" as const) : ("on-track" as const),
        budget: formatRp(a.amount),
        progress: a.type === "Meeting" ? 55 : 40,
        summary: a.summary,
        updatedAt: shortDateTimeFormatter.format(new Date(comm?.timestamp ?? a.createdAt)),
      };
    });

  const briefCards: BriefCard[] = snapshot.artifacts
    .slice()
    .sort((a, b) => {
      const score = (x: typeof a) => (x.priority === "high" ? 2 : 1);
      return score(b) - score(a);
    })
    .slice(0, 10)
    .map((a, i) => {
      const comm = commById.get(a.communicationId);
      const accountId = a.companyId;
      const tone: BriefCard["tone"] =
        a.priority === "high"
          ? "critical"
          : a.type === "Purchase Order" || a.type === "Proposal"
            ? "opportunity"
            : a.type === "Meeting"
              ? "health"
              : "action";

      return {
        id: `live-brief-${i}`,
        tone,
        title: comm?.subject ?? a.summary,
        description: [
          a.summary,
          a.amount ? formatRp(a.amount) : null,
          a.deadline ? `Deadline: ${a.deadline}` : null,
          a.stakeholder ? `Stakeholder: ${a.stakeholder}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        entityType: accountId ? ("company" as const) : a.type === "Meeting" ? ("project" as const) : undefined,
        entityId: accountId ?? a.id,
        metric: a.priority === "high" ? "High priority" : a.type,
      };
    });

  const timeline: TimelineEvent[] = snapshot.communications
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((c) => {
      const artifact = artifactByCommId.get(c.id);
      const org = c.organizationId ? orgById.get(c.organizationId) : undefined;
      const typeMap: Record<string, TimelineEvent["type"]> = {
        Invoice: "commercial",
        Meeting: "meeting",
        Proposal: "project",
        "Purchase Order": "commercial",
        Contract: "commercial",
        Information: "communication",
      };
      return {
        id: c.id,
        date: shortDateTimeFormatter.format(new Date(c.timestamp)),
        title: c.subject,
        type: typeMap[artifact?.type ?? ""] ?? "communication",
        entityType: org?.accountId ? ("company" as const) : undefined,
        entityId: org?.accountId,
        summary: c.snippet.slice(0, 160),
      };
    });

  const memoryItems: MemoryItem[] = snapshot.communications.map((c) => {
    const artifact = artifactByCommId.get(c.id);
    const person = personById.get(c.fromPersonId);
    const org = c.organizationId ? orgById.get(c.organizationId) : undefined;
    return {
      id: c.id,
      tab: mapArtifactToMemoryTab(artifact?.type ?? "Information"),
      title: c.subject,
      subtitle: `${person?.name ?? person?.email ?? "Unknown"} · ${artifact?.type ?? "Import"}`,
      date: dateFormatter.format(new Date(c.timestamp)),
      entityType: org?.accountId ? ("company" as const) : undefined,
      entityId: org?.accountId,
    };
  });

  const searchIndex: SearchResult[] = [
    ...companies.map((c) => ({
      id: `s-${c.id}`,
      group: "Companies" as const,
      title: c.name,
      subtitle: `${c.sector} · ${c.contacts} contacts`,
      entityType: "company" as const,
      entityId: c.id,
    })),
    ...people.map((p) => ({
      id: `s-${p.id}`,
      group: "People" as const,
      title: p.name,
      subtitle: p.email,
      entityType: "person" as const,
      entityId: p.id,
    })),
    ...memoryItems.slice(0, 8).map((m) => ({
      id: `s-${m.id}`,
      group: "Memory" as const,
      title: m.title,
      subtitle: m.subtitle,
      entityType: "memory" as const,
      entityId: m.id,
    })),
  ];

  return {
    hasLiveData: true,
    lastSync: snapshot.lastSync,
    counts: {
      communications: snapshot.communications.length,
      artifacts: snapshot.artifacts.length,
      organizations: snapshot.organizations.length,
    },
    companies,
    people,
    projects,
    briefCards,
    timeline,
    memoryItems,
    searchIndex,
  };
}