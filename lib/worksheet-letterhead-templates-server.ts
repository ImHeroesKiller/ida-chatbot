import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  parseWorksheetBrandingConfig,
  type WorksheetBrandingConfig,
} from "@/lib/worksheet-branding-config";
import {
  mapLetterheadTemplateRow,
  type WorksheetLetterheadTemplate,
} from "@/lib/worksheet-letterhead-template";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

let memoryCache: {
  templates: WorksheetLetterheadTemplate[];
  loadedAt: number;
} | null = null;

const CACHE_TTL_MS = 15_000;

function devFallbackTemplates(): WorksheetLetterheadTemplate[] {
  return [];
}

export function invalidateLetterheadTemplatesCache(): void {
  memoryCache = null;
}

export async function listWorksheetLetterheadTemplates(options?: {
  bypassCache?: boolean;
}): Promise<WorksheetLetterheadTemplate[]> {
  if (
    !options?.bypassCache &&
    memoryCache &&
    Date.now() - memoryCache.loadedAt < CACHE_TTL_MS
  ) {
    return memoryCache.templates;
  }

  if (!isSupabaseConfigured()) {
    const templates = devFallbackTemplates();
    memoryCache = { templates, loadedAt: Date.now() };
    return templates;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_worksheet_letterhead_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[IDA letterhead-templates list]", error);
      return devFallbackTemplates();
    }

    const templates = (data ?? []).map((row) =>
      mapLetterheadTemplateRow(
        row as Parameters<typeof mapLetterheadTemplateRow>[0],
      ),
    );
    memoryCache = { templates, loadedAt: Date.now() };
    return templates;
  } catch (error) {
    console.error("[IDA letterhead-templates list]", error);
    return devFallbackTemplates();
  }
}

export async function getWorksheetLetterheadTemplate(
  id: string,
): Promise<WorksheetLetterheadTemplate | null> {
  const templates = await listWorksheetLetterheadTemplates();
  return templates.find((template) => template.id === id) ?? null;
}

async function clearDefaultFlag(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ida_worksheet_letterhead_templates")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("is_default", true);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createWorksheetLetterheadTemplate(params: {
  name: string;
  brandingConfig: WorksheetBrandingConfig;
  isDefault?: boolean;
  createdBy?: string | null;
}): Promise<WorksheetLetterheadTemplate> {
  const brandingConfig = parseWorksheetBrandingConfig(params.brandingConfig);
  const isDefault = params.isDefault === true;

  if (!isSupabaseConfigured()) {
    const now = new Date().toISOString();
    const template: WorksheetLetterheadTemplate = {
      id: `local-${Date.now()}`,
      name: params.name.trim(),
      brandingConfig,
      isDefault,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    memoryCache = {
      templates: [...(memoryCache?.templates ?? []), template],
      loadedAt: Date.now(),
    };
    return template;
  }

  const supabase = getSupabaseAdmin();

  if (isDefault) {
    await clearDefaultFlag();
  }

  const { data, error } = await supabase
    .from("ida_worksheet_letterhead_templates")
    .insert({
      name: params.name.trim(),
      branding_config: brandingConfig,
      is_default: isDefault,
      created_by: params.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateLetterheadTemplatesCache();
  return mapLetterheadTemplateRow(
    data as Parameters<typeof mapLetterheadTemplateRow>[0],
  );
}

export async function updateWorksheetLetterheadTemplate(
  id: string,
  params: {
    name?: string;
    brandingConfig?: WorksheetBrandingConfig;
    isDefault?: boolean;
  },
): Promise<WorksheetLetterheadTemplate> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSupabaseAdmin();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.name !== undefined) {
    updates.name = params.name.trim();
  }

  if (params.brandingConfig !== undefined) {
    updates.branding_config = parseWorksheetBrandingConfig(
      params.brandingConfig,
    );
  }

  if (params.isDefault === true) {
    await clearDefaultFlag();
    updates.is_default = true;
  } else if (params.isDefault === false) {
    updates.is_default = false;
  }

  const { data, error } = await supabase
    .from("ida_worksheet_letterhead_templates")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  invalidateLetterheadTemplatesCache();
  return mapLetterheadTemplateRow(
    data as Parameters<typeof mapLetterheadTemplateRow>[0],
  );
}

export async function deleteWorksheetLetterheadTemplate(
  id: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ida_worksheet_letterhead_templates")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  invalidateLetterheadTemplatesCache();
}

export async function setDefaultWorksheetLetterheadTemplate(
  id: string,
): Promise<WorksheetLetterheadTemplate> {
  return updateWorksheetLetterheadTemplate(id, { isDefault: true });
}

export async function seedDefaultLetterheadFromLegacyBranding(
  legacyConfig: WorksheetBrandingConfig = DEFAULT_WORKSHEET_BRANDING_CONFIG,
): Promise<WorksheetLetterheadTemplate | null> {
  const existing = await listWorksheetLetterheadTemplates({ bypassCache: true });
  if (existing.length > 0) return null;

  return createWorksheetLetterheadTemplate({
    name: "Default Letterhead",
    brandingConfig: legacyConfig,
    isDefault: true,
    createdBy: "system",
  });
}