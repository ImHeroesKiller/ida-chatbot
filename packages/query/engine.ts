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

    // Single-pass signal counting over artifacts instead of multiple .filter() calls
    let invoiceCount = 0;
    let meetingCount = 0;
    let highPriority = 0;
    for (const a of artifacts) {
      if (a.type === "Invoice") invoiceCount++;
      if (a.type === "Meeting") meetingCount++;
      if (a.priority === "high") highPriority++;
    }

    return {
      organization: organization.name,
      found: true,
      communications,
      artifacts,
      people,
      signals: {
        totalMessages: communications.length,
        invoiceCount,
        meetingCount,
        highPriority,
      },
    };
  }

  attentionItems(limit = 5): AttentionItem[] {
    const snapshot = eslStore.getSnapshot();

    // Map lookups for O(1) comm/org retrieval instead of O(N) array search per artifact
    const commMap = new Map(snapshot.communications.map((c) => [c.id, c]));
    const orgMap = new Map(snapshot.organizations.map((o) => [o.id, o]));

    return snapshot.artifacts
      .map((artifact) => {
        const communication = commMap.get(artifact.communicationId);
        const organization = artifact.organizationId
          ? orgMap.get(artifact.organizationId)
          : undefined;
        const timestamp = communication?.timestamp ?? artifact.createdAt;
        const priorityScore =
          artifact.priority === "high" ? 3 : artifact.priority === "medium" ? 2 : 1;

        return {
          id: artifact.id,
          title: communication?.subject ?? artifact.summary,
          organization: organization?.name,
          type: artifact.type,
          priority: artifact.priority,
          summary: artifact.summary,
          timestamp,
          timestampMs: new Date(timestamp).getTime(),
          priorityScore,
        };
      })
      .sort((a, b) => {
        const byPriority = b.priorityScore - a.priorityScore;
        if (byPriority !== 0) return byPriority;
        return b.timestampMs - a.timestampMs;
      })
      .slice(0, limit)
      .map(({ timestampMs: _ms, priorityScore: _score, ...item }) => item);
  }

  overview(): QueryEngineOverview {
    const snapshot = eslStore.getSnapshot();
    const graph = knowledgeGraphBuilder.snapshot();

    // Pre-group communications by organizationId and artifacts by communicationId
    // Optimization: Reduces overview computation complexity from O(Orgs * (Comms + Artifacts)) to O(Orgs + Comms + Artifacts)
    const commsByOrgId = new Map<string, typeof snapshot.communications>();
    for (const comm of snapshot.communications) {
      if (!comm.organizationId) continue;
      let list = commsByOrgId.get(comm.organizationId);
      if (!list) {
        list = [];
        commsByOrgId.set(comm.organizationId, list);
      }
      list.push(comm);
    }

    const artifactsByCommId = new Map<string, typeof snapshot.artifacts>();
    for (const art of snapshot.artifacts) {
      let list = artifactsByCommId.get(art.communicationId);
      if (!list) {
        list = [];
        artifactsByCommId.set(art.communicationId, list);
      }
      list.push(art);
    }

    const organizationSummaries = snapshot.organizations.map((org) => {
      const communications = commsByOrgId.get(org.id) ?? [];
      let totalArtifacts = 0;
      let highPriority = 0;

      for (const comm of communications) {
        const commArtifacts = artifactsByCommId.get(comm.id);
        if (commArtifacts) {
          totalArtifacts += commArtifacts.length;
          for (const a of commArtifacts) {
            if (a.priority === "high") {
              highPriority++;
            }
          }
        }
      }

      return {
        organization: org.name,
        communications: communications.length,
        artifacts: totalArtifacts,
        highPriority,
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
