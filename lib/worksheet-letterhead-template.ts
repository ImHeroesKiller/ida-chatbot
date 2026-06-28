import {
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
} from "@/lib/worksheet-branding-config";

export type WorksheetBrandingSource = "personal" | "template";

export interface WorksheetLetterheadTemplate {
  id: string;
  name: string;
  brandingConfig: WorksheetBrandingConfig;
  sampleContent: string | null;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetLetterheadSelection {
  brandingSource: WorksheetBrandingSource;
  letterheadTemplateId: string | null;
}

export const DEFAULT_WORKSHEET_LETTERHEAD_SELECTION: WorksheetLetterheadSelection =
  {
    brandingSource: "personal",
    letterheadTemplateId: null,
  };

interface LetterheadTemplateRow {
  id: string;
  name: string;
  branding_config: unknown;
  sample_content?: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function mapLetterheadTemplateRow(
  row: LetterheadTemplateRow,
): WorksheetLetterheadTemplate {
  return {
    id: row.id,
    name: row.name,
    brandingConfig: parseWorksheetBrandingConfig(row.branding_config),
    sampleContent: row.sample_content ?? null,
    isDefault: row.is_default,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findDefaultLetterheadTemplate(
  templates: WorksheetLetterheadTemplate[],
): WorksheetLetterheadTemplate | null {
  return templates.find((template) => template.isDefault) ?? templates[0] ?? null;
}

export function findLetterheadTemplateById(
  templates: WorksheetLetterheadTemplate[],
  templateId: string | null | undefined,
): WorksheetLetterheadTemplate | null {
  if (!templateId) return null;
  return templates.find((template) => template.id === templateId) ?? null;
}

export function resolveWorksheetLetterheadBranding(params: {
  selection: WorksheetLetterheadSelection;
  templates: WorksheetLetterheadTemplate[];
  personalBranding: WorksheetBrandingConfig;
  legacyAdminBranding: WorksheetBrandingConfig;
}): {
  branding: WorksheetBrandingConfig;
  activeTemplate: WorksheetLetterheadTemplate | null;
  brandingSource: WorksheetBrandingSource;
} {
  const { selection, templates, personalBranding, legacyAdminBranding } = params;

  if (selection.brandingSource === "template") {
    const activeTemplate =
      findLetterheadTemplateById(templates, selection.letterheadTemplateId) ??
      findDefaultLetterheadTemplate(templates);

    if (activeTemplate) {
      return {
        branding: activeTemplate.brandingConfig,
        activeTemplate,
        brandingSource: "template",
      };
    }
  }

  return {
    branding: personalBranding,
    activeTemplate: null,
    brandingSource: "personal",
  };
}

export function parseWorksheetLetterheadSelection(
  raw: unknown,
): WorksheetLetterheadSelection {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_WORKSHEET_LETTERHEAD_SELECTION;
  }

  const parsed = raw as Partial<WorksheetLetterheadSelection>;
  const brandingSource =
    parsed.brandingSource === "template" ? "template" : "personal";

  return {
    brandingSource,
    letterheadTemplateId:
      typeof parsed.letterheadTemplateId === "string"
        ? parsed.letterheadTemplateId
        : null,
  };
}