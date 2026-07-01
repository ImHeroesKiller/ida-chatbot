"use client";

import dynamic from "next/dynamic";
import {
  GitBranch,
  Loader2,
  PanelRightClose,
  Play,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import type { WorkflowTool } from "@/components/chat/tools/use-workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorkflowNodeData, WorkflowNodeKind } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import type { Edge, Node } from "reactflow";

const WorkflowCanvas = dynamic(
  () =>
    import("@/components/chat/tools/workflow-canvas").then((mod) => ({
      default: mod.WorkflowCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[14rem] items-center justify-center rounded-xl border border-dashed bg-muted/20">
        <p className="text-xs text-muted-foreground">Loading canvas…</p>
      </div>
    ),
  },
);

const NODE_KINDS: WorkflowNodeKind[] = [
  "trigger",
  "action",
  "condition",
  "output",
];

function getNodeKindLabel(
  copy: (typeof COPY)["id"],
  kind: WorkflowNodeKind,
): string {
  switch (kind) {
    case "trigger":
      return copy.workflowAddTrigger;
    case "action":
      return copy.workflowAddAction;
    case "condition":
      return copy.workflowAddCondition;
    case "output":
      return copy.workflowAddOutput;
    default:
      return kind;
  }
}

interface WorkflowPanelProps {
  locale: Locale;
  workflowTool: WorkflowTool;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

export function WorkflowPanel({
  locale,
  workflowTool,
  onClose,
  className,
  embedded = false,
}: WorkflowPanelProps) {
  const copy = COPY[locale];
  const { activeWorkflow, workflows, isExecuting } = workflowTool;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [activeWorkflow?.id]);

  const selectedNode = useMemo(() => {
    if (!activeWorkflow || !selectedNodeId) return null;
    return activeWorkflow.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [activeWorkflow, selectedNodeId]);

  const persistCanvas = useCallback(
    (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => {
      if (!activeWorkflow) return;
      workflowTool.updateWorkflow(activeWorkflow.id, { nodes, edges });
    },
    [activeWorkflow, workflowTool],
  );

  const handleNodesChange = useCallback(
    (nodes: Node<WorkflowNodeData>[]) => {
      if (!activeWorkflow) return;
      persistCanvas(nodes, activeWorkflow.edges);
    },
    [activeWorkflow, persistCanvas],
  );

  const handleEdgesChange = useCallback(
    (edges: Edge[]) => {
      if (!activeWorkflow) return;
      persistCanvas(activeWorkflow.nodes, edges);
    },
    [activeWorkflow, persistCanvas],
  );

  const handleNewWorkflow = useCallback(() => {
    const created = workflowTool.createWorkflow({
      name: `Workflow ${workflows.length + 1}`,
    });
    if (created) {
      setSelectedNodeId(null);
    }
  }, [workflowTool, workflows.length]);

  const handleAddNode = useCallback(
    (kind: WorkflowNodeKind) => {
      let workflowId = activeWorkflow?.id ?? null;
      if (!workflowId) {
        const created = workflowTool.createWorkflow({
          name: `Workflow ${workflows.length + 1}`,
        });
        workflowId = created?.id ?? null;
      }
      if (!workflowId) return;

      const label = getNodeKindLabel(copy, kind);
      workflowTool.addNode({ label, kind }, workflowId);
    },
    [activeWorkflow, copy, workflowTool, workflows.length],
  );

  const handleSave = useCallback(() => {
    workflowTool.syncToPersistLayer();
    toast.success(copy.workflowSaved);
  }, [copy.workflowSaved, workflowTool]);

  const handleExecute = useCallback(async () => {
    const result = await workflowTool.executeWorkflow();
    if (result) {
      toast.success(result.message ?? copy.workflowExecuted);
    }
  }, [copy.workflowExecuted, workflowTool]);

  const handleDeleteWorkflow = useCallback(() => {
    if (!activeWorkflow) return;
    if (!window.confirm(copy.workflowDeleteConfirm)) return;

    workflowTool.deleteWorkflow(activeWorkflow.id);
    setSelectedNodeId(null);
  }, [activeWorkflow, copy.workflowDeleteConfirm, workflowTool]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    workflowTool.deleteNode(selectedNodeId);
    setSelectedNodeId(null);
  }, [selectedNodeId, workflowTool]);

  const updateSelectedNodeData = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      if (!activeWorkflow || !selectedNode) return;

      const nodes = activeWorkflow.nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      );
      workflowTool.updateWorkflow(activeWorkflow.id, { nodes });
    },
    [activeWorkflow, selectedNode, workflowTool],
  );

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background",
        embedded
          ? "w-full"
          : "relative z-10 w-[min(100%,32rem)] shrink-0",
        className,
      )}
      aria-label={copy.toolsWorkflow}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <GitBranch className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {copy.toolsWorkflow}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-8 w-8 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="shrink-0 space-y-2 border-b px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[10px]"
            onClick={handleNewWorkflow}
          >
            <Plus className="mr-1 h-3 w-3" />
            {copy.workflowNew}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[10px]"
            onClick={handleSave}
            disabled={!activeWorkflow}
          >
            <Save className="mr-1 h-3 w-3" />
            {copy.workflowSave}
          </Button>
          <Button
            type="button"
            variant="default"
            size="xs"
            className="h-7 text-[10px]"
            onClick={() => void handleExecute()}
            disabled={!activeWorkflow || isExecuting}
          >
            {isExecuting ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Play className="mr-1 h-3 w-3" />
            )}
            {copy.workflowExecute}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[10px] text-destructive hover:text-destructive"
            onClick={handleDeleteWorkflow}
            disabled={!activeWorkflow}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {copy.workflowDelete}
          </Button>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            {copy.workflowAddNode}
          </p>
          <div className="flex flex-wrap gap-1">
            {NODE_KINDS.map((kind) => (
              <Button
                key={kind}
                type="button"
                variant="secondary"
                size="xs"
                className="h-6 px-2 text-[10px]"
                onClick={() => handleAddNode(kind)}
              >
                {getNodeKindLabel(copy, kind)}
              </Button>
            ))}
          </div>
        </div>

        {workflows.length > 1 ? (
          <div className="flex flex-wrap gap-1">
            {workflows.map((workflow) => (
              <Button
                key={workflow.id}
                type="button"
                variant={
                  workflow.id === activeWorkflow?.id ? "default" : "outline"
                }
                size="xs"
                className="h-6 max-w-full truncate px-2 text-[10px]"
                onClick={() => workflowTool.selectWorkflow(workflow.id)}
              >
                {workflow.name}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1 p-3">
          {activeWorkflow ? (
            <WorkflowCanvas
              nodes={activeWorkflow.nodes}
              edges={activeWorkflow.edges}
              selectedNodeId={selectedNodeId}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onSelectNode={setSelectedNodeId}
              className="h-full"
            />
          ) : (
            <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/15 px-4 text-center dark:bg-muted/10">
              <GitBranch className="mb-3 h-8 w-8 text-muted-foreground/70" />
              <p className="text-sm font-medium">{copy.workflowEmptyTitle}</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {copy.workflowEmptyHint}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4"
                onClick={handleNewWorkflow}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {copy.workflowNew}
              </Button>
            </div>
          )}
        </div>

        {selectedNode ? (
          <div className="shrink-0 border-t bg-muted/10 p-3 dark:bg-muted/5 lg:w-52 lg:border-t-0 lg:border-l">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.workflowProperties}
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="workflow-node-kind" className="text-xs">
                  {copy.workflowNodeKind}
                </Label>
                <Input
                  id="workflow-node-kind"
                  value={selectedNode.data.kind}
                  readOnly
                  className="h-8 text-xs capitalize"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="workflow-node-label" className="text-xs">
                  {copy.workflowNodeLabel}
                </Label>
                <Input
                  id="workflow-node-label"
                  value={selectedNode.data.label}
                  onChange={(event) =>
                    updateSelectedNodeData({ label: event.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="workflow-node-description" className="text-xs">
                  {copy.workflowNodeDescription}
                </Label>
                <Textarea
                  id="workflow-node-description"
                  value={selectedNode.data.description ?? ""}
                  onChange={(event) =>
                    updateSelectedNodeData({
                      description: event.target.value || undefined,
                    })
                  }
                  rows={4}
                  className="min-h-[5rem] resize-none text-xs"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="w-full text-destructive hover:text-destructive"
                onClick={handleDeleteNode}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                {copy.workflowDeleteNode}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {workflowTool.lastExecution ? (
        <div className="shrink-0 border-t px-3 py-2">
          <p className="truncate text-[10px] text-muted-foreground">
            {workflowTool.lastExecution.message}
          </p>
        </div>
      ) : null}
    </aside>
  );
}