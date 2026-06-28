"use client";

import { Mic, Save, Settings2, Sparkles, ImageIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ModelDefinition } from "@/lib/admin/models";
import { WorksheetBrandingTab } from "@/components/admin/worksheet-branding-tab";
import { WorksheetLetterheadTemplatesTab } from "@/components/admin/worksheet-letterhead-templates";
import type { IdaAppConfig, ModelSelection, TtsEngine } from "@/lib/admin/types";

interface ConfigResponse {
  config: IdaAppConfig;
  chatModels: ModelDefinition[];
  visionModels: ModelDefinition[];
  ttsEngines: Record<TtsEngine, boolean>;
}

const TTS_ENGINE_LABELS: Record<TtsEngine, string> = {
  browser: "Browser SpeechSynthesis",
  openai: "OpenAI TTS",
  xai: "xAI TTS",
  groq: "Groq TTS (unavailable)",
};

function ModelSelect({
  label,
  value,
  models,
  onChange,
  allowNone,
}: {
  label: string;
  value: ModelSelection | null;
  models: ModelDefinition[];
  onChange: (next: ModelSelection | null) => void;
  allowNone?: boolean;
}) {
  const currentKey = value ? `${value.provider}:${value.id}` : "";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        value={currentKey}
        onChange={(event) => {
          const key = event.target.value;
          if (!key && allowNone) {
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
        {allowNone && <option value="">None</option>}
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

export function SettingsTab() {
  const [config, setConfig] = useState<IdaAppConfig | null>(null);
  const [chatModels, setChatModels] = useState<ModelDefinition[]>([]);
  const [visionModels, setVisionModels] = useState<ModelDefinition[]>([]);
  const [ttsEngines, setTtsEngines] = useState<ConfigResponse["ttsEngines"]>({
    browser: true,
    openai: false,
    xai: false,
    groq: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((response) => response.json())
      .then((payload: ConfigResponse) => {
        setConfig(payload.config);
        setChatModels(payload.chatModels ?? []);
        setVisionModels(payload.visionModels ?? []);
        setTtsEngines(payload.ttsEngines ?? { browser: true, openai: false, xai: false, groq: false });
      })
      .catch(() => toast.error("Failed to load settings."));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Save failed.");
      toast.success("Settings saved.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Fallback model
          </CardTitle>
          <CardDescription>
            Used automatically when the primary model errors or hits rate limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModelSelect
            label="Fallback chat model"
            value={config.fallbackModel}
            models={chatModels}
            allowNone
            onChange={(fallbackModel) =>
              setConfig((prev) => (prev ? { ...prev, fallbackModel } : prev))
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            Vision / OCR model
          </CardTitle>
          <CardDescription>
            Model for image and PDF text extraction via /api/vision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModelSelect
            label="Vision model"
            value={config.visionModel}
            models={visionModels}
            onChange={(visionModel) => {
              if (!visionModel) return;
              setConfig((prev) => (prev ? { ...prev, visionModel } : prev));
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="size-4" />
            TTS engine
          </CardTitle>
          <CardDescription>
            Text-to-speech for assistant replies. Browser engine runs locally;
            OpenAI/xAI use server-side synthesis.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tts-engine">Engine</Label>
            <select
              id="tts-engine"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={config.tts.engine}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        tts: {
                          ...prev.tts,
                          engine: event.target.value as TtsEngine,
                        },
                      }
                    : prev,
                )
              }
            >
              {(Object.keys(TTS_ENGINE_LABELS) as TtsEngine[]).map((engine) => (
                <option
                  key={engine}
                  value={engine}
                  disabled={engine !== "browser" && !ttsEngines[engine]}
                >
                  {TTS_ENGINE_LABELS[engine]}
                  {engine !== "browser" && !ttsEngines[engine]
                    ? " — API key missing"
                    : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tts-voice">Voice ID</Label>
            <Input
              id="tts-voice"
              placeholder={
                config.tts.engine === "openai"
                  ? "alloy, echo, fable..."
                  : config.tts.engine === "xai"
                    ? "default"
                    : "Browser voice name (optional)"
              }
              value={config.tts.voiceId}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        tts: { ...prev.tts, voiceId: event.target.value },
                      }
                    : prev,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tts-speed">Speed</Label>
            <Input
              id="tts-speed"
              type="number"
              min={0.5}
              max={2}
              step={0.1}
              value={config.tts.speed}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        tts: { ...prev.tts, speed: Number(event.target.value) },
                      }
                    : prev,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tts-pitch">Pitch (browser only)</Label>
            <Input
              id="tts-pitch"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={config.tts.pitch}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        tts: { ...prev.tts, pitch: Number(event.target.value) },
                      }
                    : prev,
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="size-4" />
            Feature toggles
          </CardTitle>
          <CardDescription>
            Enable or disable client-facing capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["rag", "RAG retrieval"],
              ["voice", "Voice input (STT)"],
              ["ocr", "OCR / vision uploads"],
              ["autoSpeak", "Auto-speak responses"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`feature-${key}`}>{label}</Label>
              <Switch
                id={`feature-${key}`}
                checked={config.features[key]}
                onCheckedChange={(checked) =>
                  setConfig((prev) =>
                    prev
                      ? {
                          ...prev,
                          features: { ...prev.features, [key]: checked },
                        }
                      : prev,
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RAG settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rag-confidence">Confidence threshold</Label>
            <Input
              id="rag-confidence"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={config.rag.confidenceThreshold}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        rag: {
                          ...prev.rag,
                          confidenceThreshold: Number(event.target.value),
                        },
                      }
                    : prev,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rag-topk">Top K</Label>
            <Input
              id="rag-topk"
              type="number"
              min={1}
              max={20}
              value={config.rag.topK}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        rag: { ...prev.rag, topK: Number(event.target.value) },
                      }
                    : prev,
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rag-retrieval">Retrieval threshold</Label>
            <Input
              id="rag-retrieval"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={config.rag.retrievalThreshold}
              onChange={(event) =>
                setConfig((prev) =>
                  prev
                    ? {
                        ...prev,
                        rag: {
                          ...prev.rag,
                          retrievalThreshold: Number(event.target.value),
                        },
                      }
                    : prev,
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System prompt</CardTitle>
          <CardDescription>
            Leave empty to use the built-in IDA prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={12}
            value={config.systemPromptOverride ?? ""}
            onChange={(event) =>
              setConfig((prev) =>
                prev
                  ? {
                      ...prev,
                      systemPromptOverride: event.target.value || null,
                    }
                  : prev,
              )
            }
            placeholder="Custom system prompt..."
          />
        </CardContent>
      </Card>

      <WorksheetBrandingTab />
      <WorksheetLetterheadTemplatesTab />

      <Button onClick={() => void handleSave()} disabled={saving}>
        <Save className="size-4" />
        {saving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}