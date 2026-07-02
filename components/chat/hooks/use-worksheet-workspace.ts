"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import toast from "react-hot-toast";

import type { WorksheetWorkspaceState } from "@/components/chat/tools/worksheet/use-worksheet";
import { WORKSPACE_PERSIST_DEBOUNCE_MS } from "@/lib/client/debounce";
import {
  createEmptyWorksheet,
  type ChatSession,
} from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import {
  addGeneratedWorksheetDocument,
  areWorksheetWorkspaceSnapshotsEqual,
  createEmptyWorksheetWorkspace,
  hasWorksheetWorkspaceContent,
  normalizeWorksheetDocument,
  recordWorksheetDocumentVersion,
  syncWorkspaceLegacyFields,
} from "@/lib/worksheet-workspace";
import {
  resolveWorksheetTemplate,
  type WorksheetTemplate,
} from "@/lib/worksheet-templates";

/**
 * useWorksheetWorkspace — Pure Persist Layer (Fase 4 Final)
 *
 * Tanggung jawab:
 * - Persistensi mirror Worksheet ke ChatSession
 * - Inbound sync dari Tool Hook via `setWorksheetWorkspaceInbound`
 *
 * BUKAN pusat mutasi. Semua mutasi dokumen → `useWorksheet` (SSOT).
 *
 * Alur satu arah:
 *   Panel → useWorksheet → syncToPersistLayer → setWorksheetWorkspaceInbound → ChatSession
 *
 * Navigasi chat (bukan mutasi panel):
 *   hydrateFromChat → persist state + syncWorkspaceToTool (hydrateFromExternal)
 */
interface UseWorksheetWorkspaceOptions {
  locale: Locale;
  hydrated: boolean;
  currentChat: ChatSession | null;
  canPersistCurrentChatState: () => boolean;
  persistCurrentChat: (patch: Partial<Pick<ChatSession, "worksheet">>) => void;
  worksheetTemplateAppliedLabel: string;
  /** Outbound ke tool hook saat load chat / reset — bukan jalur mutasi panel. */
  syncWorkspaceToTool?: (workspace: WorksheetWorkspaceState) => void;
  /** Optional initial workspace snapshot from the tool hook. */
  getWorkspaceFromTool?: () => WorksheetWorkspaceState;
  /** Primary template apply — return true when handled by tool hook. */
  applyTemplateViaTool?: (template: WorksheetTemplate) => boolean;
  /** Primary clear-all — return true when handled by tool hook. */
  clearAllViaTool?: () => boolean;
}

