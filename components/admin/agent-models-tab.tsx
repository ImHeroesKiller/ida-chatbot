"use client";

import { Bot, Save } from "lucide-react";
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

const TOOL_MODEL_LABELS: Record<ToolModelKey, string> = {
  webSearch: "Web Search",
  research: "Research",
  workflow: "Workflow (coming soon)",
  agent: "Agent / Workflow default",
  coding: "Coding (coming soon)",
  integration: "Third-party integration",
  virtualComputer: "Virtual Computer (coming soon)",
  imageGen: "Image Generation (Grok Imagine)",
  videoGen: "Video Generation",
  musicGen: "Music Generation",
};

const TOOL_MODEL_HINTS: Record<ToolModelKey, string> = {
  webSearch: "Model used when web search tool is invoked.",
  research: "Model used for multi-source research synthesis.",
  workflow: "Reserved for future workflow automation agent.",
  agent: "Default model for new agent runs and orchestration.",
  coding: "Reserved for future code execution tools.",
  integration: "Reserved for third-party connector tools.",
  virtualComputer: "Reserved for sandbox / virtual desktop tools.",
  imageGen: "Primary model for Image Generation tool (defaults to Grok Imagine).",
  videoGen: "Model for Video Generation (stub / future integration).",
  musicGen: "Model for Music / Audio Generation.",
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
  hint: string;
  value: ModelSelection | null | undefined;
  models: ModelDefinition[];
  onChange: (next: ModelSelection | null) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border p-3">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <select
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        value={modelKey(value)}
        onChange={(event) => {
          const key = event.target.value;
          if (!key) {
            onChange(null);
            return;
          }
          const [provider, ...idParts] = key.split(":");
          onChange({
            provider: provider as ModelSelection["provider"],
            id: idParts.join(":"),
          });
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

export function AgentModelsTab() {
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
      .catch(() => toast.error("Failed to load agent model settings."));
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
      toast.success("Agent model settings saved.");
    } catch {
      toast.error("Failed to save agent model settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-4" />
            Agent &amp; Tool Models
          </CardTitle>
          <CardDescription>
            Configure which models power each tool or agent. Unset entries inherit
            the default chat model. New tools can be added via{" "}
            <code className="font-mono text-xs">toolModels</code> keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {TOOL_MODEL_KEYS.map((key) => (
            <ModelSelect
              key={key}
              label={TOOL_MODEL_LABELS[key]}
              hint={TOOL_MODEL_HINTS[key]}
              value={draft[key]}
              models={data.chatModels}
              onChange={(next) =>
                setDraft((prev) => ({
                  ...prev,
                  [key]: next,
                }))
              }
            />
          ))}
        </CardContent>
      </Card>

      <Button disabled={saving} onClick={() => void handleSave()}>
        <Save className="size-4" />
        {saving ? "Saving..." : "Save agent model settings"}
      </Button>
    </div>
  );
}