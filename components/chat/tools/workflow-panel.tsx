"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronRight,
  Download,
  GitBranch,
  Loader2,
  PanelRightClose,
  Play,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

import type { WorkflowTool } from "@/components/chat/tools/use-workflow";
import { WorksheetConfirmDialog } from "@/components/chat/tools/worksheet/worksheet-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { inspectWorkflowResponse } from "@/lib/workflow-chat";
import {
  WORKFLOW_NODE_ACTIONS,
  getWorkflowNodeActionDefinition,
  parseWorkflowNodeActionId,
  readWorkflowNodeActionParams,
  type WorkflowNodeActionId,
} from "@/lib/workflow-actions";
import {
  getWorkflowNodePrompt,
  type WorkflowNodeData,
  type WorkflowNodeKind,
} from "@/lib/workflow";
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
  sessionId?: string;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

function WorkflowPanelInner({
  locale,
  workflowTool,
  sessionId,
  onClose,
  className,
  embedded = false,
}: WorkflowPanelProps) {
  const copy = COPY[locale];
  const {
    activeWorkflow,
    workflows,
    isExecuting,
    executionNodeStatus,
    activeExecutionId,
    errorDetail,
    lastExecution,
    importLatestGeneratedWorkflow,
    lastGeneratedWorkflowSource,
    workspace,
  } = workflowTool;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNodeIdRef = useRef<string | null>(null);
  const activeWorkflowRef = useRef(activeWorkflow);
  const updateWorkflowRef = useRef(workflowTool.updateWorkflow);

  activeWorkflowRef.current = activeWorkflow;
  updateWorkflowRef.current = workflowTool.updateWorkflow;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const logPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedNodeId(null);
  }, [activeWorkflow?.id]);

  useEffect(() => {
    if (!isExecuting || !logPanelRef.current) return;
    logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
  }, [isExecuting, lastExecution?.logs?.length]);

  const canImportLatest = Boolean(lastGeneratedWorkflowSource?.trim());

  const canvasExecutionStatus = useMemo(() => {
    const statusWorkflowId = activeExecutionId ?? lastExecution?.workflowId;
    if (!statusWorkflowId || statusWorkflowId !== activeWorkflow?.id) {
      return undefined;
    }
    return executionNodeStatus;
  }, [
    activeExecutionId,
    activeWorkflow?.id,
    executionNodeStatus,
    lastExecution?.workflowId,
  ]);

  const selectedNode = useMemo(() => {
    if (!activeWorkflow || !selectedNodeId) return null;
    return activeWorkflow.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [activeWorkflow, selectedNodeId]);

  const handleNodesChange = useCallback((nodes: Node<WorkflowNodeData>[]) => {
    const workflow = activeWorkflowRef.current;
    if (!workflow) return;
    updateWorkflowRef.current(workflow.id, { nodes, edges: workflow.edges });
  }, []);

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    const workflow = activeWorkflowRef.current;
    if (!workflow) return;
    updateWorkflowRef.current(workflow.id, { nodes: workflow.nodes, edges });
  }, []);

  const handleSelectNode = useCallback((nodeId: string | null) => {
    if (selectedNodeIdRef.current === nodeId) return;
    selectedNodeIdRef.current = nodeId;
    setSelectedNodeId(nodeId);
  }, []);

  const workflowErrorMessage = useMemo(() => {
    if (errorDetail) return errorDetail;

    switch (workspace.error) {
      case "parse_failed":
        return copy.workflowErrorParseFailed;
      case "empty_workflow":
        return copy.workflowErrorEmptyWorkflow;
      case "execute_failed":
        return copy.workflowExecuted;
      default:
        return null;
    }
  }, [
    copy.workflowErrorEmptyWorkflow,
    copy.workflowErrorParseFailed,
    copy.workflowExecuted,
    errorDetail,
    workspace.error,
  ]);

  const showImportDebug = Boolean(
    workflowErrorMessage && lastGeneratedWorkflowSource?.trim(),
  );

  const workflowParseDebug = useMemo(() => {
    if (!lastGeneratedWorkflowSource?.trim()) return null;
    return inspectWorkflowResponse(lastGeneratedWorkflowSource);
  }, [lastGeneratedWorkflowSource]);

  const handleImportLatest = useCallback(() => {
    const imported = importLatestGeneratedWorkflow(locale);
    if (imported) {
      toast.success(copy.workflowCreated);
      setSelectedNodeId(null);
      return;
    }

    toast.error(copy.workflowImportFailed);
  }, [
    copy.workflowCreated,
    copy.workflowImportFailed,
    importLatestGeneratedWorkflow,
    locale,
  ]);

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
    const result = await workflowTool.executeWorkflow(undefined, {
      locale,
      sessionId,
    });
    if (result?.status === "completed") {
      toast.success(result.message ?? copy.workflowExecuted);
    } else if (result?.status === "failed") {
      toast.error(result.message ?? copy.workflowExecuted);
    }
  }, [copy.workflowExecuted, locale, sessionId, workflowTool]);

  const handleConfirmDeleteWorkflow = useCallback(() => {
    if (!activeWorkflow) return;
    workflowTool.deleteWorkflow(activeWorkflow.id);
    setSelectedNodeId(null);
    setDeleteDialogOpen(false);
  }, [activeWorkflow, workflowTool]);

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

  const selectedNodeActionId = useMemo(() => {
    if (!selectedNode) return "llm" as WorkflowNodeActionId;
    return parseWorkflowNodeActionId(selectedNode.data.config?.action);
  }, [selectedNode]);

  const selectedNodeAction = useMemo(
    () => getWorkflowNodeActionDefinition(selectedNodeActionId),
    [selectedNodeActionId],
  );

  const selectedNodeActionParams = useMemo(() => {
    if (!selectedNode) return {};
    return readWorkflowNodeActionParams(selectedNode);
  }, [selectedNode]);

  const handleNodeActionChange = useCallback(
    (actionId: WorkflowNodeActionId) => {
      if (!selectedNode) return;
      updateSelectedNodeData({
        config: {
          ...selectedNode.data.config,
          action: actionId,
        },
      });
    },
    [selectedNode, updateSelectedNodeData],
  );

  const handleNodeActionParamChange = useCallback(
    (key: string, value: string) => {
      if (!selectedNode) return;
      updateSelectedNodeData({
        config: {
          ...selectedNode.data.config,
          actionParams: {
            ...readWorkflowNodeActionParams(selectedNode),
            [key]: value,
          },
        },
      });
    },
    [selectedNode, updateSelectedNodeData],
  );

  const showNodeActionConfig =
    selectedNode?.data.kind === "action" || selectedNode?.data.kind === "output";

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
            disabled={
              !activeWorkflow ||
              isExecuting ||
              Boolean(
                activeExecutionId &&
                  activeExecutionId !== activeWorkflow?.id,
              )
            }
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
            onClick={() => setDeleteDialogOpen(true)}
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
              key={activeWorkflow.id}
              workflowId={activeWorkflow.id}
              nodes={activeWorkflow.nodes}
              edges={activeWorkflow.edges}
              selectedNodeId={selectedNodeId}
              nodeExecutionStatus={canvasExecutionStatus}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onSelectNode={handleSelectNode}
              className="h-full"
            />
          ) : (
            <div className="flex h-full min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/15 px-4 text-center dark:bg-muted/10">
              <GitBranch className="mb-3 h-8 w-8 text-muted-foreground/70" />
              <p className="text-sm font-medium">{copy.workflowEmptyTitle}</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {copy.workflowEmptyHint}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button type="button" size="sm" onClick={handleNewWorkflow}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {copy.workflowNew}
                </Button>
                {canImportLatest ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleImportLatest}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    {copy.workflowImportLatest}
                  </Button>
                ) : null}
              </div>
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
                  rows={3}
                  className="min-h-[4rem] resize-none text-xs"
                />
              </div>
              {showNodeActionConfig ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="workflow-node-action" className="text-xs">
                      {copy.workflowNodeAction}
                    </Label>
                    <select
                      id="workflow-node-action"
                      value={selectedNodeActionId}
                      onChange={(event) =>
                        handleNodeActionChange(
                          event.target.value as WorkflowNodeActionId,
                        )
                      }
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {WORKFLOW_NODE_ACTIONS.map((action) => (
                        <option key={action.id} value={action.id}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedNodeAction.description}
                    </p>
                  </div>
                  {selectedNodeAction.paramFields.length > 0 ? (
                    <div className="space-y-2 rounded-md border border-dashed p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.workflowActionParams}
                      </p>
                      {selectedNodeAction.paramFields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label
                            htmlFor={`workflow-action-${field.key}`}
                            className="text-xs"
                          >
                            {field.label}
                          </Label>
                          {field.multiline ? (
                            <Textarea
                              id={`workflow-action-${field.key}`}
                              value={selectedNodeActionParams[field.key] ?? ""}
                              onChange={(event) =>
                                handleNodeActionParamChange(
                                  field.key,
                                  event.target.value,
                                )
                              }
                              rows={3}
                              placeholder={field.placeholder}
                              className="min-h-[4rem] resize-none text-xs"
                            />
                          ) : (
                            <Input
                              id={`workflow-action-${field.key}`}
                              value={selectedNodeActionParams[field.key] ?? ""}
                              onChange={(event) =>
                                handleNodeActionParamChange(
                                  field.key,
                                  event.target.value,
                                )
                              }
                              placeholder={field.placeholder}
                              className="h-8 text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      {copy.workflowActionLlmHint}
                    </p>
                  )}
                </>
              ) : null}
              {selectedNode.data.kind !== "trigger" ? (
                <div className="space-y-1">
                  <Label htmlFor="workflow-node-prompt" className="text-xs">
                    {copy.workflowNodePrompt}
                  </Label>
                  <Textarea
                    id="workflow-node-prompt"
                    value={getWorkflowNodePrompt(selectedNode)}
                    onChange={(event) =>
                      updateSelectedNodeData({
                        prompt: event.target.value || undefined,
                        config: {
                          ...selectedNode.data.config,
                          prompt: event.target.value || undefined,
                        },
                      })
                    }
                    rows={4}
                    placeholder="Instruksi LLM untuk node ini..."
                    className="min-h-[5rem] resize-none text-xs"
                  />
                </div>
              ) : null}
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

      {(workflowErrorMessage ||
        isExecuting ||
        lastExecution ||
        showImportDebug) && (
        <div className="shrink-0 space-y-2 border-t px-3 py-2">
          {workflowErrorMessage ? (
            <p className="text-[10px] text-destructive">{workflowErrorMessage}</p>
          ) : null}
          {showImportDebug ? (
            <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 p-2">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 text-left text-[10px] font-medium text-muted-foreground"
                onClick={() => setShowRawResponse((prev) => !prev)}
              >
                {showRawResponse ? (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                )}
                <span>
                  {showRawResponse
                    ? copy.workflowDebugHideRaw
                    : copy.workflowDebugShowRaw}
                </span>
                <span className="text-destructive/80">
                  — {copy.workflowDebugRawResponse}
                </span>
              </button>
              {showRawResponse ? (
                <div className="mt-2 space-y-2">
                  {workflowParseDebug?.markerPayload ? (
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.workflowDebugMarkerPayload}
                        {workflowParseDebug.usedMarker
                          ? ` (${workflowParseDebug.usedMarker})`
                          : ""}
                      </p>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-background/80 p-2 font-mono text-[9px] leading-relaxed text-foreground/80">
                        {workflowParseDebug.markerPayload}
                      </pre>
                    </div>
                  ) : null}
                  {workflowParseDebug?.extractedJson ? (
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.workflowDebugExtractedJson}
                        {workflowParseDebug.candidateCount
                          ? ` (${workflowParseDebug.candidateCount} candidates)`
                          : ""}
                      </p>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-background/80 p-2 font-mono text-[9px] leading-relaxed text-foreground/80">
                        {workflowParseDebug.extractedJson}
                      </pre>
                    </div>
                  ) : null}
                  <div>
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {copy.workflowDebugRawResponse}
                    </p>
                    <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-background/80 p-2 font-mono text-[9px] leading-relaxed text-foreground/80">
                      {lastGeneratedWorkflowSource}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          {!activeWorkflow && canImportLatest ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={handleImportLatest}
            >
              <Download className="mr-1 h-3 w-3" />
              {copy.workflowImportLatest}
            </Button>
          ) : null}
          {isExecuting ? (
            <p className="flex items-center gap-1.5 text-[10px] text-sky-700 dark:text-sky-300">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              {copy.workflowExecute}
            </p>
          ) : null}
          {!isExecuting && lastExecution?.message ? (
            <p className="text-[10px] text-muted-foreground">
              {lastExecution.message}
            </p>
          ) : null}
          {(isExecuting ||
            (lastExecution?.workflowId === activeWorkflow?.id &&
              lastExecution?.logs &&
              lastExecution.logs.length > 0)) ? (
            <div
              ref={logPanelRef}
              className="max-h-36 overflow-y-auto rounded-md border bg-muted/20 p-2"
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.workflowExecutionLogs}
              </p>
              <ul className="space-y-1.5">
                {lastExecution?.logs?.map((log, index) => (
                  <li
                    key={`${log.nodeId}-${log.startedAt}-${index}`}
                    className={cn(
                      "rounded px-1.5 py-1 text-[10px]",
                      log.status === "running" &&
                        "bg-sky-500/10 text-sky-900 dark:text-sky-100",
                      log.status === "completed" &&
                        "bg-emerald-500/10 text-foreground/90",
                      log.status === "failed" &&
                        "bg-destructive/10 text-destructive",
                      log.status === "skipped" &&
                        "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {log.status === "running" ? (
                        <Loader2
                          className="h-3 w-3 shrink-0 animate-spin text-sky-600"
                          aria-hidden
                        />
                      ) : null}
                      <span className="font-medium">{log.label}</span>
                      <span className="text-muted-foreground capitalize">
                        ({log.status})
                      </span>
                    </div>
                    {log.message ? (
                      <p className="mt-0.5 text-muted-foreground">{log.message}</p>
                    ) : null}
                    {log.output ? (
                      <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                        {log.output}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <WorksheetConfirmDialog
        open={deleteDialogOpen}
        locale={locale}
        title={copy.workflowDeleteConfirm}
        description={copy.workflowDeleteConfirmDescription}
        confirmLabel={copy.workflowDelete}
        destructive
        onConfirm={handleConfirmDeleteWorkflow}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </aside>
  );
}

export const WorkflowPanel = memo(WorkflowPanelInner);