export function useWorksheetWorkspace({
  locale,
  hydrated,
  currentChat,
  canPersistCurrentChatState,
  persistCurrentChat,
  worksheetTemplateAppliedLabel,
  syncWorkspaceToTool,
  getWorkspaceFromTool,
  applyTemplateViaTool,
  clearAllViaTool,
}: UseWorksheetWorkspaceOptions) {
  /** Mirror persist untuk ChatSession — runtime SSOT ada di useWorksheet. */
  const [worksheetWorkspace, setWorksheetWorkspaceState] =
    useState<WorksheetWorkspaceState>(() => {
      const fromTool = getWorkspaceFromTool?.();
      if (fromTool && (fromTool.documents?.length ?? 0) > 0) {
        return normalizeWorksheetDocument(fromTool, locale);
      }
      return createEmptyWorksheetWorkspace(locale);
    });
  const worksheetWorkspaceRef = useRef<WorksheetWorkspaceState>(
    createEmptyWorksheetWorkspace(locale),
  );
  const [lastWorksheetPrompt, setLastWorksheetPrompt] = useState("");
  const lastWorksheetPromptRef = useRef("");
  /**
   * LEGACY mirror untuk stream bridge fallback.
   * Runtime SSOT: `tools.worksheet.errorDetail` — jangan baca untuk UI.
   */
  const [worksheetErrorDetail, setWorksheetErrorDetail] = useState<
    string | null
  >(null);

  // LEGACY / FALLBACK — mutasi + echo ke tool hook. Jangan gunakan sebagai jalur utama.
  // Primary: mutasi via useWorksheet → syncToPersistLayer → setWorksheetWorkspaceInbound.
  const applyWorkspace = useCallback(
    (next: SetStateAction<WorksheetWorkspaceState>) => {
      setWorksheetWorkspaceState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        const synced = syncWorkspaceLegacyFields(resolved);
        worksheetWorkspaceRef.current = synced;
        syncWorkspaceToTool?.(synced);
        return synced;
      });
    },
    [syncWorkspaceToTool],
  ) as Dispatch<SetStateAction<WorksheetWorkspaceState>>;

  /**
   * Inbound mirror dari tool hook — update persist tanpa memicu hydrateFromExternal.
   * Dipasang via registerSyncToPersistLayer di chat-room.tsx.
   */
  const setWorksheetWorkspaceInbound = useCallback(
    (workspace: WorksheetWorkspaceState) => {
      const synced = syncWorkspaceLegacyFields(workspace);
      worksheetWorkspaceRef.current = synced;
      setWorksheetWorkspaceState((prev) => {
        if (areWorksheetWorkspaceSnapshotsEqual(prev, synced)) {
          return prev;
        }
        return synced;
      });
    },
    [],
  );

  useEffect(() => {
    worksheetWorkspaceRef.current = worksheetWorkspace;
  }, [worksheetWorkspace]);

  useEffect(() => {
    lastWorksheetPromptRef.current = lastWorksheetPrompt;
  }, [lastWorksheetPrompt]);

  useEffect(() => {
    if (!hydrated || !currentChat) return;
    if (!canPersistCurrentChatState()) return;

    const buildWorksheet = () =>
      hasWorksheetWorkspaceContent(worksheetWorkspace)
        ? syncWorkspaceLegacyFields({
            ...worksheetWorkspace,
            updatedAt: Date.now(),
          })
        : createEmptyWorksheet();

    const timer = window.setTimeout(() => {
      if (!canPersistCurrentChatState()) return;
      persistCurrentChat({ worksheet: buildWorksheet() });
    }, WORKSPACE_PERSIST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      if (canPersistCurrentChatState()) {
        persistCurrentChat({ worksheet: buildWorksheet() });
      }
    };
  }, [
    canPersistCurrentChatState,
    currentChat,
    hydrated,
    persistCurrentChat,
    worksheetWorkspace,
  ]);

  /** Load worksheet dari ChatSession — outbound ke tool hook, bukan mutasi panel. */
  const hydrateFromChat = useCallback(
    (chat: ChatSession) => {
      const worksheet = normalizeWorksheetDocument(chat.worksheet, locale);
      worksheetWorkspaceRef.current = worksheet;
      setWorksheetWorkspaceState(worksheet);
      syncWorkspaceToTool?.(worksheet);
      setWorksheetErrorDetail(null);

      const lastUserMessage = [...chat.messages]
        .reverse()
        .find((message) => message.role === "user");
      setLastWorksheetPrompt(lastUserMessage?.content?.trim() ?? "");
    },
    [locale, syncWorkspaceToTool],
  );

  const resetForNewChat = useCallback(() => {
    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetWorkspaceState(emptyWorksheet);
    syncWorkspaceToTool?.(emptyWorksheet);
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
  }, [locale, syncWorkspaceToTool]);

  // LEGACY / FALLBACK — prefer onWorksheetChange via setWorksheetWorkspaceInbound (panel props).
  const handleWorksheetChange = useCallback(
    (workspace: WorksheetWorkspaceState) => {
      applyWorkspace(workspace);
    },
    [applyWorkspace],
  );

  // LEGACY / FALLBACK — prefer tools.worksheet.applyTemplate via panel props.
  const handleWorksheetApplyTemplate = useCallback(
    (template: WorksheetTemplate) => {
      if (applyTemplateViaTool?.(template)) {
        toast.success(worksheetTemplateAppliedLabel);
        return;
      }

      const { title, content } = resolveWorksheetTemplate(template, locale);

      applyWorkspace((prev) => {
        const documentId = prev.activeDocumentId;
        const next = documentId
          ? recordWorksheetDocumentVersion(prev, documentId, {
              title,
              content,
              source: "template",
            })
          : addGeneratedWorksheetDocument(
              prev,
              { title, content },
              { activate: true },
            );
        return syncWorkspaceLegacyFields(next);
      });
      toast.success(worksheetTemplateAppliedLabel);
    },
    [
      applyTemplateViaTool,
      applyWorkspace,
      locale,
      worksheetTemplateAppliedLabel,
    ],
  );

  // LEGACY / FALLBACK — prefer tools.worksheet.clearAllDocuments via panel props.
  const handleWorksheetClear = useCallback(() => {
    if (clearAllViaTool?.()) {
      setWorksheetErrorDetail(null);
      setLastWorksheetPrompt("");
      return;
    }

    const emptyWorksheet = normalizeWorksheetDocument(
      createEmptyWorksheet(),
      locale,
    );
    worksheetWorkspaceRef.current = emptyWorksheet;
    setWorksheetWorkspaceState(emptyWorksheet);
    syncWorkspaceToTool?.(emptyWorksheet);
    setWorksheetErrorDetail(null);
    setLastWorksheetPrompt("");
    persistCurrentChat({ worksheet: createEmptyWorksheet() });
  }, [clearAllViaTool, locale, persistCurrentChat, syncWorkspaceToTool]);

  return {
    worksheetWorkspace,
    /** LEGACY / FALLBACK alias untuk applyWorkspace — stream bridge & chat handlers. */
    setWorksheetWorkspace: applyWorkspace,
    setWorksheetWorkspaceInbound,
    worksheetWorkspaceRef,
    lastWorksheetPrompt,
    setLastWorksheetPrompt,
    lastWorksheetPromptRef,
    worksheetErrorDetail,
    setWorksheetErrorDetail,
    hydrateFromChat,
    resetForNewChat,
    handleWorksheetChange,
    handleWorksheetApplyTemplate,
    handleWorksheetClear,
  };
}