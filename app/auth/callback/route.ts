import { NextResponse } from "next/server";

import { upsertIdaUser } from "@/lib/auth/user-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/?error=auth`);
    }

    await upsertIdaUser(data.user);

    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/chat";
    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch (error) {
    console.error("[IDA auth callback]", error);
    return NextResponse.redirect(`${origin}/?error=auth`);
  }
}