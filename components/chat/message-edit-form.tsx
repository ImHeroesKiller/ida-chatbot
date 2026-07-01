"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MessageEditFormProps {
  locale: Locale;
  initialValue: string;
  isSubmitting?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export function MessageEditForm({
  locale,
  initialValue,
  isSubmitting = false,
  onSubmit,
  onCancel,
  className,
}: MessageEditFormProps) {
  const copy = COPY[locale];
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const busy = isSubmitting || submitting;
  const canSubmit = value.trim().length > 0 && !busy;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={3}
        disabled={busy}
        className="chat-input min-h-20 resize-y rounded-xl"
        aria-label={copy.editMessage}
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer text-xs"
          disabled={busy}
          onClick={onCancel}
        >
          {copy.editCancel}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 cursor-pointer gap-1.5 text-xs"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) return;
            setSubmitting(true);
            onSubmit(value.trim());
          }}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {copy.editSave}
        </Button>
      </div>
    </div>
  );
}