"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";

import {
  resolveProfileAvatarUrl,
  resolveProfileDisplayName,
} from "@/lib/auth/profile-utils";
import type { IdaUserProfile } from "@/lib/auth/user-service";
import {
  fetchUserProfile,
  patchUserProfile,
  uploadUserAvatar,
  USER_PROFILE_QUERY_KEY,
  type UserProfileResponse,
} from "@/lib/auth/user-profile-query";
import {
  getSupabaseBrowser,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    }
  }, [queryClient, user]);

  const query = useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: fetchUserProfile,
    enabled: Boolean(user) && !authLoading,
  });

  const displayName = resolveProfileDisplayName(query.data?.profile ?? null, user);
  const avatarUrl = resolveProfileAvatarUrl(query.data?.profile ?? null, user);

  return {
    user,
    authLoading,
    profile: query.data?.profile ?? null,
    googleAvatarUrl: query.data?.googleAvatarUrl ?? null,
    displayName,
    avatarUrl,
    isLoading: authLoading || (Boolean(user) && query.isLoading),
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUserProfileMutations() {
  const queryClient = useQueryClient();

  const refreshAuthSession = useCallback(async () => {
    if (!isSupabaseBrowserConfigured()) return;
    await getSupabaseBrowser().auth.refreshSession();
  }, []);

  const applyProfileUpdate = useCallback(
    async (data: UserProfileResponse) => {
      queryClient.setQueryData<UserProfileResponse>(USER_PROFILE_QUERY_KEY, data);
      await refreshAuthSession();
    },
    [queryClient, refreshAuthSession],
  );

  const updateProfile = useMutation({
    mutationFn: patchUserProfile,
    onSuccess: (data) => {
      void applyProfileUpdate(data);
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: (data) => {
      void applyProfileUpdate(data);
    },
  });

  const invalidateProfile = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
  }, [queryClient]);

  return {
    updateProfile,
    uploadAvatar,
    invalidateProfile,
    applyProfileUpdate,
  };
}

export function useUserCustomPrompt(): string | null {
  const { profile } = useUserProfile();
  const prompt = profile?.customPrompt?.trim();
  return prompt || null;
}