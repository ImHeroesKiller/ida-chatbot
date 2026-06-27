"use client";

import { Database, Save, Settings2 } from "lucide-react";
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
import type { IdaAppConfig } from "@/lib/admin/types";

export function SettingsTab() {
  const [config, setConfig] = useState<IdaAppConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((response) => response.json())
      .then((payload: { config: IdaAppConfig }) => setConfig(payload.config))
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

  const handleReindex = async () => {
    setReindexing(true);

    try {
      const response = await fetch("/api/admin/reindex", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        output?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Re-index failed.");
      }

      toast.success("Knowledge base re-indexed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Re-index failed.");
    } finally {
      setReindexing(false);
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
            Leave empty to use the built-in IDA prompt. When set, this fully
            replaces the default system instruction.
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" />
            Knowledge base
          </CardTitle>
          <CardDescription>
            Re-run the seed script to refresh RAG document chunks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => void handleReindex()}
            disabled={reindexing}
          >
            {reindexing ? "Re-indexing..." : "Re-index knowledge base"}
          </Button>
        </CardContent>
      </Card>

      <Button onClick={() => void handleSave()} disabled={saving}>
        <Save className="size-4" />
        {saving ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}