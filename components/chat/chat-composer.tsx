"use client";

import { Loader2, Mic, Paperclip, Send } from "lucide-react";
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
import toast from "react-hot-toast";

import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { ToolsMenu } from "@/components/chat/tools-menu";
import { VoiceWaveform } from "@/components/chat/voice-waveform";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildAttachmentMessageContent } from "@/lib/client/build-attachment-message";
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
import type { RightSidebarPanel } from "@/lib/chat-tools";
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

interface ChatComposerProps {
  locale: Locale;
  sessionId?: string;
  input: string;
  isLoading: boolean;
  webSearchEnabled: boolean;
  webSearchAvailable: boolean;
  worksheetEnabled: boolean;
  activeToolPanel: RightSidebarPanel | null;
  onWebSearchChange: (enabled: boolean) => void;
  onWorksheetChange: (enabled: boolean) => void;
  onOpenToolPanel: (panel: RightSidebarPanel) => void;
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

export function ChatComposer({
  locale,
  sessionId,
  input,
  isLoading,
  webSearchEnabled,
  webSearchAvailable,
  worksheetEnabled,
  activeToolPanel,
  onWebSearchChange,
  onWorksheetChange,
  onOpenToolPanel,
  onInputChange,
  onSend,
}: ChatComposerProps) {
  const copy = COPY[locale];
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative z-30 shrink-0 overflow-visible border-t bg-muted/30 px-2.5 pt-2.5 dark:bg-muted/20",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-3 sm:pb-4",
      )}
    >
      <div className="ida-message-width mx-auto w-full max-w-full space-y-2.5">
        {(isListening || isTranscribing) && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2.5",
              isListening
                ? "border-destructive/30 bg-destructive/5"
                : "border-primary/20 bg-primary/5",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/70" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
                </span>
              )}
              <VoiceWaveform
                levels={waveformLevels}
                className={isListening ? "text-destructive" : undefined}
              />
            </div>
            <p
              className={cn(
                "shrink-0 pl-2 text-xs",
                isListening
                  ? "font-medium text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {isTranscribing
                ? copy.voiceTranscribing
                : copy.releaseToSend}
            </p>
          </div>
        )}

        {voiceErrorMessage && (
          <p className="text-center text-xs text-destructive">
            {voiceErrorMessage}
          </p>
        )}

        {isExtracting && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            <span>{copy.extractingFile}</span>
          </div>
        )}

        {pendingPreview && !isExtracting && (
          <AttachmentPreview
            attachment={pendingPreview}
            extractedLabel={copy.extractedTextLabel}
            removeLabel={copy.removeAttachment}
            pendingHint={copy.pendingOcrHint}
            onRemove={() => setPendingUpload(null)}
          />
        )}

        <div className="flex min-w-0 items-end gap-2">
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

          <ToolsMenu
            locale={locale}
            disabled={isLoading || isExtracting || isTranscribing}
            webSearchEnabled={webSearchEnabled}
            webSearchAvailable={webSearchAvailable}
            worksheetEnabled={worksheetEnabled}
            activePanel={activeToolPanel}
            onWebSearchChange={onWebSearchChange}
            onWorksheetChange={onWorksheetChange}
            onOpenPanel={onOpenToolPanel}
          />

          {ocrEnabled && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isLoading || isExtracting || isTranscribing}
              aria-label={copy.attachFile}
              title={copy.attachFile}
              className="h-12 w-12 shrink-0 sm:h-11 sm:w-11"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}

          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              {copy.inputLabel}
            </label>
            <Textarea
              id={inputId}
              ref={textareaRef}
              value={input}
              onChange={(event) => {
                onInputChange(event.target.value);
                if (hasVoiceInput) setHasVoiceInput(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? copy.listeningPlaceholder
                  : isTranscribing
                    ? copy.voiceTranscribing
                    : copy.inputPlaceholder
              }
              rows={1}
              disabled={isLoading || isExtracting || isTranscribing || isListening}
              className={cn(
                "chat-input max-h-28 min-h-12 resize-none rounded-2xl sm:min-h-11",
                "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20",
                "dark:bg-background/60",
              )}
            />
          </div>

          {voiceEnabled && (
            <Button
              type="button"
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              disabled={
                isLoading || isExtracting || isTranscribing || !speechSupported
              }
              aria-label={copy.holdToRecord}
              title={
                speechSupported
                  ? copy.holdToRecord
                  : copy.voiceErrorUnsupported
              }
              className={cn(
                "h-12 w-12 shrink-0 touch-none select-none sm:h-11 sm:w-11",
                isListening && "scale-105 shadow-md",
              )}
              style={{ touchAction: "none" }}
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerCancel={handleMicPointerUp}
              onContextMenu={(event) => event.preventDefault()}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label={copy.send}
            className="h-12 w-12 shrink-0 transition-transform hover:scale-105 active:scale-95 sm:h-11 sm:w-11"
          >
            {isExtracting || isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="hidden text-center text-[11px] text-muted-foreground sm:block">
          {copy.sendShortcut}
        </p>
        {voiceEnabled && speechSupported ? (
          <p className="text-center text-[11px] text-muted-foreground sm:hidden">
            {copy.holdToRecord}
          </p>
        ) : null}
      </div>
    </form>
  );
}