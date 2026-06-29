"use client";

import { Loader2, Mic, Paperclip, Send, Plus, X } from "lucide-react";
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
  onInputChange,
  onSend,
}: ChatComposerRedesignProps) {
  const copy = COPY[locale];
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const sendingRef = useRef(false);
  const skipVoiceAutoSendRef = useRef(false);
  const holdingMicRef = useRef(false);

  const { prefs } = useVoicePrefs();
  const appFeatures = useAppFeatures();
  const voiceEnabled = appFeatures?.features.voice !== false;
  const ocrEnabled = appFeatures?.features.ocr !== false;

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
      setShowMoreActions(false);
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
        "relative z-30 shrink-0 overflow-visible bg-background",
        "px-3 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-3 sm:pb-4",
      )}
    >
      <div className="ida-message-width mx-auto w-full max-w-full space-y-4">
        <AnimatePresence>
          {showMoreActions && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
            >
              <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-full border border-border/60 shadow-md">
                <ToolsMenu
                  locale={locale}
                  disabled={isLoading || isExtracting || isTranscribing}
                  webSearchAvailable={webSearchAvailable}
                  researchAvailable={researchAvailable}
                  isToolActive={isToolActive}
                  isAnyToolActive={isAnyToolActive}
                  onToolClick={onToolMenuClick}
                />

                {ocrEnabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isLoading || isExtracting || isTranscribing}
                    className="h-11 w-11 rounded-full hover:bg-muted/80 active:scale-90 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-6 w-6" />
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-muted/80 active:scale-90 transition-transform"
                  onClick={() => setShowMoreActions(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </motion.div>
          )}

          {(isListening || isTranscribing) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className={cn(
                "flex items-center justify-between rounded-3xl border px-5 py-4",
                isListening
                  ? "border-destructive/40 bg-destructive/10"
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

        <div className="flex items-center gap-3">
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

          <div className={cn(
            "flex-1 flex items-center gap-2 bg-muted/40 rounded-[32px] border border-border/50 px-2.5 py-2 transition-all duration-300",
            "focus-within:bg-muted/60 focus-within:border-primary/40 focus-within:ring-8 focus-within:ring-primary/5"
          )}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-full text-muted-foreground hover:bg-muted/80 active:scale-90 transition-transform"
              onClick={() => setShowMoreActions(!showMoreActions)}
            >
              {showMoreActions ? <X className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
            </Button>

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
                "flex-1 bg-transparent border-0 resize-none text-lg font-medium py-3 px-1.5",
                "focus-visible:ring-0 focus-visible:outline-none min-h-[48px] max-h-40",
                "placeholder:text-muted-foreground/40",
              )}
            />

            {voiceEnabled && !input.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLoading || isExtracting || isTranscribing || !speechSupported}
                className={cn(
                  "h-12 w-12 shrink-0 rounded-full transition-all duration-300 active:scale-90",
                  isListening ? "bg-destructive text-destructive-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/80"
                )}
                onPointerDown={handleMicPointerDown}
                onPointerUp={handleMicPointerUp}
                onPointerCancel={handleMicPointerUp}
              >
                {isTranscribing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-7 w-7" />}
              </Button>
            )}

            {(input.trim() || pendingUpload) && (
              <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                className="h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground shadow-md transition-all active:scale-90 hover:scale-105"
              >
                {isExtracting || isTranscribing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
