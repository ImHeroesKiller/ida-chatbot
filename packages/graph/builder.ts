import { generateId } from "@/core/shared/id";
import type { ESLIngestResult } from "@ida/esl/entities";

import type { GraphEdge, GraphNode, KnowledgeGraphSnapshot } from "./types";

export class KnowledgeGraphBuilder {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();

  ingest(result: ESLIngestResult): void {
    this.upsertNode({
      id: result.person.id,
      type: "person",
      label: result.person.name ?? result.person.email,
      data: {
        email: result.person.email,
        organizationIds: result.person.organizationIds,
      },
    });

    if (result.organization) {
      this.upsertNode({
        id: result.organization.id,
        type: "organization",
        label: result.organization.name,
        data: { aliases: result.organization.aliases },
      });
    }

    this.upsertNode({
      id: result.communication.id,
      type: "communication",
      label: result.communication.subject,
      data: {
        snippet: result.communication.snippet,
        timestamp: result.communication.timestamp,
        sourceId: result.communication.sourceId,
      },
    });

    this.upsertNode({
      id: result.artifact.id,
      type: "artifact",
      label: result.artifact.summary,
      data: {
        type: result.artifact.type,
        amount: result.artifact.amount,
        priority: result.artifact.priority,
      },
    });

    this.addEdge(result.person.id, result.communication.id, "sent");
    this.addEdge(result.communication.id, result.artifact.id, "has_artifact");

    if (result.organization) {
      this.addEdge(result.communication.id, result.organization.id, "about");
      this.addEdge(result.person.id, result.organization.id, "linked_to");
    }
  }

  snapshot(): KnowledgeGraphSnapshot {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());

    return {
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        organizations: nodes.filter((n) => n.type === "organization").length,
        communications: nodes.filter((n) => n.type === "communication").length,
      },
    };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  private upsertNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  private addEdge(
    source: string,
    target: string,
    type: GraphEdge["type"],
    label?: string,
  ): void {
    const id = generateId("edge");
    this.edges.set(id, { id, source, target, type, label });
  }
}

export const knowledgeGraphBuilder = new KnowledgeGraphBuilder();