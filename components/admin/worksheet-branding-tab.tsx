"use client";

import { FileText, ImageIcon, Save, Trash2 } from "lucide-react";
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
import { DEFAULT_WORKSHEET_BRANDING_CONFIG } from "@/lib/worksheet-branding-config";
import type { WorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { readLogoFileAsDataUrl } from "@/lib/worksheet-branding-prefs";

interface BrandingResponse {
  config: WorksheetBrandingConfig;
}

export function WorksheetBrandingTab() {
  const [draft, setDraft] = useState<WorksheetBrandingConfig>(
    DEFAULT_WORKSHEET_BRANDING_CONFIG,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/worksheet-branding");
        if (!response.ok) throw new Error("Failed to load branding.");
        const data = (await response.json()) as BrandingResponse;
        setDraft(data.config);
      } catch {
        toast.error("Failed to load worksheet branding defaults.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;

    try {
      const dataUrl = await readLogoFileAsDataUrl(file);
      setDraft((current) => ({ ...current, logoDataUrl: dataUrl }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to read logo.",
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/worksheet-branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error("Failed to save branding.");
      }

      const data = (await response.json()) as BrandingResponse;
      setDraft(data.config);
      toast.success("Worksheet branding defaults saved.");
    } catch {
      toast.error("Failed to save worksheet branding defaults.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading worksheet branding…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4" />
          Worksheet branding defaults
        </CardTitle>
        <CardDescription>
          Organization-wide defaults for PDF export, print preview, and new
          users. Individual users can still override in the Worksheet panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-worksheet-brand-name">Brand name</Label>
          <Input
            id="admin-worksheet-brand-name"
            value={draft.brandName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                brandName: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-worksheet-footer-text">Footer text</Label>
          <Input
            id="admin-worksheet-footer-text"
            value={draft.footerText}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                footerText: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-worksheet-logo">Logo</Label>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
              {draft.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.logoDataUrl}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Input
                id="admin-worksheet-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) =>
                  void handleLogoChange(event.target.files?.[0])
                }
              />
              {draft.logoDataUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-fit gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() =>
                    setDraft((current) => ({ ...current, logoDataUrl: null }))
                  }
                >
                  <Trash2 className="h-3 w-3" />
                  Remove logo
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  PNG/JPG, max ~180 KB
                </p>
              )}
            </div>
          </div>
        </div>

        <Button onClick={() => void handleSave()} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving…" : "Save defaults"}
        </Button>
      </CardContent>
    </Card>
  );
}