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
        org.aliases.some((alias) => alias.toUpperCase() === orgName),
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

    return snapshot.artifacts
      .map((artifact) => {
        const communication = snapshot.communications.find(
          (c) => c.id === artifact.communicationId,
        );
        const organization = artifact.organizationId
          ? snapshot.organizations.find((o) => o.id === artifact.organizationId)
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

    const organizationSummaries = snapshot.organizations.map((org) => {
      const communications = snapshot.communications.filter(
        (c) => c.organizationId === org.id,
      );
      const communicationIds = new Set(communications.map((c) => c.id));
      const artifacts = snapshot.artifacts.filter((a) =>
        communicationIds.has(a.communicationId),
      );

      return {
        organization: org.name,
        communications: communications.length,
        artifacts: artifacts.length,
        highPriority: artifacts.filter((a) => a.priority === "high").length,
      };
    });

    return {
      graph,
      esl: snapshot,
      attentionItems: this.attentionItems(),
      organizationSummaries,
    };
  }

  queryText(text: string) {
    const normalized = text.toLowerCase();

    if (normalized.includes("pln")) {
      return this.organizationActivity({ organization: "PLN" });
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