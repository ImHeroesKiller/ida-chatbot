import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MediaModel } from "@/lib/admin/types";

export async function listMediaModels(category?: "image" | "video" | "music"): Promise<MediaModel[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("ida_media_models")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[media-models] list error", error);
    throw new Error("Failed to load media models");
  }
  return (data || []).map(normalizeMediaModel);
}

export async function getMediaModel(id: string): Promise<MediaModel | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_media_models")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("[media-models] get error", error);
    throw new Error("Failed to load media model");
  }
  return data ? normalizeMediaModel(data) : null;
}

export async function createMediaModel(
  input: Omit<MediaModel, "id" | "created_at" | "updated_at">
): Promise<MediaModel> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_media_models")
    .insert({
      category: input.category,
      name: input.name,
      provider: input.provider,
      model_id: input.model_id,
      api_endpoint: input.api_endpoint ?? null,
      is_active: input.is_active ?? true,
      default_settings: input.default_settings ?? {},
    })
    .select("*")
    .single();

  if (error) {
    console.error("[media-models] create error", error);
    throw new Error("Failed to create media model");
  }
  return normalizeMediaModel(data);
}

export async function updateMediaModel(
  id: string,
  input: Partial<Omit<MediaModel, "id" | "created_at" | "updated_at">>
): Promise<MediaModel> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_media_models")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[media-models] update error", error);
    throw new Error("Failed to update media model");
  }
  return normalizeMediaModel(data);
}

export async function deleteMediaModel(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_media_models").delete().eq("id", id);
  if (error) {
    console.error("[media-models] delete error", error);
    throw new Error("Failed to delete media model");
  }
}

function normalizeMediaModel(row: Record<string, unknown>): MediaModel {
  return {
    id: row.id as string,
    category: row.category as "image" | "video" | "music",
    name: row.name as string,
    provider: row.provider as string,
    model_id: row.model_id as string,
    api_endpoint: row.api_endpoint as string | null | undefined,
    is_active: row.is_active as boolean,
    default_settings: (row.default_settings as Record<string, unknown>) || {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
