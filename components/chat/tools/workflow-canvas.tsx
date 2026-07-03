"use client";

import {
  Component,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
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

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, PauseCircle, ShieldCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { useIsMobileViewport } from "@/lib/client/use-media-query";
import { COPY } from "@/lib/i18n";
import type {
  WorkflowExecutionLogEntry,
  WorkflowNodeData,
  WorkflowNodeKind,
} from "@/lib/workflow";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  WorkflowNodeKind,
  { border: string; badge: string; dot: string }
> = {
  trigger: {
    border:
      "border-emerald-500/40 bg-emerald-500/8 shadow-sm shadow-emerald-500/10 dark:bg-emerald-500/12 dark:shadow-emerald-500/15",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  action: {
    border:
      "border-blue-500/40 bg-blue-500/8 shadow-sm shadow-blue-500/10 dark:bg-blue-500/12 dark:shadow-blue-500/15",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  condition: {
    border:
      "border-amber-500/40 bg-amber-500/8 shadow-sm shadow-amber-500/10 dark:bg-amber-500/12",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  output: {
    border:
      "border-violet-500/40 bg-violet-500/8 shadow-sm shadow-violet-500/10 dark:bg-violet-500/12",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  approval: {
    border:
      "border-rose-500/40 bg-rose-500/8 shadow-sm shadow-rose-500/10 dark:bg-rose-500/12",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

const EMPTY_EXECUTION_STATUS: Record<
  string,
  WorkflowExecutionLogEntry["status"]
> = {};

const WorkflowExecutionStatusContext = createContext(EMPTY_EXECUTION_STATUS);

function useNodeExecutionStatus(nodeId: string | undefined) {
  const statusMap = useContext(WorkflowExecutionStatusContext);
  if (!nodeId) return undefined;
  return statusMap[nodeId];
}

const EXECUTION_RING: Record<
  WorkflowExecutionLogEntry["status"],
  string | null
> = {
  running: "ring-2 ring-sky-500/70 ring-offset-2 ring-offset-background animate-pulse",
  completed: "ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-background",
  failed: "ring-2 ring-destructive/80 ring-offset-2 ring-offset-background",
  skipped: "opacity-60 ring-1 ring-dashed ring-muted-foreground/40",
  paused:
    "ring-2 ring-amber-500/80 ring-offset-2 ring-offset-background animate-pulse",
  awaiting_approval:
    "ring-2 ring-rose-500/80 ring-offset-2 ring-offset-background animate-pulse",
};

function ExecutionStatusBadge({
  status,
}: {
  status?: WorkflowExecutionLogEntry["status"];
}) {
  if (!status || status === "skipped") return null;

  if (status === "paused") {
    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
        <PauseCircle className="h-3 w-3" aria-hidden />
      </span>
    );
  }

  if (status === "awaiting_approval") {
    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
        <ShieldCheck className="h-3 w-3" aria-hidden />
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
      </span>
    );
  }

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm">
      <XCircle className="h-3 w-3" aria-hidden />
    </span>
  );
}

const WorkflowFlowNode = memo(
  function WorkflowFlowNode({
    id,
    data,
    selected,
  }: NodeProps<WorkflowNodeData>) {
    const styles = KIND_STYLES[data.kind] ?? KIND_STYLES.action;
    const executionStatus = useNodeExecutionStatus(id);
    const executionRing = executionStatus
      ? EXECUTION_RING[executionStatus]
      : null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.92, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className={cn(
          "relative min-w-[8rem] max-w-[11rem] rounded-xl border px-3 py-2 backdrop-blur-sm transition-shadow duration-300 sm:min-w-[9.5rem] sm:max-w-[12.5rem] sm:px-3.5 sm:py-2.5",
          styles.border,
          selected &&
            "ring-2 ring-primary/80 ring-offset-2 ring-offset-background shadow-lg",
          executionRing,
        )}
      >
        <ExecutionStatusBadge status={executionStatus} />
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary/70 transition-transform hover:!scale-125"
        />
        <span
          className={cn(
            "mb-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            styles.badge,
          )}
        >
          {data.kind}
        </span>
        <p className="truncate text-sm font-medium text-foreground">
          {data.label}
        </p>
        {data.description ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
            {data.description}
          </p>
        ) : null}
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !border-background !bg-primary/70 transition-transform hover:!scale-125"
        />
      </motion.div>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.selected === next.selected &&
    prev.data.label === next.data.label &&
    prev.data.kind === next.data.kind &&
    prev.data.description === next.data.description,
);

/** Module-level stable references — never recreate per render. */
const NODE_TYPES = {
  default: WorkflowFlowNode,
  workflow: WorkflowFlowNode,
} as const;

const EDGE_TYPES = {} as const;

const FIT_VIEW_OPTIONS = { padding: 0.2, duration: 200 } as const;

const PRO_OPTIONS = { hideAttribution: true } as const;

/** React Flow emits select/dimensions on mount — ignore to avoid parent update loops. */
function isPropagatableNodeChange(change: NodeChange): boolean {
  return change.type !== "select" && change.type !== "dimensions";
}

function isPropagatableEdgeChange(change: EdgeChange): boolean {
  return change.type !== "select";
}

const FitViewOnce = memo(function FitViewOnce({
  workflowId,
  nodeCount,
}: {
  workflowId?: string;
  nodeCount: number;
}) {
  const { fitView } = useReactFlow();
  const fitViewRef = useRef(fitView);
  const lastWorkflowIdRef = useRef<string | null>(null);

  fitViewRef.current = fitView;

  useEffect(() => {
    if (!workflowId || nodeCount === 0) return;
    if (lastWorkflowIdRef.current === workflowId) return;

    lastWorkflowIdRef.current = workflowId;
    const timer = window.setTimeout(() => {
      try {
        void fitViewRef.current(FIT_VIEW_OPTIONS);
      } catch {
        // Provider may be unmounting.
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [nodeCount, workflowId]);

  return null;
});

interface WorkflowCanvasErrorBoundaryState {
  hasError: boolean;
}

class WorkflowCanvasErrorBoundary extends Component<
  { children: ReactNode; locale?: Locale },
  WorkflowCanvasErrorBoundaryState
> {
  state: WorkflowCanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WorkflowCanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[workflow:canvas] render error", error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const locale = this.props.locale ?? "en";
      const copy = COPY[locale];

      return (
        <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-4 text-center">
          <p className="text-sm font-medium text-destructive">
            {copy.workflowCanvasError}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.workflowCanvasErrorHint}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={this.handleRetry}
          >
            {copy.workflowCanvasRetry}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  nodeExecutionStatus?: Record<string, WorkflowExecutionLogEntry["status"]>;
  onNodesChange: (nodes: Node<WorkflowNodeData>[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  className?: string;
  workflowId?: string;
  locale?: Locale;
}

function areCanvasPropsEqual(
  prev: WorkflowCanvasProps,
  next: WorkflowCanvasProps,
): boolean {
  return (
    prev.workflowId === next.workflowId &&
    prev.selectedNodeId === next.selectedNodeId &&
    prev.nodeExecutionStatus === next.nodeExecutionStatus &&
    prev.className === next.className &&
    prev.locale === next.locale &&
    prev.nodes === next.nodes &&
    prev.edges === next.edges &&
    prev.onNodesChange === next.onNodesChange &&
    prev.onEdgesChange === next.onEdgesChange &&
    prev.onSelectNode === next.onSelectNode
  );
}

const WorkflowCanvasInner = memo(function WorkflowCanvasInner({
  nodes,
  edges,
  selectedNodeId,
  nodeExecutionStatus,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  className,
  workflowId,
}: WorkflowCanvasProps) {
  const isMobile = useIsMobileViewport();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const onNodesChangeRef = useRef(onNodesChange);
  const onEdgesChangeRef = useRef(onEdgesChange);
  const onSelectNodeRef = useRef(onSelectNode);
  const selectedNodeIdRef = useRef(selectedNodeId);

  nodesRef.current = nodes;
  edgesRef.current = edges;
  onNodesChangeRef.current = onNodesChange;
  onEdgesChangeRef.current = onEdgesChange;
  onSelectNodeRef.current = onSelectNode;
  selectedNodeIdRef.current = selectedNodeId;

  const flowNodes = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: node.type ?? "workflow",
        position: node.position,
        data: node.data,
        selected: node.selected,
        dragging: node.dragging,
        width: node.width,
        height: node.height,
      })),
    [nodes],
  );

  const flowEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        animated: true,
        style: { strokeWidth: 2 },
      })),
    [edges],
  );

  const executionStatusValue = nodeExecutionStatus ?? EMPTY_EXECUTION_STATUS;

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    const meaningful = changes.filter(isPropagatableNodeChange);
    if (meaningful.length === 0) return;

    const nextNodes = applyNodeChanges(
      meaningful,
      nodesRef.current,
    ) as Node<WorkflowNodeData>[];

    if (nextNodes.length === 0 && nodesRef.current.length > 0) {
      return;
    }

    onNodesChangeRef.current(nextNodes);
  }, []);

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    const meaningful = changes.filter(isPropagatableEdgeChange);
    if (meaningful.length === 0) return;

    onEdgesChangeRef.current(applyEdgeChanges(meaningful, edgesRef.current));
  }, []);

  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    onEdgesChangeRef.current(
      addEdge(
        {
          ...connection,
          id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        },
        edgesRef.current,
      ),
    );
  }, []);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const nextId = selectedNodes[0]?.id ?? null;
      if (nextId === selectedNodeIdRef.current) return;
      selectedNodeIdRef.current = nextId;
      onSelectNodeRef.current(nextId);
    },
    [],
  );

  return (
    <div
      className={cn(
        "h-full w-full",
        isMobile ? "min-h-[42vh]" : "min-h-[28rem]",
        className,
      )}
    >
      <WorkflowExecutionStatusContext.Provider value={executionStatusValue}>
        <ReactFlow
          key={workflowId ?? "workflow-canvas"}
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onSelectionChange={handleSelectionChange}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          panOnScroll={!isMobile}
          zoomOnPinch={isMobile}
          minZoom={isMobile ? 0.25 : 0.35}
          maxZoom={1.5}
          onlyRenderVisibleElements={flowNodes.length > 12}
          proOptions={PRO_OPTIONS}
          className="workflow-canvas-flow touch-pan-y rounded-lg border border-border/30 bg-muted/10 dark:bg-muted/6"
        >
          <FitViewOnce workflowId={workflowId} nodeCount={flowNodes.length} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={isMobile ? 14 : 18}
            size={1}
            className="!bg-transparent"
          />
          <Controls
            showInteractive={false}
            className={cn(
              "!rounded-md !border !border-border/60 !bg-background/95 !shadow-sm [&>button]:!h-7 [&>button]:!w-7 [&>button]:!border-border/60 [&>button]:!bg-background [&>button]:hover:!bg-muted",
              isMobile && "scale-90",
            )}
          />
        </ReactFlow>
      </WorkflowExecutionStatusContext.Provider>
    </div>
  );
}, areCanvasPropsEqual);

const WorkflowCanvasShell = memo(function WorkflowCanvasShell(
  props: WorkflowCanvasProps,
) {
  return (
    <WorkflowCanvasErrorBoundary locale={props.locale}>
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </WorkflowCanvasErrorBoundary>
  );
}, areCanvasPropsEqual);

export const WorkflowCanvas = WorkflowCanvasShell;