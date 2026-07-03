"use client";

import dynamic from "next/dynamic";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Download,
  GitBranch,
  LayoutTemplate,
  Loader2,
  PanelRightClose,
  Play,
  Plus,
  Save,
  Shield,
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
import { WorkflowApprovalDialog } from "@/components/chat/tools/workflow-approval-dialog";
import { WorkflowErrorRecoveryDialog } from "@/components/chat/tools/workflow-error-recovery-dialog";
import { WorkflowFloatingPanel } from "@/components/chat/tools/workflow-floating-panel";
import { WorkflowNodePropertiesPanel } from "@/components/chat/tools/workflow-node-properties-panel";
import { WorkflowSchedulePanel } from "@/components/chat/tools/workflow-schedule-panel";
import { WorksheetConfirmDialog } from "@/components/chat/tools/worksheet/worksheet-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getMultiAgentLabel,
  type MultiAgentId,
} from "@/lib/agent/multi-agent";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { resolveWorkflowErrorMessage, resolveWorkflowExecutionToast } from "@/lib/workflow-feedback";
import { inspectWorkflowResponse } from "@/lib/workflow-chat";
import type { WorkflowScheduleConfig } from "@/lib/workflow-scheduler";
import { type WorkflowNodeData, type WorkflowNodeKind } from "@/lib/workflow";
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

