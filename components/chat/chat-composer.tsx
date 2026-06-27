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
  createImagePreview,
  isAcceptedUploadType,
  readFileAsBase64,
} from "@/lib/client/file-utils";
import { IDA_CONFIG, type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { useAudioWaveform } from "@/lib/voice/use-audio-waveform";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";
import type { IdaAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

function createAttachmentId() {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

  const [pendingAttachment, setPendingAttachment] =
    useState<IdaAttachment | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const { prefs } = useVoicePrefs();
  const {
    isSupported: speechSupported,
    isListening,
    displayTranscript,
    error: speechError,
    toggleListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(locale);

  const waveformLevels = useAudioWaveform(isListening);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const handleSend = async () => {
    const text = isListening ? displayTranscript : input;

    if (!text.trim() && !pendingAttachment) return;
    if (isLoading || isExtracting) return;

    if (isListening) stopListening();

    const content = pendingAttachment
      ? buildAttachmentMessageContent(text, pendingAttachment, locale)
      : text.trim();

    onSend(content, {
      attachment: pendingAttachment ?? undefined,
      isVoiceNote: prefs.sendAsVoiceNote && isListening,
      caption: pendingAttachment ? text.trim() : undefined,
    });

    onInputChange("");
    setPendingAttachment(null);
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

    setIsExtracting(true);

    try {
      const base64 = await readFileAsBase64(file);
      let previewDataUrl: string | undefined;

      if (file.type.startsWith("image/")) {
        previewDataUrl = await createImagePreview(
          file,
          IDA_CONFIG.maxUploadPreviewDimension,
        );
      }

      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: base64,
          mimeType: file.type,
          fileName: file.name,
          locale,
          sessionId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? copy.errors.generic);
      }

      const result = (await response.json()) as {
        extractedText: string;
        summary: string;
        fileType: "image" | "pdf";
        fileName: string;
      };

      setPendingAttachment({
        id: createAttachmentId(),
        type: result.fileType,
        fileName: result.fileName,
        mimeType: file.type,
        previewDataUrl,
        extractedText: result.extractedText,
        summary: result.summary,
      });

      toast.success(copy.uploadSuccess);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : copy.errors.generic;
      toast.error(message);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const textareaValue = isListening ? displayTranscript || input : input;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "shrink-0 border-t bg-muted/30 px-3 pt-3 dark:bg-muted/20",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-4",
      )}
    >
      <div className="mx-auto w-full max-w-2xl space-y-2.5">
        {isListening && (
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <VoiceWaveform levels={waveformLevels} />
            </div>
            <p className="text-xs text-muted-foreground">{copy.listening}</p>
          </div>
        )}

        {speechError && speechError !== "aborted" && (
          <p className="text-center text-xs text-destructive">
            {copy.voiceError}
          </p>
        )}

        {isExtracting && (
          <div className="flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.extractingFile}
          </div>
        )}

        {pendingAttachment && !isExtracting && (
          <AttachmentPreview
            attachment={pendingAttachment}
            extractedLabel={copy.extractedTextLabel}
            removeLabel={copy.removeAttachment}
            onRemove={() => setPendingAttachment(null)}
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
              disabled={isLoading || isExtracting}
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
            disabled={isLoading || isExtracting || !speechSupported}
            aria-label={isListening ? copy.stopListening : copy.startListening}
            title={isListening ? copy.stopListening : copy.startListening}
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
              (!textareaValue.trim() && !pendingAttachment)
            }
            aria-label={copy.send}
            className="h-11 w-11 shrink-0 transition-transform hover:scale-105 active:scale-95"
          >
            <Send className="h-4 w-4" />
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