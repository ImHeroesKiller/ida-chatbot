import { NextResponse } from "next/server";

import {
  syncAuthUserMetadata,
  updateIdaUserProfile,
  uploadUserAvatar,
  upsertIdaUser,
} from "@/lib/auth/user-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Avatar file is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await uploadUserAvatar(user.id, {
      buffer,
      mimeType: file.type,
      size: file.size,
    });

    await upsertIdaUser(user);
    const profile = await updateIdaUserProfile(user.id, { avatarUrl });
    await syncAuthUserMetadata(user.id, { avatarUrl: profile.avatarUrl });

    return NextResponse.json({ profile, avatarUrl });
  } catch (error) {
    console.error("[IDA auth profile avatar]", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}