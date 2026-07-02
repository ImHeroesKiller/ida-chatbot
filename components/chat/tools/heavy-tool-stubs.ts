import { TOOL_PANEL_IDS } from "@/components/chat/tools/tool-panel-ids";
import type { WorkflowTool } from "@/components/chat/tools/use-workflow";
import type { WorksheetTool } from "@/components/chat/tools/worksheet/use-worksheet";
import {
  createEmptyWorkflowWorkspace,
  type WorkflowWorkspace,
} from "@/lib/workflow";
import { createEmptyWorksheetWorkspace } from "@/lib/worksheet-workspace";

const noop = () => undefined;

function createEmptyWorksheetWorkspaceSnapshot() {
  return createEmptyWorksheetWorkspace("id");
}

function createEmptyWorkflowWorkspaceSnapshot(): WorkflowWorkspace {
  return createEmptyWorkflowWorkspace();
}

/** Lightweight stand-ins until worksheet/workflow hooks load. */
export function createWorksheetToolStub(): WorksheetTool {
  const workspace = createEmptyWorksheetWorkspaceSnapshot();

  return {
    panelId: TOOL_PANEL_IDS.worksheet,
    isEnabled: false,
    isPanelOpen: false,
    quota: { remaining: 0, limit: 0, resetsAt: null },
    locale: "id",
    workspace,
    documents: [],
    activeDocumentId: null,
    isGenerating: false,
    errorDetail: null,
    setLocale: noop,
    getWorkspace: () => workspace,
    setWorkspace: noop,
    updateWorkspace: () => workspace,
    hydrateFromExternal: noop,
    syncWorkspaceFromExternal: noop,
    syncToPersistLayer: noop,
    registerSyncToPersistLayer: () => noop,
    setDocuments: noop,
    setActiveDocumentId: noop,
    setIsGenerating: noop,
    setGenerating: noop,
    createDocument: () => null,
    createDocumentFromStream: () => null,
    regenerateDocumentFromStream: () => null,
    beginRegenerate: noop,
    setErrorDetail: noop,
    clearErrorDetail: noop,
    getErrorDetail: () => null,
    applyStreamError: () => workspace,
    updateDocument: () => workspace,
    recordDocumentVersion: () => workspace,
    saveDocumentChanges: () => workspace,
    markDocumentAsExported: () => workspace,
    updateDocumentLetterhead: () => workspace,
    applyTemplate: () => null,
    clearAllDocuments: () => workspace,
    selectDocument: () => workspace,
    deleteDocument: () => workspace,
    resetWorkspace: () => workspace,
    setEnabled: noop,
    toggleTool: noop,
    openPanel: noop,
    closePanel: noop,
    hydrate: noop,
    resetForNewChat: noop,
  } as unknown as WorksheetTool;
}

export function createWorkflowToolStub(): WorkflowTool {
  const workspace = createEmptyWorkflowWorkspaceSnapshot();

  return {
    panelId: TOOL_PANEL_IDS.workflow,
    isEnabled: false,
    isPanelOpen: false,
    quota: { remaining: 0, limit: 0, resetsAt: null },
    workspace,
    isExecuting: false,
    errorDetail: null,
    getWorkspace: () => workspace,
    setWorkspace: noop,
    updateWorkspace: () => workspace,
    hydrateFromExternal: noop,
    syncToPersistLayer: noop,
    registerSyncToPersistLayer: () => noop,
    registerToolCoordinatorBridge: () => noop,
    setActiveWorkflowId: noop,
    selectWorkflow: noop,
    createWorkflow: () => null,
    updateWorkflow: () => workspace,
    addNode: () => workspace,
    beginRegenerate: noop,
    importWorkflowFromStream: () => null,
    lastGeneratedWorkflowSource: null,
    setLastGeneratedWorkflowSource: noop,
    hasImportableGeneratedWorkflow: () => false,
    importLatestGeneratedWorkflow: () => null,
    applyStreamError: () => workspace,
    executeWorkflow: async () => undefined,
    resumeWorkflow: async () => undefined,
    executionCheckpoint: null,
    clearExecutionCheckpoint: noop,
    buildWorkflowChatContext: () => "",
    setChatDiscoveryPending: noop,
    deleteWorkflow: () => workspace,
    deleteNode: () => workspace,
    applyTemplate: () => workspace,
    exportActiveWorkflowJson: () => null,
    importWorkflowJson: () => null,
    resetWorkspace: () => workspace,
    setEnabled: noop,
    toggleTool: noop,
    openPanel: noop,
    closePanel: noop,
    hydrate: noop,
    resetForNewChat: noop,
    setErrorDetail: noop,
    clearErrorDetail: noop,
  } as unknown as WorkflowTool;
}