const WorkflowTemplateGallery = dynamic(
  () =>
    import("@/components/chat/tools/workflow-template-gallery").then((mod) => ({
      default: mod.WorkflowTemplateGallery,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

const WorkflowSecurityPanel = dynamic(
  () =>
    import("@/components/chat/tools/workflow-security-panel").then((mod) => ({
      default: mod.WorkflowSecurityPanel,
    })),
  { ssr: false },
);

const NODE_KINDS: WorkflowNodeKind[] = [
  "trigger",
  "action",
  "condition",
  "approval",
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
    case "approval":
      return copy.workflowAddApproval;
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
    multiAgentActivities,
    activeExecutionId,
    errorDetail,
    lastExecution,
    executionCheckpoint,
    importLatestGeneratedWorkflow,
    lastGeneratedWorkflowSource,
    workspace,
  } = workflowTool;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [resumeSubmitting, setResumeSubmitting] = useState(false);
  const notifiedCheckpointRef = useRef<string | null>(null);
  const selectedNodeIdRef = useRef<string | null>(null);
  const activeWorkflowRef = useRef(activeWorkflow);
  const updateWorkflowRef = useRef(workflowTool.updateWorkflow);

  activeWorkflowRef.current = activeWorkflow;
  updateWorkflowRef.current = workflowTool.updateWorkflow;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [activeTab, setActiveTab] = useState<"canvas" | "templates">("canvas");
  const [floatingPanel, setFloatingPanel] = useState<
    "properties" | "security" | "schedule" | null
  >(null);
  const logPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedNodeId(null);
    setFloatingPanel(null);
  }, [activeWorkflow?.id]);

  useEffect(() => {
    if (selectedNodeId) {
      setFloatingPanel((prev) => (prev === "security" ? prev : "properties"));
    } else {
      setFloatingPanel((prev) =>
        prev === "properties" || prev === "schedule" ? null : prev,
      );
    }
  }, [selectedNodeId]);

  useEffect(() => {
    if (!isExecuting || !logPanelRef.current) return;
    logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
  }, [isExecuting, lastExecution?.logs?.length, multiAgentActivities.length]);

  const showApprovalDialog =
    Boolean(executionCheckpoint) &&
    executionCheckpoint?.pauseReason === "approval" &&
    lastExecution?.status === "awaiting_approval" &&
    executionCheckpoint.workflowId === activeWorkflow?.id;

  const showRecoveryDialog =
    Boolean(executionCheckpoint) &&
    executionCheckpoint?.pauseReason === "recovery" &&
    lastExecution?.status === "paused" &&
    executionCheckpoint.workflowId === activeWorkflow?.id;

  useEffect(() => {
    setApprovalDialogOpen(showApprovalDialog);
    setRecoveryDialogOpen(showRecoveryDialog);
  }, [showApprovalDialog, showRecoveryDialog]);

  useEffect(() => {
    if (!executionCheckpoint || isExecuting) return;
    const key = `${executionCheckpoint.pendingNodeId}:${executionCheckpoint.pauseReason}:${lastExecution?.status}`;
    if (notifiedCheckpointRef.current === key) return;
    notifiedCheckpointRef.current = key;

    if (executionCheckpoint.pauseReason === "approval") {
      toast(copy.workflowApprovalRequired, { icon: "🛡️" });
    } else if (executionCheckpoint.pauseReason === "recovery") {
      toast.error(copy.workflowRecoveryRequired);
    }
  }, [
    copy.workflowApprovalRequired,
    copy.workflowRecoveryRequired,
    executionCheckpoint,
    isExecuting,
    lastExecution?.status,
  ]);

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
    if (!nodeId) {
      setFloatingPanel((prev) =>
        prev === "properties" || prev === "schedule" ? null : prev,
      );
    }
  }, []);

  const closeFloatingPanel = useCallback(() => {
    setFloatingPanel((prev) => {
      if (prev === "properties" || prev === "schedule") {
        setSelectedNodeId(null);
        selectedNodeIdRef.current = null;
      }
      return null;
    });
  }, []);

  const openSecurityPanel = useCallback(() => {
    setFloatingPanel("security");
  }, []);

  const openSchedulePanel = useCallback(() => {
    const node = activeWorkflow?.nodes.find((n) => n.id === selectedNodeId);
    if (!node || node.data.kind !== "trigger") {
      toast.error(copy.workflowScheduleRequiresTrigger);
      return;
    }
    setFloatingPanel("schedule");
  }, [activeWorkflow?.nodes, copy.workflowScheduleRequiresTrigger, selectedNodeId]);

  const workflowErrorMessage = useMemo(() => {
    if (!errorDetail && !workspace.error) return null;
    return resolveWorkflowErrorMessage(locale, {
      code: workspace.error,
      message: errorDetail,
    });
  }, [errorDetail, locale, workspace.error]);

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
    notifiedCheckpointRef.current = null;
    const result = await workflowTool.executeWorkflow(undefined, {
      locale,
      sessionId,
    });
    if (!result) return;
    const feedback = resolveWorkflowExecutionToast(
      locale,
      result.status,
      result.message,
    );
    if (feedback.type === "success") {
      toast.success(feedback.text);
    } else if (feedback.type === "info") {
      toast(feedback.text, { icon: "🛡️" });
    } else {
      toast.error(feedback.text);
    }
  }, [locale, sessionId, workflowTool]);

  const handleResume = useCallback(
    async (action: "approve" | "reject" | "retry" | "skip" | "continue", note?: string) => {
      setResumeSubmitting(true);
      try {
        const result = await workflowTool.resumeWorkflow(action, note, {
          locale,
          sessionId,
        });
        if (!result) return;

        const feedback = resolveWorkflowExecutionToast(
          locale,
          result.status,
          result.message ?? copy.workflowResumed,
        );
        if (feedback.type === "success") {
          toast.success(feedback.text);
          setApprovalDialogOpen(false);
          setRecoveryDialogOpen(false);
        } else if (feedback.type === "info") {
          toast(feedback.text, { icon: "🛡️" });
        } else {
          toast.error(feedback.text);
          if (result.status === "failed") {
            setApprovalDialogOpen(false);
            setRecoveryDialogOpen(false);
          }
        }
      } finally {
        setResumeSubmitting(false);
      }
    },
    [copy.workflowResumed, locale, sessionId, workflowTool],
  );

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
    selectedNodeIdRef.current = null;
    setFloatingPanel(null);
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

  const triggerNode =
    selectedNode?.data.kind === "trigger" ? selectedNode : null;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l border-border/30 lg:ida-desktop-panel",
        embedded
          ? "w-full"
          : "relative z-10 w-full shrink-0 md:w-[min(52vw,36rem)] lg:w-[min(48vw,40rem)] xl:w-[min(44vw,42rem)]",
        className,
      )}
      aria-label={copy.toolsWorkflow}
      role="complementary"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border/40 bg-muted/15 px-2.5 py-2 backdrop-blur-sm lg:px-3">
        <GitBranch className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 truncate text-sm font-semibold lg:max-w-[8rem] xl:max-w-none">
          {copy.toolsWorkflow}
        </h2>
        <div className="ml-auto flex min-w-0 flex-1 justify-end gap-0.5 rounded-md bg-muted/40 p-0.5 lg:max-w-[14rem]">
          <Button
            type="button"
            size="xs"
            variant={activeTab === "canvas" ? "default" : "ghost"}
            className="h-6 min-w-0 flex-1 px-2 text-[10px]"
            onClick={() => setActiveTab("canvas")}
          >
            <GitBranch className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">{copy.workflowTabCanvas}</span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant={activeTab === "templates" ? "default" : "ghost"}
            className="h-6 min-w-0 flex-1 px-2 text-[10px]"
            onClick={() => setActiveTab("templates")}
          >
            <LayoutTemplate className="mr-1 h-3 w-3 shrink-0" />
            <span className="truncate">{copy.workflowTabTemplates}</span>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-7 w-7 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {activeTab === "templates" ? (
        <WorkflowTemplateGallery
          locale={locale}
          workflowTool={workflowTool}
          onApplied={() => setActiveTab("canvas")}
        />
      ) : null}

      {activeTab === "canvas" ? (
        <>
      <div className="shrink-0 space-y-1 border-b px-1.5 py-1 lg:px-2">
        <div className="flex flex-wrap items-center gap-0.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            onClick={handleNewWorkflow}
            title={copy.workflowNew}
            aria-label={copy.workflowNew}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={!activeWorkflow}
            title={copy.workflowSave}
            aria-label={copy.workflowSave}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            className="h-7 w-7"
            onClick={() => void handleExecute()}
            disabled={
              !activeWorkflow ||
              isExecuting ||
              Boolean(
                activeExecutionId &&
                  activeExecutionId !== activeWorkflow?.id,
              )
            }
            title={copy.workflowExecute}
            aria-label={copy.workflowExecute}
          >
            {isExecuting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!activeWorkflow}
            title={copy.workflowDelete}
            aria-label={copy.workflowDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            onClick={openSecurityPanel}
            disabled={!activeWorkflow}
            title={copy.workflowSecurityTitle}
            aria-label={copy.workflowSecurityTitle}
          >
            <Shield className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            onClick={openSchedulePanel}
            disabled={!activeWorkflow || !triggerNode}
            title={copy.workflowScheduleTitle}
            aria-label={copy.workflowScheduleTitle}
          >
            <CalendarClock className="h-3.5 w-3.5" />
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

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 p-0.5 sm:p-1">
          {activeWorkflow ? (
            <WorkflowCanvas
              key={activeWorkflow.id}
              workflowId={activeWorkflow.id}
              locale={locale}
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("templates")}
                >
                  <LayoutTemplate className="mr-1.5 h-4 w-4" />
                  {copy.workflowTabTemplates}
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

        {selectedNode && floatingPanel === "properties" ? (
          <WorkflowFloatingPanel
            open
            onClose={closeFloatingPanel}
            title={copy.workflowProperties}
            closeLabel={copy.rightSidebarClose}
            icon={<GitBranch className="h-4 w-4" aria-hidden />}
          >
            <WorkflowNodePropertiesPanel
              locale={locale}
              node={selectedNode}
              onUpdateNodeData={updateSelectedNodeData}
              onOpenSchedule={
                selectedNode.data.kind === "trigger"
                  ? () => setFloatingPanel("schedule")
                  : undefined
              }
              onDeleteNode={handleDeleteNode}
            />
          </WorkflowFloatingPanel>
        ) : null}

        {activeWorkflow && floatingPanel === "security" ? (
          <WorkflowFloatingPanel
            open
            onClose={() => setFloatingPanel(null)}
            title={copy.workflowSecurityTitle}
            closeLabel={copy.rightSidebarClose}
            icon={<Shield className="h-4 w-4" aria-hidden />}
          >
            <WorkflowSecurityPanel
              locale={locale}
              workflow={activeWorkflow}
              sessionId={sessionId}
              floating
              onSecurityUpdated={(updated) => {
                workflowTool.updateWorkflow(activeWorkflow.id, {
                  security: updated.security,
                });
              }}
            />
          </WorkflowFloatingPanel>
        ) : null}

        {activeWorkflow && triggerNode && floatingPanel === "schedule" ? (
          <WorkflowFloatingPanel
            open
            onClose={() =>
              setFloatingPanel(selectedNodeId ? "properties" : null)
            }
            title={copy.workflowScheduleTitle}
            closeLabel={copy.rightSidebarClose}
            icon={<CalendarClock className="h-4 w-4" aria-hidden />}
          >
            <WorkflowSchedulePanel
              locale={locale}
              workflow={activeWorkflow}
              triggerNode={triggerNode}
              sessionId={sessionId}
              floating
              onScheduleChange={(schedule: WorkflowScheduleConfig) => {
                updateSelectedNodeData({
                  config: {
                    ...triggerNode.data.config,
                    schedule,
                  },
                });
              }}
            />
          </WorkflowFloatingPanel>
        ) : null}
      </div>

      {(workflowErrorMessage ||
        isExecuting ||
        lastExecution ||
        showImportDebug) ? (
        <div className="shrink-0 space-y-1.5 border-t px-2.5 py-1.5 lg:px-3">
          {workflowErrorMessage ? (
            <p className="text-[10px] text-destructive">{workflowErrorMessage}</p>
          ) : null}
          {showImportDebug ? (
            <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/5 p-2">
              <button
                type="button"
                aria-expanded={showRawResponse}
                className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/40"
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
          {(isExecuting || multiAgentActivities.length > 0) ? (
            <div className="max-h-28 overflow-y-auto rounded-md border border-violet-500/20 bg-violet-500/5 p-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                {copy.workflowMultiAgentActivity}
              </p>
              <ul className="space-y-1">
                {multiAgentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className={cn(
                      "rounded px-1.5 py-1 text-[10px]",
                      activity.status === "running" &&
                        "bg-violet-500/15 text-violet-950 dark:text-violet-100",
                      activity.status === "completed" &&
                        "bg-emerald-500/10 text-foreground/90",
                      activity.status === "failed" &&
                        "bg-destructive/10 text-destructive",
                      activity.status === "queued" &&
                        "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {activity.status === "running" ? (
                        <Loader2
                          className="h-3 w-3 shrink-0 animate-spin text-violet-600"
                          aria-hidden
                        />
                      ) : null}
                      <span className="font-medium">
                        {getMultiAgentLabel(activity.agentId, locale)}
                      </span>
                      <span className="text-muted-foreground">
                        · {activity.nodeLabel}
                      </span>
                    </div>
                    {activity.message ? (
                      <p className="mt-0.5 text-muted-foreground">
                        {activity.message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
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
                      log.status === "paused" &&
                        "bg-amber-500/10 text-amber-900 dark:text-amber-100",
                      log.status === "awaiting_approval" &&
                        "bg-amber-500/15 text-amber-900 dark:text-amber-100",
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
                      {log.agentId ? (
                        <span className="rounded bg-violet-500/15 px-1 py-0.5 text-[9px] font-medium text-violet-800 dark:text-violet-200">
                          {getMultiAgentLabel(log.agentId as MultiAgentId, locale)}
                        </span>
                      ) : null}
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
      ) : null}
        </>
      ) : null}

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

      <WorkflowApprovalDialog
        open={approvalDialogOpen}
        locale={locale}
        checkpoint={executionCheckpoint}
        isSubmitting={resumeSubmitting || isExecuting}
        onApprove={(note) => void handleResume("approve", note)}
        onReject={(note) => void handleResume("reject", note)}
      />

      <WorkflowErrorRecoveryDialog
        open={recoveryDialogOpen}
        locale={locale}
        checkpoint={executionCheckpoint}
        isSubmitting={resumeSubmitting || isExecuting}
        onAction={(action, note) => void handleResume(action, note)}
      />
    </aside>
  );
}

export const WorkflowPanel = memo(WorkflowPanelInner);