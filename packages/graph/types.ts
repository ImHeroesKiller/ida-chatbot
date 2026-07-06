export type GraphNodeType =
  | "person"
  | "organization"
  | "communication"
  | "artifact";

export type GraphEdgeType =
  | "sent"
  | "about"
  | "has_artifact"
  | "typed_as"
  | "linked_to";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label?: string;
}

export interface KnowledgeGraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
  stats: {
    nodeCount: number;
    edgeCount: number;
    organizations: number;
    communications: number;
  };
}