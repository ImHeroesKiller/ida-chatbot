import { eslStore } from "@ida/esl/store";
import { knowledgeGraphBuilder } from "@ida/graph/builder";
import type { KnowledgeGraphSnapshot } from "@ida/graph/types";

export interface OrganizationActivityQuery {
  organization: string;
  windowDays?: number;
}

export interface AttentionItem {
  id: string;
  title: string;
  organization?: string;
  type: string;
  priority?: string;
  summary: string;
  timestamp: string;
}

export interface QueryEngineOverview {
  graph: KnowledgeGraphSnapshot;
  esl: ReturnType<typeof eslStore.getSnapshot>;
  attentionItems: AttentionItem[];
  organizationSummaries: Array<{
    organization: string;
    communications: number;
    artifacts: number;
    highPriority: number;
  }>;
}

export class QueryEngine {
  organizationActivity(query: OrganizationActivityQuery) {
    const orgName = query.organization.trim().toUpperCase();
    const windowDays = query.windowDays ?? 30;
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const snapshot = eslStore.getSnapshot();

    const organization = snapshot.organizations.find(
      (org) =>
        org.name.toUpperCase() === orgName ||
        org.name.toUpperCase().includes(orgName) ||
        orgName.includes(org.name.toUpperCase()) ||
        org.aliases.some(
          (alias) =>
            alias.toUpperCase() === orgName || alias.toUpperCase().includes(orgName),
        ),
    );

    if (!organization) {
      return {
        organization: query.organization,
        found: false,
        communications: [],
        artifacts: [],
        people: [],
      };
    }

    const communications = snapshot.communications.filter(
      (comm) =>
        comm.organizationId === organization.id &&
        new Date(comm.timestamp).getTime() >= cutoff,
    );

    const communicationIds = new Set(communications.map((c) => c.id));
    const artifacts = snapshot.artifacts.filter((artifact) =>
      communicationIds.has(artifact.communicationId),
    );

    const personIds = new Set(communications.map((c) => c.fromPersonId));
    const people = snapshot.persons.filter((person) =>
      personIds.has(person.id),
    );

    return {
      organization: organization.name,
      found: true,
      communications,
      artifacts,
      people,
      signals: {
        totalMessages: communications.length,
        invoiceCount: artifacts.filter((a) => a.type === "Invoice").length,
        meetingCount: artifacts.filter((a) => a.type === "Meeting").length,
        highPriority: artifacts.filter((a) => a.priority === "high").length,
      },
    };
  }

  attentionItems(limit = 5): AttentionItem[] {
    const snapshot = eslStore.getSnapshot();

    // Performance Optimization: Replace O(Artifacts * (Comms + Orgs)) array searches
    // with O(Comms + Orgs + Artifacts) Map lookups.
    const commMap = new Map(snapshot.communications.map((c) => [c.id, c]));
    const orgMap = new Map(snapshot.organizations.map((o) => [o.id, o]));

    return snapshot.artifacts
      .map((artifact) => {
        const communication = commMap.get(artifact.communicationId);
        const organization = artifact.organizationId
          ? orgMap.get(artifact.organizationId)
          : undefined;

        return {
          id: artifact.id,
          title: communication?.subject ?? artifact.summary,
          organization: organization?.name,
          type: artifact.type,
          priority: artifact.priority,
          summary: artifact.summary,
          timestamp: communication?.timestamp ?? artifact.createdAt,
        };
      })
      .sort((a, b) => {
        const priorityScore = (value?: string) =>
          value === "high" ? 3 : value === "medium" ? 2 : 1;
        const byPriority = priorityScore(b.priority) - priorityScore(a.priority);
        if (byPriority !== 0) return byPriority;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, limit);
  }

  overview(): QueryEngineOverview {
    const snapshot = eslStore.getSnapshot();
    const graph = knowledgeGraphBuilder.snapshot();

    // Performance Optimization: Replace O(Orgs * (Comms + Artifacts)) nested iterations
    // with single-pass O(Comms + Artifacts) Map indexing.
    const commOrgMap = new Map<string, string>(); // commId -> orgId
    const commCounts = new Map<string, number>(); // orgId -> commCount

    for (const comm of snapshot.communications) {
      if (comm.organizationId) {
        commOrgMap.set(comm.id, comm.organizationId);
        commCounts.set(
          comm.organizationId,
          (commCounts.get(comm.organizationId) ?? 0) + 1,
        );
      }
    }

    const artifactCounts = new Map<string, number>(); // orgId -> artifactCount
    const highPriorityCounts = new Map<string, number>(); // orgId -> highPriorityCount

    for (const artifact of snapshot.artifacts) {
      const orgId = commOrgMap.get(artifact.communicationId);
      if (orgId) {
        artifactCounts.set(orgId, (artifactCounts.get(orgId) ?? 0) + 1);
        if (artifact.priority === "high") {
          highPriorityCounts.set(
            orgId,
            (highPriorityCounts.get(orgId) ?? 0) + 1,
          );
        }
      }
    }

    const organizationSummaries = snapshot.organizations.map((org) => ({
      organization: org.name,
      communications: commCounts.get(org.id) ?? 0,
      artifacts: artifactCounts.get(org.id) ?? 0,
      highPriority: highPriorityCounts.get(org.id) ?? 0,
    }));

    return {
      graph,
      esl: snapshot,
      attentionItems: this.attentionItems(),
      organizationSummaries,
    };
  }

  queryText(text: string) {
    const normalized = text.toLowerCase();

    if (normalized.includes("pln") || normalized.includes("indonesia power")) {
      return this.organizationActivity({ organization: "PT PLN Indonesia Power" });
    }

    if (normalized.includes("mayora")) {
      return this.organizationActivity({ organization: "MAYORA" });
    }

    if (normalized.includes("attention") || normalized.includes("perhatian")) {
      return { type: "attention", items: this.attentionItems() };
    }

    return this.overview();
  }
}

export const queryEngine = new QueryEngine();