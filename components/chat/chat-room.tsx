"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeaderAccountButton } from "@/components/chat/header-account-button";
import { ChatHeader } from "@/components/chat/header";
import { ChatHeaderMobileRedesign } from "@/components/chat/header-mobile-redesign";
import { useUserProfile } from "@/lib/auth/use-user-profile";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { ScrollToBottomButton } from "@/components/chat/scroll-to-bottom";
import { SidebarSkeleton } from "@/components/chat/sidebar-skeleton";

const ChatSidebar = dynamic(
  () =>
    import("@/components/chat/sidebar").then((mod) => ({
      default: mod.ChatSidebar,
    })),
  { loading: () => <SidebarSkeleton expanded={false} className="h-full w-14" /> },
);

const ChatComposer = dynamic(
  () =>
    import("@/components/chat/chat-composer").then((mod) => ({
      default: mod.ChatComposer,
    })),
  {
    loading: () => (
      <div className="shrink-0 border-t px-3 py-3 sm:px-5">
        <div className="ida-message-width mx-auto h-12 rounded-2xl bg-muted/40" />
      </div>
    ),
  },
);

const ChatComposerRedesign = dynamic(
  () =>
    import("@/components/chat/chat-composer-redesign").then((mod) => ({
      default: mod.ChatComposerRedesign,
    })),
  {
    loading: () => (
      <div className="shrink-0 border-t px-3 py-3 sm:px-5">
        <div className="ida-message-width mx-auto h-12 rounded-2xl bg-muted/40" />
      </div>
    ),
  },
);

import { useDeferredReady } from "@/lib/client/use-deferred-ready";

const HandoffDialog = dynamic(
  () =>
    import("@/components/chat/handoff-dialog").then((mod) => ({
      default: mod.HandoffDialog,
    })),
  { ssr: false },
);

import { useChatContext } from "@/components/chat/chat-provider";
import { useChatMessages } from "@/components/chat/hooks/use-chat-messages";
import { useChatScroll } from "@/components/chat/hooks/use-chat-scroll";
import { useChatSend } from "@/components/chat/hooks/use-chat-send";
import { useChatSessionRefs } from "@/components/chat/hooks/use-chat-session-refs";
import { useChatSessionSync } from "@/components/chat/hooks/use-chat-session-sync";
import { useChatToolPanelProps } from "@/components/chat/hooks/use-chat-tool-panel-props";
import { useWorksheetWorkspace } from "@/components/chat/hooks/use-worksheet-workspace";
import { useWorkflowWorkspace } from "@/components/chat/tools/use-workflow-workspace";
import { useToolsCoordinator } from "@/components/chat/tools/use-tools-coordinator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HeavyToolsDesktopDialog } from "@/components/chat/heavy-tools-desktop-dialog";
import { useDesktopSidebar } from "@/lib/client/use-desktop-sidebar";
import { useHeavyToolsDesktop } from "@/lib/client/use-heavy-tools-desktop";
import { useIsMobileViewport } from "@/lib/client/use-media-query";
import { useAppFeatures } from "@/lib/client/use-app-features";
import { useChatStore } from "@/lib/chat-store";
import { IDA_CONFIG } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { MessageReactionsProvider } from "@/lib/message-reactions";
import { useSidebarExpanded } from "@/lib/sidebar-prefs";
import {
  SpeechSynthesisProvider,
  useSpeechSynthesis,
} from "@/lib/voice/use-speech-synthesis";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
const RightSidebar = dynamic(
  () =>
    import("@/components/chat/right-sidebar").then((mod) => ({
      default: mod.RightSidebar,
    })),
  { ssr: false },
);

const DesktopToolPanel = dynamic(
  () =>
    import("@/components/chat/desktop-tool-panel").then((mod) => ({
      default: mod.DesktopToolPanel,
    })),
  { ssr: false },
);

