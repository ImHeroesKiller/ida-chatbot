"use client";

import { Loader2, Mic, Send, Plus, Settings2, Globe } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { ToolsMenu } from "@/components/chat/tools-menu";
import { VoiceWaveform } from "@/components/chat/voice-waveform";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildAttachmentMessageContent } from "@/lib/client/build-attachment-message";
import { FOCUS_CHAT_COMPOSER_EVENT } from "@/lib/client/focus-chat-composer";
import {
  VisionExtractError,
  extractVisionFromFile,
} from "@/lib/client/extract-vision";
import {
  createImagePreview,
  isAcceptedUploadType,
  readFileAsBase64,
} from "@/lib/client/file-utils";
import { useAppFeatures } from "@/lib/client/use-app-features";
import { IDA_CONFIG, type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";

import type { IdaAttachment, IdaAttachmentType } from "@/lib/types";
import { getVoiceErrorMessage } from "@/lib/voice/voice-error-copy";
import { useVoiceInput } from "@/lib/voice/use-voice-input";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import { cn } from "@/lib/utils";

function createAttachmentId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PendingUpload {
  id: string;
  type: IdaAttachmentType;
  fileName: string;
  mimeType: string;
  previewDataUrl?: string;
  dataBase64: string;
}

interface ChatComposerRedesignProps {
  locale: Locale;
  sessionId?: string;
  input: string;
  isLoading: boolean;
  webSearchAvailable: boolean;
  researchAvailable: boolean;
  isToolActive: (toolId: import("@/components/chat/tools/types").ToolId) => boolean;
  isAnyToolActive: boolean;
  onToolMenuClick: (toolId: import("@/components/chat/tools/types").ToolId) => void;
  onInternetToggle: () => void;
  onInputChange: (value: string) => void;
  onSend: (content: string, options?: {
    attachment?: IdaAttachment;
    isVoiceNote?: boolean;
    caption?: string;
  }) => void;
}

function inferFileType(mimeType: string): IdaAttachmentType {
  return mimeType === "application/pdf" ? "pdf" : "image";
}

export function ChatComposerRedesign({
  locale,
  sessionId,
  input,
  isLoading,
  webSearchAvailable,
  researchAvailable,
  isToolActive,
  isAnyToolActive,
  onToolMenuClick,
  onInternetToggle,
  onInputChange,
  onSend,
}: ChatComposerRedesignProps) {
  const copy = COPY[locale];
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const sendingRef = useRef(false);
  const skipVoiceAutoSendRef = useRef(false);
  const holdingMicRef = useRef(false);

  const { prefs } = useVoicePrefs();
  const appFeatures = useAppFeatures();
  const voiceEnabled = appFeatures?.features.voice !== false;

  const isInternetOn = isToolActive("web-search");

  const resolveOcrError = useCallback(
    (err: unknown): string => {
      if (err instanceof VisionExtractError) {
        switch (err.code) {
          case "rate_limit":
            return copy.errors.rateLimit;
          case "empty":
            return copy.ocrEmpty;
          case "network":
            return copy.ocrNetworkError;
          case "config":
            return copy.ocrUnavailable;
          default:
            return copy.ocrFailed;
        }
      }
      return copy.ocrFailed;
    },
    [copy],
  );

  const performSend = useCallback(
    async (rawText: string) => {
      if (sendingRef.current) return;

      const text = rawText.trim();
      if (!text && !pendingUpload) return;
      if (isLoading || isExtracting) return;

      sendingRef.current = true;

      let attachment: IdaAttachment | undefined;

      if (pendingUpload) {
        setIsExtracting(true);

        try {
          const result = await extractVisionFromFile({
            data: pendingUpload.dataBase64,
            mimeType: pendingUpload.mimeType,
            fileName: pendingUpload.fileName,
            locale,
            sessionId,
          });

          attachment = {
            id: pendingUpload.id,
            type: result.fileType,
            fileName: result.fileName,
            mimeType: pendingUpload.mimeType,
            previewDataUrl: pendingUpload.previewDataUrl,
            extractedText: result.extractedText,
            summary: result.summary,
          };
        } catch (err) {
          toast.error(resolveOcrError(err), { duration: 5000 });
          sendingRef.current = false;
          setIsExtracting(false);
          return;
        } finally {
          setIsExtracting(false);
        }
      }

      const content = attachment
        ? buildAttachmentMessageContent(text, attachment, locale)
        : text;

      onSend(content, {
        attachment,
        isVoiceNote: prefs.sendAsVoiceNote && hasVoiceInput,
        caption: attachment ? text : undefined,
      });

      onInputChange("");
      setPendingUpload(null);
      setHasVoiceInput(false);
      setToolsMenuOpen(false);
      sendingRef.current = false;

      window.setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [
      hasVoiceInput,
      isExtracting,
      isLoading,
      locale,
      onInputChange,
      onSend,
      pendingUpload,
      prefs.sendAsVoiceNote,
      resolveOcrError,
      sessionId,
    ],
  );

  const handleTranscriptionComplete = useCallback(
    (text: string) => {
      onInputChange(text);
      setHasVoiceInput(true);

      if (!prefs.reviewVoiceBeforeSend && !skipVoiceAutoSendRef.current) {
        void performSend(text);
        return;
      }

      window.setTimeout(() => {
        textareaRef.current?.focus();
        const length = text.length;
        textareaRef.current?.setSelectionRange(length, length);
      }, 50);
    },
    [onInputChange, performSend, prefs.reviewVoiceBeforeSend],
  );

  const {
    isSupported: speechSupported,
    isListening,
    error: speechError,
    waveformLevels,
    startListening,
    stopListening,
    isTranscribing,
  } = useVoiceInput(locale, sessionId, {
    onTranscriptionComplete: handleTranscriptionComplete,
  });

  const voiceErrorMessage = getVoiceErrorMessage(locale, speechError);

  const handleSend = async () => {
    if (isTranscribing || isListening) return;
    await performSend(input.trim());
  };

  const handleMicRelease = useCallback(async () => {
    if (!holdingMicRef.current) return;
    holdingMicRef.current = false;
    skipVoiceAutoSendRef.current = false;
    await stopListening();
  }, [stopListening]);

  const handleMicPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (
        !speechSupported ||
        isLoading ||
        isExtracting ||
        isTranscribing ||
        isListening
      ) {
        return;
      }

      event.preventDefault();
      holdingMicRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      void startListening();
    },
    [
      isExtracting,
      isListening,
      isLoading,
      isTranscribing,
      speechSupported,
      startListening,
    ],
  );

  const handleMicPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      void handleMicRelease();
    },
    [handleMicRelease],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    if (event.metaKey || event.ctrlKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  };

  const handleFileSelect = async (file: File) => {
    if (!isAcceptedUploadType(file.type)) {
      toast.error(copy.uploadUnsupported);
      return;
    }

    if (file.size > IDA_CONFIG.maxUploadBytes) {
      toast.error(copy.uploadTooLarge);
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      let previewDataUrl: string | undefined;

      if (file.type.startsWith("image/")) {
        previewDataUrl = await createImagePreview(
          file,
          IDA_CONFIG.maxUploadPreviewDimension,
        );
      }

      setPendingUpload({
        id: createAttachmentId(),
        type: inferFileType(file.type),
        fileName: file.name,
        mimeType: file.type,
        previewDataUrl,
        dataBase64: base64,
      });

      toast.success(copy.fileAttached);
    } catch {
      toast.error(copy.errors.generic);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const pendingPreview: IdaAttachment | null = pendingUpload
    ? {
        id: pendingUpload.id,
        type: pendingUpload.type,
        fileName: pendingUpload.fileName,
        mimeType: pendingUpload.mimeType,
        previewDataUrl: pendingUpload.previewDataUrl,
      }
    : null;

  const canSend =
    !isLoading &&
    !isExtracting &&
    !isTranscribing &&
    (Boolean(input.trim()) || Boolean(pendingUpload));

  useEffect(() => {
    if (!isLoading && !isTranscribing) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isTranscribing]);

  useEffect(() => {
    const handleFocusRequest = () => {
      window.setTimeout(() => textareaRef.current?.focus(), 50);
    };

    window.addEventListener(FOCUS_CHAT_COMPOSER_EVENT, handleFocusRequest);
    return () => {
      window.removeEventListener(FOCUS_CHAT_COMPOSER_EVENT, handleFocusRequest);
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative z-30 shrink-0 overflow-visible bg-background/40 backdrop-blur-xl",
        "px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-3 sm:pb-5",
      )}
    >
      <div className="ida-message-width mx-auto w-full max-w-full space-y-3">
        <AnimatePresence>
          {(isListening || isTranscribing) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "flex items-center justify-between rounded-[24px] border px-5 py-4 mb-2 shadow-lg",
                isListening
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-primary/30 bg-primary/10",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {isTranscribing ? (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin text-primary" />
                ) : (
                  <span className="relative flex h-4 w-4 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/70" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-destructive" />
                  </span>
                )}
                <VoiceWaveform
                  levels={waveformLevels}
                  className={isListening ? "text-destructive" : undefined}
                />
              </div>
              <p className="text-base font-bold text-foreground/80">
                {isTranscribing ? copy.voiceTranscribing : copy.releaseToSend}
              </p>
            </motion.div>
          )}

          {pendingPreview && !isExtracting && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pb-2"
            >
              <AttachmentPreview
                attachment={pendingPreview}
                extractedLabel={copy.extractedTextLabel}
                removeLabel={copy.removeAttachment}
                pendingHint={copy.pendingOcrHint}
                onRemove={() => setPendingUpload(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {voiceErrorMessage ? (
          <p className="text-center text-xs text-destructive">{voiceErrorMessage}</p>
        ) : null}

        {isExtracting ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span>{copy.extractingFile}</span>
          </div>
        ) : null}

        <div className={cn(
          "flex flex-col rounded-[32px] border border-border/40 bg-card/90 shadow-xl backdrop-blur-sm overflow-hidden transition-all duration-300",
          "focus-within:ring-8 focus-within:ring-primary/5 focus-within:border-primary/30"
        )}>
          <div className="px-5 pt-5 pb-2">
            <label htmlFor={inputId} className="sr-only">
              {copy.inputLabel}
            </label>
            <Textarea
              id={inputId}
              ref={textareaRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={copy.inputPlaceholder}
              rows={1}
              disabled={isLoading || isExtracting || isTranscribing || isListening}
              className={cn(
                "chat-input bg-transparent border-0 resize-none font-medium p-0",
                "focus-visible:ring-0 focus-visible:outline-none min-h-[56px] max-h-48",
                "placeholder:text-muted-foreground/30",
              )}
            />
          </div>

          <div className="flex items-center justify-between px-4 pb-4 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-12 w-12 cursor-pointer rounded-full text-foreground/60 transition-all hover:bg-muted/60 active:scale-90"
                aria-label={copy.attachFile}
                title={copy.attachFile}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-7 w-7" aria-hidden />
              </Button>

              <Button
                ref={toolsButtonRef}
                type="button"
                variant="ghost"
                disabled={isLoading || isExtracting || isTranscribing}
                aria-label={copy.toolsMenu}
                aria-expanded={toolsMenuOpen}
                aria-haspopup="menu"
                className={cn(
                  "h-12 cursor-pointer gap-3 rounded-full px-5 transition-all active:scale-95",
                  toolsMenuOpen ? "border border-primary/20 bg-primary/10 text-primary shadow-sm" : "text-foreground/70 hover:bg-muted/60"
                )}
                onClick={() => setToolsMenuOpen((open) => !open)}
              >
                <Settings2 className={cn("h-6 w-6 transition-colors", toolsMenuOpen ? "text-primary" : "text-primary/70")} />
                <span className="text-lg font-bold">Tools</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={!webSearchAvailable}
                aria-label={copy.webSearchToggle}
                title={
                  webSearchAvailable
                    ? copy.webSearchToggle
                    : copy.webSearchUnavailable
                }
                className={cn(
                  "h-12 cursor-pointer gap-2.5 rounded-full px-5 transition-all active:scale-95",
                  isInternetOn
                    ? "border border-primary/25 bg-primary/10 text-primary shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_20%,transparent)]"
                    : "text-foreground/50 hover:bg-muted/60",
                  !webSearchAvailable && "cursor-not-allowed",
                )}
                onClick={onInternetToggle}
              >
                <Globe
                  className={cn(
                    "h-5 w-5 transition-all",
                    isInternetOn ? "animate-pulse text-primary" : "text-foreground/40",
                  )}
                  aria-hidden
                />
                <span className="text-base font-bold">Internet {isInternetOn ? "ON" : "OFF"}</span>
              </Button>

              <div className="flex items-center gap-2">
                {voiceEnabled && !input.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isLoading || isExtracting || isTranscribing || !speechSupported}
                    aria-label={copy.holdToRecord}
                    title={
                      speechSupported
                        ? copy.holdToRecord
                        : copy.voiceErrorUnsupported
                    }
                    className={cn(
                      "h-12 w-12 cursor-pointer rounded-full transition-all duration-300 active:scale-90",
                      isListening ? "bg-destructive text-destructive-foreground shadow-lg" : "text-foreground/60 hover:bg-muted/60"
                    )}
                    onPointerDown={handleMicPointerDown}
                    onPointerUp={handleMicPointerUp}
                    onPointerCancel={handleMicPointerUp}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                    ) : (
                      <Mic className="h-7 w-7" aria-hidden />
                    )}
                  </Button>
                )}

                {(input.trim() || pendingUpload) && (
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    aria-label={copy.send}
                    className="h-12 w-12 cursor-pointer rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-90"
                  >
                    {isExtracting || isTranscribing || isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                    ) : (
                      <Send className="h-6 w-6" aria-hidden />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <ToolsMenu
          locale={locale}
          disabled={isLoading || isExtracting || isTranscribing}
          webSearchAvailable={webSearchAvailable}
          researchAvailable={researchAvailable}
          isToolActive={isToolActive}
          isAnyToolActive={isAnyToolActive}
          open={toolsMenuOpen}
          onOpenChange={setToolsMenuOpen}
          hideTrigger
          anchorRef={toolsButtonRef}
          onToolClick={onToolMenuClick}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFileSelect(file);
          }}
        />
      </div>
    </form>
  );
}