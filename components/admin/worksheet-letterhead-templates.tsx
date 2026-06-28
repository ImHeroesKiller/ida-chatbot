"use client";

import {
  Building2,
  Eye,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import {
  WorksheetLetterheadFooter,
  WorksheetLetterheadHeader,
} from "@/components/chat/worksheet-letterhead";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
  type WorksheetBrandingFontFamily,
} from "@/lib/worksheet-branding-config";
import { readLogoFileAsDataUrl } from "@/lib/worksheet-branding-prefs";
import type { WorksheetLetterheadTemplate } from "@/lib/worksheet-letterhead-template";
import { cn } from "@/lib/utils";

interface TemplatesResponse {
  templates: WorksheetLetterheadTemplate[];
}

interface TemplateResponse {
  template: WorksheetLetterheadTemplate;
}

const EMPTY_DRAFT = {
  name: "",
  brandingConfig: DEFAULT_WORKSHEET_BRANDING_CONFIG,
  isDefault: false,
};

export function WorksheetLetterheadTemplatesTab() {
  const [templates, setTemplates] = useState<WorksheetLetterheadTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);

  const loadTemplates = useCallback(async () => {
    const response = await fetch("/api/admin/worksheet-letterhead");
    if (!response.ok) throw new Error("Failed to load templates.");
    const data = (await response.json()) as TemplatesResponse;
    setTemplates(data.templates);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadTemplates();
      } catch {
        toast.error("Failed to load letterhead templates.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadTemplates]);

  const resetForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowForm(true);
  };

  const startEdit = (template: WorksheetLetterheadTemplate) => {
    setEditingId(template.id);
    setDraft({
      name: template.name,
      brandingConfig: template.brandingConfig,
      isDefault: template.isDefault,
    });
    setShowForm(true);
  };

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readLogoFileAsDataUrl(file);
      setDraft((current) => ({
        ...current,
        brandingConfig: { ...current.brandingConfig, logoDataUrl: dataUrl },
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to read logo.",
      );
    }
  };

  const updateBranding = (patch: Partial<WorksheetBrandingConfig>) => {
    setDraft((current) => ({
      ...current,
      brandingConfig: { ...current.brandingConfig, ...patch },
    }));
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        brandingConfig: parseWorksheetBrandingConfig(draft.brandingConfig),
        isDefault: draft.isDefault,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/worksheet-letterhead/${editingId}`
          : "/api/admin/worksheet-letterhead",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Failed to save template.");

      await loadTemplates();
      toast.success(editingId ? "Template updated." : "Template created.");
      resetForm();
    } catch {
      toast.error("Failed to save letterhead template.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this letterhead template?")) return;

    try {
      const response = await fetch(`/api/admin/worksheet-letterhead/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete.");
      await loadTemplates();
      if (editingId === id) resetForm();
      toast.success("Template deleted.");
    } catch {
      toast.error("Failed to delete template.");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(
        `/api/admin/worksheet-letterhead/${id}/default`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Failed to set default.");
      await loadTemplates();
      toast.success("Default template updated.");
    } catch {
      toast.error("Failed to set default template.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading letterhead templates…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4" />
          Letterhead templates
        </CardTitle>
        <CardDescription>
          Create multiple company letterhead templates. Users can pick a
          template per worksheet document.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {templates.length} template{templates.length === 1 ? "" : "s"}
          </p>
          <Button type="button" size="sm" onClick={startCreate}>
            <Plus className="size-4" />
            New template
          </Button>
        </div>

        {templates.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.brandingConfig.brandName}
                    {template.isDefault ? " · Default" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!template.isDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSetDefault(template.id)}
                    >
                      <Star className="size-3.5" />
                      Set default
                    </Button>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                      Default
                    </span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(template)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleDelete(template.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No templates yet. Create one to let users pick company letterheads.
          </p>
        )}

        {showForm ? (
          <div className="space-y-4 rounded-lg border bg-muted/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">
                {editingId ? "Edit template" : "New template"}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="letterhead-template-name">Template name</Label>
              <Input
                id="letterhead-template-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Official Letter, Project Proposal…"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
                className="rounded border-input"
              />
              Set as default template
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <BrandingField label="Brand name">
                  <Input
                    value={draft.brandingConfig.brandName}
                    onChange={(event) =>
                      updateBranding({ brandName: event.target.value })
                    }
                  />
                </BrandingField>
                <BrandingField label="Tagline">
                  <Input
                    value={draft.brandingConfig.tagline}
                    onChange={(event) =>
                      updateBranding({ tagline: event.target.value })
                    }
                  />
                </BrandingField>
                <BrandingField label="Address">
                  <Textarea
                    value={draft.brandingConfig.address}
                    onChange={(event) =>
                      updateBranding({ address: event.target.value })
                    }
                    className="min-h-20"
                  />
                </BrandingField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BrandingField label="Phone">
                    <Input
                      value={draft.brandingConfig.phone}
                      onChange={(event) =>
                        updateBranding({ phone: event.target.value })
                      }
                    />
                  </BrandingField>
                  <BrandingField label="Email">
                    <Input
                      value={draft.brandingConfig.email}
                      onChange={(event) =>
                        updateBranding({ email: event.target.value })
                      }
                    />
                  </BrandingField>
                </div>
                <BrandingField label="Website">
                  <Input
                    value={draft.brandingConfig.website}
                    onChange={(event) =>
                      updateBranding({ website: event.target.value })
                    }
                  />
                </BrandingField>
                <BrandingField label="Footer text">
                  <Input
                    value={draft.brandingConfig.footerText}
                    onChange={(event) =>
                      updateBranding({ footerText: event.target.value })
                    }
                  />
                </BrandingField>
                <BrandingField label="Footer contact line">
                  <Input
                    value={draft.brandingConfig.footerContactLine}
                    onChange={(event) =>
                      updateBranding({ footerContactLine: event.target.value })
                    }
                  />
                </BrandingField>
                <BrandingField label="Primary color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.brandingConfig.primaryColor}
                      onChange={(event) =>
                        updateBranding({ primaryColor: event.target.value })
                      }
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <Input
                      value={draft.brandingConfig.primaryColor}
                      onChange={(event) =>
                        updateBranding({ primaryColor: event.target.value })
                      }
                      className="font-mono text-sm"
                    />
                  </div>
                </BrandingField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FontSelect
                    label="Header font"
                    value={draft.brandingConfig.headerFontFamily}
                    onChange={(value) =>
                      updateBranding({ headerFontFamily: value })
                    }
                  />
                  <FontSelect
                    label="Footer font"
                    value={draft.brandingConfig.footerFontFamily}
                    onChange={(value) =>
                      updateBranding({ footerFontFamily: value })
                    }
                  />
                </div>
                <BrandingField label="Logo">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) =>
                      void handleLogoChange(event.target.files?.[0])
                    }
                  />
                </BrandingField>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Eye className="size-3.5" />
                  Preview
                </p>
                <div className="rounded-lg border bg-white p-4 text-[#181818]">
                  <WorksheetLetterheadHeader
                    branding={draft.brandingConfig}
                    documentTitle="Document Title"
                    compact
                  />
                  <div className="my-3 h-8 rounded bg-muted/30" />
                  <WorksheetLetterheadFooter
                    branding={draft.brandingConfig}
                    locale="en"
                    pageLabel="1 / 3"
                  />
                </div>
              </div>
            </div>

            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update template" : "Create template"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BrandingField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: WorksheetBrandingFontFamily;
  onChange: (value: WorksheetBrandingFontFamily) => void;
}) {
  return (
    <BrandingField label={label}>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as WorksheetBrandingFontFamily)
        }
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
        )}
      >
        <option value="system">System</option>
        <option value="sans">Sans-serif</option>
        <option value="serif">Serif</option>
      </select>
    </BrandingField>
  );
}