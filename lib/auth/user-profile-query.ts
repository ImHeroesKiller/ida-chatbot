import type { IdaUserProfile } from "@/lib/auth/user-service";

export const USER_PROFILE_QUERY_KEY = ["user-profile"] as const;

export interface UserProfileResponse {
  profile: IdaUserProfile | null;
  googleAvatarUrl: string | null;
}

export async function fetchUserProfile(): Promise<UserProfileResponse> {
  const response = await fetch("/api/auth/profile", {
    method: "GET",
    credentials: "same-origin",
  });

  if (response.status === 401) {
    return { profile: null, googleAvatarUrl: null };
  }

  if (!response.ok) {
    throw new Error("Failed to load profile.");
  }

  return (await response.json()) as UserProfileResponse;
}

export async function patchUserProfile(
  body: Record<string, unknown>,
): Promise<UserProfileResponse> {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as UserProfileResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update profile.");
  }

  return data;
}

export async function uploadUserAvatar(file: File): Promise<UserProfileResponse> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch("/api/auth/profile/avatar", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const data = (await response.json()) as UserProfileResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to upload avatar.");
  }

  return data;
}