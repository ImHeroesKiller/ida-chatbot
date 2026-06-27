"use client";

import { Eye, Palette, Save } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { contrastForeground, normalizeHexColor } from "@/lib/ui-config/color";
import { MESSAGE_MAX_WIDTH_OPTIONS } from "@/lib/ui-config/defaults";
import type { IdaUiConfig } from "@/lib/ui-config/types";

interface UiConfigResponse {
  config: IdaUiConfig;
}

const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
] as const;

const ANIMATION_OPTIONS = [
  { value: "full", label: "Full" },
  { value: "reduced", label: "Reduced" },
  { value: "none", label: "None" },
] as const;

const THEME_OPTIONS = [
  { value: "system", label: "System (user preference)" },
  { value: "light", label: "Light (locked)" },
  { value: "dark", label: "Dark (locked)" },
] as const;

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AppearancePreview({ config }: { config: IdaUiConfig }) {
  const previewTheme = config.theme === "system" ? "light" : config.theme;
  const primary = normalizeHexColor(config.primaryColor) ?? "#171717";
  const primaryForeground = contrastForeground(primary);

  const fontVars = useMemo(() => {
    switch (config.fontSize) {
      case "small":
        return { chat: "15px", input: "15.5px", lineHeight: "1.6" };
      case "large":
        return { chat: "18px", input: "18.5px", lineHeight: "1.7" };
      default:
        return { chat: "16.5px", input: "17px", lineHeight: "1.65" };
    }
  }, [config.fontSize]);

  const gapScale =
    config.density === "compact" ? 0.75 : config.density === "spacious" ? 1.25 : 1;

  return (
    <div
      data-ida-font-size={config.fontSize}
      data-ida-density={config.density}
      data-ida-animation={config.animationLevel}
      className={
        previewTheme === "dark"
          ? "dark rounded-xl border bg-background text-foreground"
          : "rounded-xl border bg-background text-foreground"
      }
      style={
        {
          "--ida-message-max-width": config.messageMaxWidth,
          "--ida-font-chat": fontVars.chat,
          "--ida-font-chat-input": fontVars.input,
          "--ida-line-height-chat": fontVars.lineHeight,
          "--primary": primary,
          "--primary-foreground": primaryForeground,
        } as CSSProperties
      }
    >
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">IDA Preview</p>
        <p className="text-xs text-muted-foreground">
          Live preview — changes apply before save
        </p>
      </div>

      <div className="space-y-3 px-4 py-4" style={{ gap: `${12 * gapScale}px` }}>
        <div
          className="ml-auto max-w-[75%] rounded-2xl rounded-br-md px-3 py-2 text-sm"
          style={{
            background: primary,
            color: primaryForeground,
            fontSize: fontVars.chat,
            lineHeight: fontVars.lineHeight,
          }}
        >
          Halo IDA, apa kabar?
        </div>

        <div
          className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-3 py-2 shadow-sm chat-text"
          style={{ maxWidth: `min(85%, ${config.messageMaxWidth})` }}
        >
          Baik, terima kasih! Saya siap membantu Anda hari ini.
        </div>

        <div
          className="ida-message-width mx-auto w-full rounded-xl border bg-muted/40 px-3 py-2 chat-input"
          style={{ maxWidth: config.messageMaxWidth }}
        >
          <span className="text-muted-foreground">Ketik pesan...</span>
        </div>
      </div>
    </div>
  );
}

export function AppearanceTab() {
  const [config, setConfig] = useState<IdaUiConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/ui-config")
      .then((response) => response.json())
      .then((payload: UiConfigResponse) => setConfig(payload.config))
      .catch(() => toast.error("Failed to load appearance settings."));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const response = await fetch("/api/admin/ui-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Save failed.");
      toast.success("Appearance settings saved.");
    } catch {
      toast.error("Failed to save appearance settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <p className="text-sm text-muted-foreground">Loading appearance settings...</p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4" />
              Global appearance
            </CardTitle>
            <CardDescription>
              Admin settings override user localStorage preferences. Theme lock
              disables the user theme toggle.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Theme"
              value={config.theme}
              options={THEME_OPTIONS}
              onChange={(theme) => setConfig((prev) => (prev ? { ...prev, theme } : prev))}
            />
            <SelectField
              label="Font size"
              value={config.fontSize}
              options={FONT_SIZE_OPTIONS}
              onChange={(fontSize) =>
                setConfig((prev) => (prev ? { ...prev, fontSize } : prev))
              }
            />
            <SelectField
              label="Density"
              value={config.density}
              options={DENSITY_OPTIONS}
              onChange={(density) =>
                setConfig((prev) => (prev ? { ...prev, density } : prev))
              }
            />
            <SelectField
              label="Animation"
              value={config.animationLevel}
              options={ANIMATION_OPTIONS}
              onChange={(animationLevel) =>
                setConfig((prev) => (prev ? { ...prev, animationLevel } : prev))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  value={config.primaryColor}
                  onChange={(event) =>
                    setConfig((prev) =>
                      prev ? { ...prev, primaryColor: event.target.value } : prev,
                    )
                  }
                  placeholder="#171717"
                  className="font-mono"
                />
                <input
                  type="color"
                  aria-label="Pick primary color"
                  value={
                    normalizeHexColor(config.primaryColor) ?? config.primaryColor
                  }
                  onChange={(event) =>
                    setConfig((prev) =>
                      prev ? { ...prev, primaryColor: event.target.value } : prev,
                    )
                  }
                  className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-1"
                />
              </div>
            </div>
            <SelectField
              label="Message max width"
              value={config.messageMaxWidth}
              options={MESSAGE_MAX_WIDTH_OPTIONS}
              onChange={(messageMaxWidth) =>
                setConfig((prev) => (prev ? { ...prev, messageMaxWidth } : prev))
              }
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save appearance"}
          </Button>
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4" />
            Preview
          </CardTitle>
          <CardDescription>
            Mock chat reflecting current draft settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearancePreview config={config} />
        </CardContent>
      </Card>
    </div>
  );
}