import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import type { ChatStoreState } from "@/lib/chat-store";
import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import {
  ensureUserChatStore,
  loadUserChatStore,
  saveUserChatStore,
} from "@/lib/session-store/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const putBodySchema = z.object({
  locale: z.enum(LOCALES),
  store: z.object({
    currentChatId: z.string().min(1),
    order: z.array(z.string().min(1)),
    chats: z.record(z.string(), z.any()),
  }),
});

const initBodySchema = z.object({
  locale: z.enum(LOCALES),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");

  if (!locale || !LOCALES.includes(locale as (typeof LOCALES)[number])) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ store: null }, { status: 200 });
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: user.id })}:user-sessions`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSec) },
        },
      );
    }
    throw error;
  }

  try {
    const store = await loadUserChatStore(user.id);

    if (!store) {
      return NextResponse.json({ store: null }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("[IDA user-sessions GET]", error);
    return NextResponse.json(
      { error: "Failed to load sessions." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
  }

  const { locale, store } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: user.id })}:user-sessions`,
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSec) },
        },
      );
    }
    throw error;
  }

  try {
    await saveUserChatStore(user.id, store as ChatStoreState, locale);

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    console.error("[IDA user-sessions PUT]", error);
    return NextResponse.json(
      { error: "Failed to save sessions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = initBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  try {
    const store = await ensureUserChatStore(user.id, parsed.data.locale);
    return NextResponse.json({ store });
  } catch (error) {
    console.error("[IDA user-sessions POST]", error);
    return NextResponse.json(
      { error: "Failed to initialize sessions." },
      { status: 500 },
    );
  }
}