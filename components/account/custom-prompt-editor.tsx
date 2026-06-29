"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IdaUserProfile } from "@/lib/auth/user-service";
import type { CopyStrings } from "@/lib/i18n";

interface CustomPromptEditorProps {
  copy: CopyStrings;
  profile: IdaUserProfile | null;
  onProfileUpdated: (profile: IdaUserProfile) => void;
}

const PLACEHOLDER_KEYS = [
  "customPromptPlaceholder1",
  "customPromptPlaceholder2",
  "customPromptPlaceholder3",
] as const;

export function CustomPromptEditor({
  copy,
  profile,
  onProfileUpdated,
}: CustomPromptEditorProps) {
  const [customPrompt, setCustomPrompt] = useState(profile?.customPrompt ?? "");
  const [saving, setSaving] = useState(false);

  const placeholder = PLACEHOLDER_KEYS.map((key) => `• ${copy[key]}`).join(
    "\n",
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPrompt: customPrompt.trim() || null,
        }),
      });
      const data = (await response.json()) as {
        profile?: IdaUserProfile;
        error?: string;
      };

      if (!response.ok || !data.profile) {
        throw new Error(data.error ?? copy.customPromptSaveError);
      }

      setCustomPrompt(data.profile.customPrompt ?? "");
      onProfileUpdated(data.profile);
      toast.success(copy.customPromptSaveSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.customPromptSaveError,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setCustomPrompt("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">{copy.customPromptTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.customPromptDescription}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="custom-prompt">{copy.customPromptLabel}</Label>
        <Textarea
          id="custom-prompt"
          value={customPrompt}
          onChange={(event) => setCustomPrompt(event.target.value)}
          placeholder={placeholder}
          rows={6}
          maxLength={2000}
          className="min-h-32 resize-y"
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {customPrompt.length}/2000
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {copy.savingCustomPrompt}
            </>
          ) : (
            copy.saveCustomPrompt
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving || customPrompt.length === 0}
          onClick={handleClear}
        >
          {copy.clearCustomPrompt}
        </Button>
      </div>
    </div>
  );
}