const RightToolsRail = dynamic(
  () =>
    import("@/components/chat/right-tools-rail").then((mod) => ({
      default: mod.RightToolsRail,
    })),
  { ssr: false },
);
import { useChatFontSize } from "@/lib/chat-font-prefs";
import { cn } from "@/lib/utils";


function ChatRoomContent() {
  const deferredToolsReady = useDeferredReady();
  const { locale, openHandoff, closeHandoff } = useChatContext();
  const { displayName, avatarUrl, isLoading: profileLoading } = useUserProfile();
  const copy = COPY[locale];
  const { expanded: sidebarExpanded, setExpanded: setSidebarExpanded } =
    useSidebarExpanded();
  const { prefs } = useVoicePrefs();
  const { fontSize: chatFontSize } = useChatFontSize();
  const { speak } = useSpeechSynthesis();
  const appFeatures = useAppFeatures();
  const { allowed: heavyToolsDesktop } = useHeavyToolsDesktop();
  const desktopSidebar = useDesktopSidebar();
  const webSearchAvailable = Boolean(
    appFeatures?.webSearchAvailable && appFeatures?.features.webSearch,
  );

  const tools = useToolsCoordinator({
    webSearchAvailable,
    researchAvailable: webSearchAvailable,
    locale,
    heavyToolsDesktop,
    desktopSidebar,
  });

  const {
    hydrated,
    apiUserId,
    currentChat,
    sessions,
    switchChat,
    createChat,
    pinChat,
    renameChat,
    deleteChat,
    clearAllChats,
    persistCurrentChat,
  } = useChatStore(locale);



  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobileViewport = useIsMobileViewport();

  const {
    messages,
    setMessages,
    visibleMessages,
    hasUserMessages,
    lastAssistantMessageId,
    lastUserMessageId,
    editingMessageId,
    setEditingMessageId,
  } = useChatMessages();

  useEffect(() => {
    if (!hydrated || !hasUserMessages) {
      delete document.documentElement.dataset.chatReady;
      return;
    }

    document.documentElement.dataset.chatReady = "true";
    return () => {
      delete document.documentElement.dataset.chatReady;
    };
  }, [hasUserMessages, hydrated]);

  const sessionRefs = useChatSessionRefs(currentChat);

  const worksheet = useWorksheetWorkspace({
    locale,
    hydrated,
    currentChat,
    canPersistCurrentChatState: sessionRefs.canPersistCurrentChatState,
    persistCurrentChat,
    worksheetTemplateAppliedLabel: copy.worksheetTemplateApplied,
    syncWorkspaceToTool: tools.worksheet.hydrateFromExternal,
    getWorkspaceFromTool: tools.worksheet.getWorkspace,
    applyTemplateViaTool: (template) =>
      tools.worksheet.applyTemplate(template) !== null,
    clearAllViaTool: () => {
      tools.worksheet.clearAllDocuments();
      return true;
    },
  });

  // Tool hook → persist layer (satu arah, tanpa echo hydrateFromExternal).
  const setWorksheetWorkspaceInboundRef = useRef(
    worksheet.setWorksheetWorkspaceInbound,
  );
  setWorksheetWorkspaceInboundRef.current =
    worksheet.setWorksheetWorkspaceInbound;

  useEffect(() => {
    tools.worksheet.registerSyncToPersistLayer((workspace) => {
      setWorksheetWorkspaceInboundRef.current(workspace);
    });
    return () => {
      tools.worksheet.registerSyncToPersistLayer(null);
    };
  }, [tools.worksheet.registerSyncToPersistLayer]);

  const workflowWorkspace = useWorkflowWorkspace({
    hydrated,
    currentChat,
    canPersistCurrentChatState: sessionRefs.canPersistCurrentChatState,
    persistCurrentChat,
    syncWorkspaceToTool: tools.workflow.hydrateFromExternal,
    getWorkspaceFromTool: tools.workflow.getWorkspace,
  });

  const setWorkflowWorkspaceInboundRef = useRef(
    workflowWorkspace.setWorkflowWorkspaceInbound,
  );
  setWorkflowWorkspaceInboundRef.current =
    workflowWorkspace.setWorkflowWorkspaceInbound;

  useEffect(() => {
    tools.workflow.registerSyncToPersistLayer((workspace) => {
      setWorkflowWorkspaceInboundRef.current(workspace);
    });
    return () => {
      tools.workflow.registerSyncToPersistLayer(null);
    };
  }, [tools.workflow.registerSyncToPersistLayer]);

  useEffect(() => {
    tools.workflow.registerToolCoordinatorBridge({
      tools,
      locale,
      getWorksheetWorkspace: () => worksheet.worksheetWorkspaceRef.current,
      persistCurrentChat,
    });
    return () => {
      tools.workflow.registerToolCoordinatorBridge(null);
    };
  }, [
    locale,
    persistCurrentChat,
    tools,
    worksheet.worksheetWorkspaceRef,
  ]);

  const chatSend = useChatSend({
    locale,
    apiUserId,
    currentChat,
    messages,
    setMessages,
    tools,
    sessionRefs,
    persistCurrentChat,
    worksheetWorkspaceRef: worksheet.worksheetWorkspaceRef,
    setLastWorksheetPrompt: worksheet.setLastWorksheetPrompt,
    setWorksheetWorkspace: worksheet.setWorksheetWorkspace,
    setWorksheetErrorDetail: worksheet.setWorksheetErrorDetail,
    lastWorksheetPromptRef: worksheet.lastWorksheetPromptRef,
    setEditingMessageId,
    openHandoff,
    autoSpeakEnabled:
      appFeatures?.features.autoSpeak !== false && prefs.autoSpeak,
    speak,
    isMobileViewport,
    desktopSidebar,
    heavyToolsDesktop,
    copy: {
      errors: copy.errors,
      worksheetCreated: copy.worksheetCreated,
      workflowCreated: copy.workflowCreated,
      workflowEdited: copy.workflowEdited,
    },
  });

  const handleOpenWorkflowPanel = useCallback(() => {
    tools.workflow.setEnabled(true);
    tools.openPanel(tools.workflow.panelId);
  }, [tools]);

  const handleOpenWorksheetPanel = useCallback(() => {
    tools.activateWorksheet();
  }, [tools]);

  const { handleSelectChat, handleNewChat } = useChatSessionSync({
    hydrated,
    currentChat,
    sessions,
    switchChat,
    createChat,
    persistCurrentChat,
    messages,
    isLoading: chatSend.isLoading,
    tools,
    sessionRefs,
    setMessages,
    setInput: chatSend.setInput,
    setError: chatSend.setError,
    setStreamingMessageId: chatSend.setStreamingMessageId,
    setIsLoading: chatSend.setIsLoading,
    setEditingMessageId,
    worksheetWorkspaceRef: worksheet.worksheetWorkspaceRef,
    hydrateWorksheetFromChat: (chat) => {
      // hydrateFromChat sudah memanggil syncWorkspaceToTool (hydrateFromExternal).
      worksheet.hydrateFromChat(chat);
      tools.worksheet.hydrate({
        enabled: tools.worksheet.isEnabled,
        panelOpen: tools.worksheet.isPanelOpen,
        locale,
        isGenerating: false,
        errorDetail: null,
      });
    },
    hydrateWorkflowFromChat: (chat) => {
      workflowWorkspace.hydrateFromChat(chat);
      tools.workflow.hydrate({
        enabled: tools.workflow.isEnabled,
        panelOpen: tools.workflow.isPanelOpen,
        workspace: chat.workflow,
        isExecuting: false,
      });
    },
    workflowWorkspaceRef: workflowWorkspace.workflowWorkspaceRef,
    resetWorksheetForNewChat: worksheet.resetForNewChat,
    resetWorkflowForNewChat: workflowWorkspace.resetForNewChat,
    onAfterSelectChat: () => setMobileSidebarOpen(false),
    onAfterNewChat: () => setMobileSidebarOpen(false),
  });

  const { scrollContainerRef, messagesEndRef, showScrollButton, scrollToBottom } =
    useChatScroll({
      messages,
      isLoading: chatSend.isLoading,
      hydrated,
      currentChatId: currentChat?.id,
    });

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (tools.activePanel) {
        tools.collapsePanel();
        return;
      }

      setMobileSidebarOpen(false);
      closeHandoff();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeHandoff, tools]);

  const { sharedToolPanelProps } = useChatToolPanelProps({
    locale,
    tools,
    isLoading: chatSend.isLoading,
    apiSessionId: currentChat?.apiSessionId,
    worksheet,
    setInput: chatSend.setInput,
    persistCurrentChat,
    sendMessage: chatSend.sendMessage,
    copy: {
      researchSessionSaved: copy.researchSessionSaved,
      worksheetCreated: copy.worksheetCreated,
    },
  });

  const sidebarProps = {
    sessions,
    currentChatId: currentChat?.id ?? "",
    locale,
    loading: !hydrated,
    onSelect: handleSelectChat,
    onPin: pinChat,
    onRename: renameChat,
    onDelete: deleteChat,
    onClearAll: clearAllChats,
    onNewChat: handleNewChat,
  };

  return (
    <MessageReactionsProvider>
      <div
        className="ida-chat-shell flex h-full min-h-0 w-full max-w-full overflow-hidden bg-transparent font-sans"
        data-chat-font-size={chatFontSize}
        data-panel-open={tools.activePanel ? "" : undefined}
        data-sidebar-collapsed={!sidebarExpanded ? "" : undefined}
        role="application"
        aria-label={copy.windowLabel}
      >
        <ChatSidebar
          {...sidebarProps}
          expanded={sidebarExpanded}
          onExpand={() => setSidebarExpanded(true)}
          onCollapse={() => setSidebarExpanded(false)}
          className="hidden shrink-0 border-r md:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
              isMobileViewport && "pt-16",
            )}
          >
          {isMobileViewport ? (
            <ChatHeaderMobileRedesign
              title={currentChat?.title ?? IDA_CONFIG.name}
              openSessionsLabel={copy.openSessions}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              accountButton={
                <HeaderAccountButton
                  label={copy.account}
                  displayName={profileLoading ? undefined : displayName}
                  avatarUrl={avatarUrl}
                  loading={profileLoading}
                />
              }
            />
          ) : (
            <ChatHeader
              title={currentChat?.title ?? IDA_CONFIG.name}
              subtitle={copy.subtitle}
              openSessionsLabel={copy.openSessions}
              newChatLabel={copy.newChat}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              onNewChat={handleNewChat}
              accountButton={
                <HeaderAccountButton
                  label={copy.account}
                  displayName={profileLoading ? undefined : displayName}
                  avatarUrl={avatarUrl}
                  loading={profileLoading}
                />
              }
            />
          )}

          <div
            ref={scrollContainerRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2.5 pt-3 pb-2 sm:px-4 sm:py-3 lg:px-5 lg:py-3"
          >
              <div
                className={cn(
                  "ida-message-width mx-auto flex w-full flex-col gap-[calc(1.125rem*var(--ida-gap-scale))]",
                  !hasUserMessages && "min-h-full flex-1 justify-center py-8 sm:py-10",
                )}
              >
                {visibleMessages.map((message) => {
                  const isStreaming = message.id === chatSend.streamingMessageId;
                  const isEmptyStreaming =
                    isStreaming && message.content.length === 0;

                  if (isEmptyStreaming) {
                    return <MessageSkeleton key={message.id} />;
                  }

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      locale={locale}
                      isStreaming={isStreaming}
                      isLastAssistant={message.id === lastAssistantMessageId}
                      isLastUser={message.id === lastUserMessageId}
                      isEditing={editingMessageId === message.id}
                      onRegenerate={chatSend.handleRegenerate}
                      onEdit={chatSend.handleEditMessage}
                      onCancelEdit={chatSend.handleCancelEdit}
                      onSubmitEdit={chatSend.handleSubmitEdit}
                      onOpenWorkflowPanel={handleOpenWorkflowPanel}
                      onOpenWorksheetPanel={handleOpenWorksheetPanel}
                    />
                  );
                })}

                <div ref={messagesEndRef} className="h-px" aria-hidden />
              </div>

            <ScrollToBottomButton
              visible={showScrollButton}
              locale={locale}
              onClick={() => scrollToBottom("smooth")}
            />
          </div>

          {chatSend.error && (
            <p className="shrink-0 px-3 pb-2 text-center text-xs text-destructive sm:px-5">
              {chatSend.error}
            </p>
          )}

          <div className="relative z-30 shrink-0">
            {isMobileViewport ? (
              <ChatComposerRedesign
                key={currentChat?.id}
                locale={locale}
                sessionId={currentChat?.apiSessionId}
                input={chatSend.input}
                isLoading={chatSend.isLoading}
                webSearchAvailable={tools.webSearchAvailable}
                researchAvailable={tools.researchAvailable}
                isToolActive={tools.isToolActive}
                isAnyToolActive={tools.isAnyToolActive}
                onToolMenuClick={tools.handleMenuToolClick}
                onInternetToggle={() =>
                  tools.toggleWebSearchInternet(desktopSidebar)
                }
                onInputChange={chatSend.setInput}
                onSend={(content, options) =>
                  void chatSend.sendMessage(content, options)
                }
              />
            ) : (
              <ChatComposer
                key={currentChat?.id}
                locale={locale}
                sessionId={currentChat?.apiSessionId}
                input={chatSend.input}
                isLoading={chatSend.isLoading}
                webSearchAvailable={tools.webSearchAvailable}
                researchAvailable={tools.researchAvailable}
                isToolActive={tools.isToolActive}
                isAnyToolActive={tools.isAnyToolActive}
                onToolMenuClick={tools.handleMenuToolClick}
                onInputChange={chatSend.setInput}
                onSend={(content, options) =>
                  void chatSend.sendMessage(content, options)
                }
              />
            )}
          </div>
          </div>

          {deferredToolsReady ? (
            <RightToolsRail
              locale={locale}
              railGroups={tools.railGroups}
              onRailClick={tools.handleRailClick}
              className="relative z-10 hidden shrink-0 lg:flex"
            />
          ) : null}

          {deferredToolsReady && tools.activePanel ? (
            <DesktopToolPanel className="relative z-10 hidden lg:flex">
              <RightSidebar
                key={`${currentChat?.id}-${tools.activePanel}`}
                {...sharedToolPanelProps}
                panel={tools.activePanel}
                className="h-full"
              />
            </DesktopToolPanel>
          ) : null}
        </div>
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[min(88vw,300px)] max-w-full gap-0 overflow-hidden p-0 [&>button]:h-10 [&>button]:w-10"
        >
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-sm">{copy.sessionsLabel}</SheetTitle>
          </SheetHeader>
          <ChatSidebar
            {...sidebarProps}
            expanded
            className="h-[calc(100%-3.5rem)] w-full"
          />
        </SheetContent>
      </Sheet>

      {deferredToolsReady ? <HandoffDialog /> : null}
      <HeavyToolsDesktopDialog locale={locale} />
    </MessageReactionsProvider>
  );
}

export function ChatRoom() {
  return (
    <SpeechSynthesisProvider>
      <ChatRoomContent />
    </SpeechSynthesisProvider>
  );
}
