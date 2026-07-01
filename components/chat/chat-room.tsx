"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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

const ChatEmptyState = dynamic(
  () =>
    import("@/components/chat/chat-empty-state").then((mod) => ({
      default: mod.ChatEmptyState,
    })),
);

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
import { RightSidebar } from "@/components/chat/right-sidebar";
import { DesktopToolPanel } from "@/components/chat/desktop-tool-panel";
import { RightToolsRail } from "@/components/chat/right-tools-rail";
import { useChatFontSize } from "@/lib/chat-font-prefs";
import { cn } from "@/lib/utils";


function ChatRoomContent() {
  const { locale, openHandoff, closeHandoff } = useChatContext();
  const { displayName, avatarUrl, isLoading: profileLoading } = useUserProfile();
  const copy = COPY[locale];
  const { expanded: sidebarExpanded, setExpanded: setSidebarExpanded } =
    useSidebarExpanded();
  const { prefs } = useVoicePrefs();
  const { fontSize: chatFontSize } = useChatFontSize();
  const { speak } = useSpeechSynthesis();
  const appFeatures = useAppFeatures();
  const webSearchAvailable = Boolean(
    appFeatures?.webSearchAvailable && appFeatures?.features.webSearch,
  );

  const tools = useToolsCoordinator({
    webSearchAvailable,
    researchAvailable: webSearchAvailable,
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
  const rightPanelSheetOpen = Boolean(tools.activePanel) && isMobileViewport;

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
    copy: {
      errors: copy.errors,
      worksheetCreated: copy.worksheetCreated,
      workflowCreated: copy.workflowCreated,
      workflowEdited: copy.workflowEdited,
    },
  });

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

  useEffect(() => {
    if (!rightPanelSheetOpen) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  }, [rightPanelSheetOpen]);

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
        className="ida-chat-shell flex h-full min-h-0 w-full max-w-full overflow-hidden bg-background font-sans"
        data-chat-font-size={chatFontSize}
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
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2.5 pt-4 pb-3 sm:px-5 sm:py-4 lg:px-8 lg:py-6"
          >
              <div className="ida-message-width mx-auto flex w-full flex-col gap-[calc(1.5rem*var(--ida-gap-scale))]">
                {!hasUserMessages && <ChatEmptyState locale={locale} />}

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
                      onOpenWorkflowPanel={() => {
                        tools.workflow.setEnabled(true);
                        tools.openPanel(tools.workflow.panelId);
                      }}
                      onOpenWorksheetPanel={() => {
                        tools.activateWorksheet();
                      }}
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
                  tools.toggleWebSearchInternet(!isMobileViewport)
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

          <RightToolsRail
            locale={locale}
            railGroups={tools.railGroups}
            onRailClick={tools.handleRailClick}
            className="relative z-10 hidden shrink-0 md:flex"
          />

          {tools.activePanel ? (
            <DesktopToolPanel className="relative z-10 hidden md:flex">
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

      <Sheet
        open={rightPanelSheetOpen}
        modal
        onOpenChange={(open) => {
          if (!open) tools.collapsePanel();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(100vw,26rem)] max-w-full gap-0 overflow-hidden border-l p-0 shadow-xl"
        >
          {tools.activePanel ? (
            <RightSidebar
              key={currentChat?.id}
              {...sharedToolPanelProps}
              panel={tools.activePanel}
              embedded
            />
          ) : null}
        </SheetContent>
      </Sheet>

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

      <HandoffDialog />
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
