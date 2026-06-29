import { NextResponse } from "next/server";
import { z } from "zod";

import {
  resolveGoogleAvatarUrl,
} from "@/lib/auth/profile-utils";
import {
  getIdaUserProfile,
  syncAuthUserMetadata,
  updateIdaUserProfile,
  upsertIdaUser,
} from "@/lib/auth/user-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profilePatchSchema = z.object({
  fullName: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
  customPrompt: z.string().max(2000).nullable().optional(),
  useGoogleAvatar: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await upsertIdaUser(user);
    const profile = await getIdaUserProfile(user.id);

    return NextResponse.json({
      profile,
      googleAvatarUrl: resolveGoogleAvatarUrl(user),
    });
  } catch (error) {
    console.error("[IDA auth profile GET]", error);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = profilePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid profile payload." },
        { status: 400 },
      );
    }

    await upsertIdaUser(user);

    const patch: {
      fullName?: string;
      avatarUrl?: string | null;
      customPrompt?: string | null;
    } = {};

    if (parsed.data.fullName !== undefined) {
      patch.fullName = parsed.data.fullName;
    }

    if (parsed.data.customPrompt !== undefined) {
      patch.customPrompt = parsed.data.customPrompt;
    }

    if (parsed.data.useGoogleAvatar) {
      patch.avatarUrl = resolveGoogleAvatarUrl(user);
    } else if (parsed.data.avatarUrl !== undefined) {
      patch.avatarUrl = parsed.data.avatarUrl;
    }

    const profile = await updateIdaUserProfile(user.id, patch);

    if (patch.fullName !== undefined || patch.avatarUrl !== undefined) {
      await syncAuthUserMetadata(user.id, {
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
      });
    }

    return NextResponse.json({
      profile,
      googleAvatarUrl: resolveGoogleAvatarUrl(user),
    });
  } catch (error) {
    console.error("[IDA auth profile PATCH]", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}