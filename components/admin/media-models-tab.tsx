"use client";

import { ImageIcon, Music, Save, Video } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ModelDefinition } from "@/lib/admin/models";
import type { IdaAppConfig, ModelSelection, ToolModelKey } from "@/lib/admin/types";
import { TOOL_MODEL_KEYS } from "@/lib/admin/types";

interface ConfigResponse {
  config: IdaAppConfig;
  chatModels: ModelDefinition[];
}

const MEDIA_KEYS: ToolModelKey[] = ["imageGen", "videoGen", "musicGen"];

const MEDIA_LABELS: Partial<Record<ToolModelKey, string>> = {
  imageGen: "Image Generation",
  videoGen: "Video Generation",
  musicGen: "Music Generation",
};

const MEDIA_ICONS: Partial<Record<ToolModelKey, any>> = {
  imageGen: ImageIcon,
  videoGen: Video,
  musicGen: Music,
};

const MEDIA_HINTS: Partial<Record<ToolModelKey, string>> = {
  imageGen: "Grok Imagine (or your configured model) for the Image tool in Right Rail > Creative.",
  videoGen: "Future video synthesis model. Select here to prepare.",
  musicGen: "Music / audio model selection for the Music Generation tool.",
};

function modelKey(selection: ModelSelection | null | undefined): string {
  return selection ? `${selection.provider}:${selection.id}` : "";
}

function ModelSelect({
  label,
  hint,
  value,
  models,
  onChange,
}: {
  label: string;
  hint?: string;
  value: ModelSelection | null | undefined;
  models: ModelDefinition[];
  onChange: (next: ModelSelection | null) => void;
}) {
  const currentKey = modelKey(value);

  return (
    <div className="space-y-1.5 rounded-xl border p-3 ida-glass-subtle">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <select
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        value={currentKey}
        onChange={(e) => {
          if (!e.target.value) {
            onChange(null);
            return;
          }
          const [provider, id] = e.target.value.split(":");
          onChange({ provider: provider as any, id });
        }}
      >
        <option value="">Inherit default chat model</option>
        {models.map((model) => (
          <option
            key={`${model.provider}:${model.id}`}
            value={`${model.provider}:${model.id}`}
          >
            {model.name} ({model.provider})
          </option>
        ))}
      </select>
    </div>
  );
}

export function MediaModelsTab() {
  const [data, setData] = useState<ConfigResponse | null>(null);
  const [draft, setDraft] = useState<IdaAppConfig["toolModels"]>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((response) => response.json())
      .then((payload: ConfigResponse) => {
        setData(payload);
        setDraft(payload.config.toolModels ?? {});
      })
      .catch(() => toast.error("Failed to load media model settings."));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.config,
          toolModels: draft,
        }),
      });

      if (!response.ok) throw new Error("Save failed.");

      const payload = (await response.json()) as { config: IdaAppConfig };
      setData((prev) => (prev ? { ...prev, config: payload.config } : prev));
      setDraft(payload.config.toolModels ?? {});
      toast.success("Media model settings saved.");
    } catch {
      toast.error("Failed to save media model settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading media settings...</p>;
  }

  const mediaOnly = Object.fromEntries(
    Object.entries(draft).filter(([k]) => MEDIA_KEYS.includes(k as ToolModelKey))
  );

  return (
    <div className="space-y-6">
      <Card className="ida-glass admin-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            Media Models (Image / Video / Music)
          </CardTitle>
          <CardDescription>
            Select the models powering the new Creative tools in the Right Tools Rail.
            <br />
            <span className="text-primary">Image Generation defaults to Grok Imagine.</span> Unset = inherit default chat model.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {MEDIA_KEYS.map((key) => {
            const Icon = MEDIA_ICONS[key] || ImageIcon;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="size-4 text-primary" />
                  <span className="font-medium text-sm">{MEDIA_LABELS[key]}</span>
                </div>
                <ModelSelect
                  label=""
                  hint={MEDIA_HINTS[key]}
                  value={draft[key]}
                  models={data.chatModels}
                  onChange={(next) =>
                    setDraft((prev) => ({
                      ...prev,
                      [key]: next,
                    }))
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Changes apply immediately to new generations. Existing sessions keep previous behavior.
        </p>
        <Button disabled={saving} onClick={() => void handleSave()} className="ida-glass-subtle">
          <Save className="size-4 mr-2" />
          {saving ? "Saving..." : "Save Media Models"}
        </Button>
      </div>

      {/* Polish note: this card uses ida-glass for consistency */}
    </div>
  );
}
