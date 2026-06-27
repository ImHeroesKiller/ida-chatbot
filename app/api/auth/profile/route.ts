import { NextResponse } from "next/server";

import { getIdaUserProfile, upsertIdaUser } from "@/lib/auth/user-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[IDA auth profile]", error);
    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 },
    );
  }
}