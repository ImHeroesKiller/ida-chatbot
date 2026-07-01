"use client";

import { memo, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "reactflow";
import "reactflow/dist/style.css";

import type { WorkflowNodeData, WorkflowNodeKind } from "@/lib/workflow";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  WorkflowNodeKind,
  { border: string; badge: string; dot: string }
> = {
  trigger: {
    border: "border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/15",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  action: {
    border: "border-blue-500/50 bg-blue-500/10 dark:bg-blue-500/15",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  condition: {
    border: "border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  output: {
    border: "border-violet-500/50 bg-violet-500/10 dark:bg-violet-500/15",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
};

const WorkflowFlowNode = memo(function WorkflowFlowNode({
  data,
  selected,
}: NodeProps<WorkflowNodeData>) {
  const styles = KIND_STYLES[data.kind] ?? KIND_STYLES.action;

  return (
    <div
      className={cn(
        "min-w-[9rem] max-w-[12rem] rounded-lg border px-3 py-2 shadow-sm transition-shadow",
        styles.border,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-background !bg-muted-foreground"
      />
      <span
        className={cn(
          "mb-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
          styles.badge,
        )}
      >
        {data.kind}
      </span>
      <p className="truncate text-sm font-medium text-foreground">{data.label}</p>
      {data.description ? (
        <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
          {data.description}
        </p>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-background !bg-muted-foreground"
      />
    </div>
  );
});

const nodeTypes = {
  default: WorkflowFlowNode,
  workflow: WorkflowFlowNode,
};

export interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: (nodes: Node<WorkflowNodeData>[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  className?: string;
}

export function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  className,
}: WorkflowCanvasProps) {
  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        type: node.type ?? "workflow",
        selected: node.id === selectedNodeId,
      })),
    [nodes, selectedNodeId],
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(
        applyNodeChanges(changes, nodes) as Node<WorkflowNodeData>[],
      );
    },
    [nodes, onNodesChange],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(applyEdgeChanges(changes, edges));
    },
    [edges, onEdgesChange],
  );

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      onEdgesChange(
        addEdge(
          {
            ...connection,
            id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
          },
          edges,
        ),
      );
    },
    [edges, onEdgesChange],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      onSelectNode(selectedNodes[0]?.id ?? null);
    },
    [onSelectNode],
  );

  return (
    <div className={cn("h-full min-h-[14rem] w-full", className)}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="rounded-xl border bg-muted/20 dark:bg-muted/10"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          className="!bg-transparent"
        />
        <Controls
          showInteractive={false}
          className="!rounded-lg !border !border-border !bg-background/90 !shadow-sm [&>button]:!border-border [&>button]:!bg-background [&>button]:hover:!bg-muted"
        />
        <MiniMap
          zoomable
          pannable
          className="!rounded-lg !border !border-border !bg-background/80"
          nodeColor={(node) => {
            const kind = (node.data as WorkflowNodeData | undefined)?.kind;
            return kind ? KIND_STYLES[kind].dot : "#64748b";
          }}
        />
      </ReactFlow>
    </div>
  );
}