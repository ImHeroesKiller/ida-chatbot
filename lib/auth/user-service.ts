import type { User } from "@supabase/supabase-js";

import {
  resolveGoogleAvatarUrl,
  resolveGoogleDisplayName,
} from "@/lib/auth/profile-utils";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export interface IdaUserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  customPrompt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface IdaUserProfileUpdate {
  fullName?: string;
  avatarUrl?: string | null;
  customPrompt?: string | null;
}

function mapUserRow(row: {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  custom_prompt?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}): IdaUserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    customPrompt: row.custom_prompt ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

const PROFILE_SELECT =
  "id, email, full_name, avatar_url, custom_prompt, created_at, updated_at, last_login_at";

export async function upsertIdaUser(user: User): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const existing = await getIdaUserProfile(user.id);

  const googleName = resolveGoogleDisplayName(user);
  const googleAvatar = resolveGoogleAvatarUrl(user);

  const { error } = await supabase.from("ida_users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: existing?.fullName ?? googleName,
      avatar_url: existing?.avatarUrl ?? googleAvatar,
      custom_prompt: existing?.customPrompt ?? null,
      last_login_at: now,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getIdaUserProfile(
  userId: string,
): Promise<IdaUserProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_users")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapUserRow(data);
}

export async function getIdaUserCustomPrompt(
  userId: string,
): Promise<string | null> {
  const profile = await getIdaUserProfile(userId);
  const prompt = profile?.customPrompt?.trim();
  return prompt || null;
}

export async function updateIdaUserProfile(
  userId: string,
  patch: IdaUserProfileUpdate,
): Promise<IdaUserProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    updated_at: now,
  };

  if (patch.fullName !== undefined) {
    updatePayload.full_name = patch.fullName.trim() || null;
  }

  if (patch.avatarUrl !== undefined) {
    updatePayload.avatar_url = patch.avatarUrl;
  }

  if (patch.customPrompt !== undefined) {
    const trimmed = patch.customPrompt?.trim() ?? "";
    updatePayload.custom_prompt = trimmed || null;
  }

  const { data, error } = await supabase
    .from("ida_users")
    .update(updatePayload)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update profile.");
  }

  return mapUserRow(data);
}

export async function syncAuthUserMetadata(
  userId: string,
  metadata: { fullName?: string | null; avatarUrl?: string | null },
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseAdmin();
  const userMetadata: Record<string, string> = {};

  if (metadata.fullName !== undefined && metadata.fullName) {
    userMetadata.full_name = metadata.fullName;
    userMetadata.name = metadata.fullName;
  }

  if (metadata.avatarUrl !== undefined && metadata.avatarUrl) {
    userMetadata.avatar_url = metadata.avatarUrl;
    userMetadata.picture = metadata.avatarUrl;
  }

  if (Object.keys(userMetadata).length === 0) return;

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: userMetadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function avatarExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export async function uploadUserAvatar(
  userId: string,
  file: { buffer: Buffer; mimeType: string; size: number },
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  if (!AVATAR_MIME_TYPES.has(file.mimeType)) {
    throw new Error("Unsupported image type. Use JPG, PNG, or WebP.");
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error("Image is too large. Maximum size is 2 MB.");
  }

  const supabase = getSupabaseAdmin();
  const objectPath = `${userId}/avatar.${avatarExtension(file.mimeType)}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}