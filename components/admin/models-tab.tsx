"use client";

import { Check, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IdaAppConfig } from "@/lib/admin/types";
import type {
  ModelAvailability,
  ModelDefinition,
  ModelProvider,
} from "@/lib/admin/models";
import { MODEL_PROVIDERS } from "@/lib/admin/models";
import { cn } from "@/lib/utils";

interface ConfigResponse {
  config: IdaAppConfig;
  models: ModelDefinition[];
  providerStatus: Record<ModelProvider, boolean>;
  modelAvailability: Record<string, ModelAvailability>;
  providerDocs: typeof MODEL_PROVIDERS;
}

const AVAILABILITY_LABELS: Record<ModelAvailability, string> = {
  available: "Available",
  preview: "Preview",
  unconfigured: "No API key",
  deprecated: "Deprecated",
};

export function ModelsTab() {
  const [data, setData] = useState<ConfigResponse | null>(null);
  const [selected, setSelected] = useState<IdaAppConfig["defaultModel"] | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<ModelProvider | "all">("all");

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((response) => response.json())
      .then((payload: ConfigResponse) => {
        setData(payload);
        setSelected(payload.config.defaultModel);
      })
      .catch(() => toast.error("Failed to load models."));
  }, []);

  const handleSave = async () => {
    if (!data || !selected) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.config,
          defaultModel: selected,
        }),
      });

      if (!response.ok) throw new Error("Save failed.");

      const payload = (await response.json()) as { config: IdaAppConfig };
      setData((prev) => (prev ? { ...prev, config: payload.config } : prev));
      toast.success("Default model updated.");
    } catch {
      toast.error("Failed to save model.");
    } finally {
      setSaving(false);
    }
  };

  const chatModels =
    data?.models.filter((model) => model.capabilities.includes("chat")) ?? [];

  const filtered =
    filter === "all"
      ? chatModels
      : chatModels.filter((model) => model.provider === filter);

  const providers = Object.entries(MODEL_PROVIDERS) as Array<
    [ModelProvider, (typeof MODEL_PROVIDERS)[ModelProvider]]
  >;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="size-4" />
            Model Library
          </CardTitle>
          <CardDescription>
            Synced with official provider docs. API keys required per provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            {providers.map(([provider, meta]) => (
              <Button
                key={provider}
                size="sm"
                variant={filter === provider ? "default" : "outline"}
                onClick={() => setFilter(provider)}
                title={meta.docsUrl}
              >
                {meta.label}
                {data?.providerStatus[provider] ? (
                  <span className="ml-1 size-1.5 rounded-full bg-emerald-500" />
                ) : (
                  <span className="ml-1 size-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((model) => {
              const isSelected =
                selected?.id === model.id &&
                selected.provider === model.provider;
              const availability =
                data?.modelAvailability[`${model.provider}:${model.id}`] ??
                "unconfigured";

              return (
                <button
                  key={`${model.provider}:${model.id}`}
                  type="button"
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                    availability === "unconfigured" && "opacity-60",
                    availability === "deprecated" && "opacity-50",
                  )}
                  onClick={() =>
                    setSelected({ id: model.id, provider: model.provider })
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.id}</p>
                    </div>
                    {isSelected && <Check className="size-4 shrink-0" />}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {model.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant="outline">{model.provider}</Badge>
                    <Badge variant="outline">{model.releaseStatus}</Badge>
                    <Badge
                      variant={
                        availability === "available" ? "default" : "outline"
                      }
                    >
                      {AVAILABILITY_LABELS[availability]}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>

          <Button onClick={() => void handleSave()} disabled={saving || !selected}>
            {saving ? "Saving..." : "Set as default model"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}