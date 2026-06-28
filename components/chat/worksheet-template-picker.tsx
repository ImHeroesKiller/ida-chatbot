"use client";

import { Building2, UserRound } from "lucide-react";

import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  DEFAULT_WORKSHEET_LETTERHEAD_SELECTION,
  findDefaultLetterheadTemplate,
  type WorksheetBrandingSource,
  type WorksheetLetterheadSelection,
  type WorksheetLetterheadTemplate,
} from "@/lib/worksheet-letterhead-template";
import { cn } from "@/lib/utils";

interface WorksheetLetterheadTemplatePickerProps {
  locale: Locale;
  templates: WorksheetLetterheadTemplate[];
  selection: WorksheetLetterheadSelection;
  activeTemplateName?: string | null;
  loading?: boolean;
  onSelectionChange: (selection: WorksheetLetterheadSelection) => void;
  className?: string;
}

export function WorksheetLetterheadTemplatePicker({
  locale,
  templates,
  selection,
  activeTemplateName,
  loading = false,
  onSelectionChange,
  className,
}: WorksheetLetterheadTemplatePickerProps) {
  const copy = COPY[locale];
  const defaultTemplate = findDefaultLetterheadTemplate(templates);
  const hasTemplates = templates.length > 0;

  const setSource = (brandingSource: WorksheetBrandingSource) => {
    if (brandingSource === "personal") {
      onSelectionChange({
        brandingSource: "personal",
        letterheadTemplateId: null,
      });
      return;
    }

    onSelectionChange({
      brandingSource: "template",
      letterheadTemplateId:
        selection.letterheadTemplateId ??
        defaultTemplate?.id ??
        templates[0]?.id ??
        null,
    });
  };

  return (
    <div className={cn("space-y-3 rounded-lg border bg-muted/15 p-4", className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold">{copy.worksheetLetterheadSourceTitle}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {copy.worksheetLetterheadSourceDescription}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => setSource("personal")}
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
            selection.brandingSource === "personal"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/40",
          )}
        >
          <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="block font-medium">
              {copy.worksheetLetterheadSourcePersonal}
            </span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              {copy.worksheetLetterheadSourcePersonalHint}
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={loading || !hasTemplates}
          onClick={() => setSource("template")}
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
            selection.brandingSource === "template"
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/40",
            !hasTemplates && "cursor-not-allowed opacity-60",
          )}
        >
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="block font-medium">
              {copy.worksheetLetterheadSourceTemplate}
            </span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              {hasTemplates
                ? copy.worksheetLetterheadSourceTemplateHint
                : copy.worksheetLetterheadNoTemplates}
            </span>
          </span>
        </button>
      </div>

      {selection.brandingSource === "template" && hasTemplates ? (
        <div className="space-y-2">
          <Label htmlFor="worksheet-letterhead-template" className="text-xs">
            {copy.worksheetLetterheadTemplateLabel}
          </Label>
          <select
            id="worksheet-letterhead-template"
            value={
              selection.letterheadTemplateId ??
              defaultTemplate?.id ??
              templates[0]?.id ??
              ""
            }
            onChange={(event) =>
              onSelectionChange({
                brandingSource: "template",
                letterheadTemplateId: event.target.value || null,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.isDefault ? ` (${copy.worksheetLetterheadDefaultBadge})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {activeTemplateName ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
          {copy.worksheetLetterheadActiveTemplate.replace(
            "{name}",
            activeTemplateName,
          )}
        </p>
      ) : selection.brandingSource === "personal" ? (
        <p className="text-[11px] text-muted-foreground">
          {copy.worksheetLetterheadActivePersonal}
        </p>
      ) : null}
    </div>
  );
}

export { DEFAULT_WORKSHEET_LETTERHEAD_SELECTION };