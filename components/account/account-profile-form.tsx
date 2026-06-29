"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildProfileInitials } from "@/lib/auth/profile-utils";
import type { IdaUserProfile } from "@/lib/auth/user-service";
import { useUserProfileMutations } from "@/lib/auth/use-user-profile";
import type { CopyStrings } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AccountProfileFormProps {
  copy: CopyStrings;
  profile: IdaUserProfile | null;
  displayName: string;
  email: string;
  avatarUrl?: string;
  googleAvatarUrl?: string | null;
}

export function AccountProfileForm({
  copy,
  profile,
  displayName,
  email,
  avatarUrl,
  googleAvatarUrl,
}: AccountProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile, uploadAvatar } = useUserProfileMutations();
  const [fullName, setFullName] = useState(displayName);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(avatarUrl);

  useEffect(() => {
    setFullName(displayName);
  }, [displayName]);

  useEffect(() => {
    setPreviewAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const initials = buildProfileInitials(fullName || displayName);

  const handleSaveProfile = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error(copy.profileNameRequired);
      return;
    }

    try {
      await updateProfile.mutateAsync({ fullName: trimmed });
      toast.success(copy.profileSaveSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.profileSaveError,
      );
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const data = await uploadAvatar.mutateAsync(file);
      setPreviewAvatarUrl(data.profile?.avatarUrl ?? undefined);
      toast.success(copy.avatarUploadSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.avatarUploadError,
      );
    }
  };

  const handleUseGoogleAvatar = async () => {
    if (!googleAvatarUrl) return;

    try {
      const data = await updateProfile.mutateAsync({ useGoogleAvatar: true });
      setPreviewAvatarUrl(data.profile?.avatarUrl ?? undefined);
      toast.success(copy.useGoogleAvatarSuccess);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.avatarUploadError,
      );
    }
  };

  const uploadingAvatar =
    uploadAvatar.isPending || updateProfile.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar className="size-20">
          {previewAvatarUrl ? (
            <AvatarImage src={previewAvatarUrl} alt={fullName} />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex w-full flex-1 flex-col gap-2">
          <p className="text-sm font-medium">{copy.profilePhoto}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImagePlus className="size-3.5" />
              )}
              {copy.uploadAvatar}
            </Button>
            {googleAvatarUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => void handleUseGoogleAvatar()}
              >
                {copy.useGoogleAvatar}
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {copy.avatarHint}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleAvatarUpload(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="account-display-name">{copy.profileName}</Label>
          <Input
            id="account-display-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{copy.profileEmail}</Label>
          <p className="rounded-lg border bg-muted/30 px-2.5 py-2 text-sm">
            {email}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>{copy.profileUserId}</Label>
          <p className="break-all rounded-lg border bg-muted/30 px-2.5 py-2 font-mono text-xs">
            {profile?.id ?? "—"}
          </p>
        </div>

        <Button
          type="button"
          className={cn("w-full sm:w-auto")}
          disabled={updateProfile.isPending}
          onClick={() => void handleSaveProfile()}
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {copy.savingProfile}
            </>
          ) : (
            copy.saveProfile
          )}
        </Button>
      </div>
    </div>
  );
}