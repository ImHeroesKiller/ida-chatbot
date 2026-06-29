import type { User } from "@supabase/supabase-js";

import type { IdaUserProfile } from "@/lib/auth/user-service";

export function resolveGoogleAvatarUrl(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  const fromMetadata =
    (metadata.avatar_url as string | undefined) ??
    (metadata.picture as string | undefined);

  if (fromMetadata?.trim()) return fromMetadata.trim();

  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google",
  );

  const identityData = googleIdentity?.identity_data as
    | Record<string, unknown>
    | undefined;

  const fromIdentity =
    (identityData?.avatar_url as string | undefined) ??
    (identityData?.picture as string | undefined);

  return fromIdentity?.trim() ? fromIdentity.trim() : null;
}

export function resolveGoogleDisplayName(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  const fromMetadata =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined);

  if (fromMetadata?.trim()) return fromMetadata.trim();

  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google",
  );

  const identityData = googleIdentity?.identity_data as
    | Record<string, unknown>
    | undefined;

  const fromIdentity =
    (identityData?.full_name as string | undefined) ??
    (identityData?.name as string | undefined);

  return fromIdentity?.trim() ? fromIdentity.trim() : null;
}

export function resolveProfileDisplayName(
  profile: IdaUserProfile | null,
  user: User | null,
): string {
  return (
    profile?.fullName ??
    (user ? resolveGoogleDisplayName(user) : null) ??
    "User"
  );
}

export function resolveProfileAvatarUrl(
  profile: IdaUserProfile | null,
  user: User | null,
): string | undefined {
  return (
    profile?.avatarUrl ??
    (user ? (resolveGoogleAvatarUrl(user) ?? undefined) : undefined)
  );
}

export function buildProfileInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}