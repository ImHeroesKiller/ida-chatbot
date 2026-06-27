"use client";

import { Loader2, Mic, MicOff, Paperclip, Send } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import toast from "react-hot-toast";

import { AttachmentPreview } from "@/components/chat/attachment-preview";
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

interface ChatComposerProps {
  locale: Locale;
  sessionId?: string;
  input: string;
  isLoading: boolean;
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
  onInputChange,
  onSend,
}: ChatComposerProps) {
  const copy = COPY[locale];
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const { prefs } = useVoicePrefs();
  const {
    isSupported: speechSupported,
    isListening,
    displayTranscript,
    error: speechError,
    waveformLevels,
    toggleListening,
    stopListening,
    resetTranscript,
    isTranscribing,
    hasVoiceInput,
    mode: voiceMode,
  } = useVoiceInput(locale, sessionId);

  const voiceErrorMessage = getVoiceErrorMessage(locale, speechError);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const resolveOcrError = (err: unknown): string => {
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
  };

  const handleSend = async () => {
    const text = isListening || isTranscribing ? displayTranscript : input;

    if (!text.trim() && !pendingUpload) return;
    if (isLoading || isExtracting || isTranscribing) return;

    if (isListening) await stopListening();

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
        setIsExtracting(false);
        return;
      } finally {
        setIsExtracting(false);
      }
    }

    const content = attachment
      ? buildAttachmentMessageContent(text, attachment, locale)
      : text.trim();

    onSend(content, {
      attachment,
      isVoiceNote: prefs.sendAsVoiceNote && hasVoiceInput,
      caption: attachment ? text.trim() : undefined,
    });

    onInputChange("");
    setPendingUpload(null);
    resetTranscript();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleSend();
    }
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

  const textareaValue =
    isListening || isTranscribing || hasVoiceInput
      ? displayTranscript || input
      : input;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "shrink-0 border-t bg-muted/30 px-3 pt-3 dark:bg-muted/20",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-4",
      )}
    >
      <div className="mx-auto w-full max-w-2xl space-y-2.5">
        {(isListening || isTranscribing) && (
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <VoiceWaveform levels={waveformLevels} />
            </div>
            <p className="text-xs text-muted-foreground">
              {isTranscribing
                ? copy.voiceTranscribing
                : voiceMode === "recorder"
                  ? copy.voiceRecorderMode
                  : copy.listening}
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

        <div className="flex items-end gap-2">
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

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading || isExtracting}
            aria-label={copy.attachFile}
            title={copy.attachFile}
            className="h-11 w-11 shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              {copy.inputLabel}
            </label>
            <Textarea
              id={inputId}
              value={textareaValue}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening ? copy.listeningPlaceholder : copy.inputPlaceholder
              }
              rows={1}
              disabled={isLoading || isExtracting || isTranscribing}
              className={cn(
                "chat-input max-h-28 min-h-11 resize-none rounded-2xl",
                "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20",
                "dark:bg-background/60",
              )}
            />
          </div>

          <Button
            type="button"
            variant={isListening ? "default" : "outline"}
            size="icon"
            disabled={
              isLoading || isExtracting || isTranscribing || !speechSupported
            }
            aria-label={isListening ? copy.stopListening : copy.startListening}
            title={
              speechSupported
                ? isListening
                  ? copy.stopListening
                  : copy.startListening
                : copy.voiceErrorUnsupported
            }
            className="h-11 w-11 shrink-0"
            onClick={toggleListening}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={
              isLoading ||
              isExtracting ||
              isTranscribing ||
              (!textareaValue.trim() && !pendingUpload)
            }
            aria-label={copy.send}
            className="h-11 w-11 shrink-0 transition-transform hover:scale-105 active:scale-95"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          {copy.sendShortcut}
        </p>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          {copy.disclaimer}
        </p>
      </div>
    </form>
  );
}