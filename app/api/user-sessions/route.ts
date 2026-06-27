import { NextResponse } from "next/server";
import { z } from "zod";

import type { ChatStoreState } from "@/lib/chat-store";
import { LOCALES } from "@/lib/config";
import { isValidAnonymousUserId } from "@/lib/user-id";
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

const userIdSchema = z.string().uuid();

const putBodySchema = z.object({
  userId: userIdSchema,
  locale: z.enum(LOCALES),
  store: z.object({
    currentChatId: z.string().min(1),
    order: z.array(z.string().min(1)),
    chats: z.record(z.string(), z.any()),
  }),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const locale = searchParams.get("locale");

  if (!userId || !isValidAnonymousUserId(userId)) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  if (!locale || !LOCALES.includes(locale as (typeof LOCALES)[number])) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ store: null }, { status: 200 });
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: userId })}:user-sessions`,
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
    const store = await loadUserChatStore(userId);

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

  const { userId, locale, store } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    await enforceIdaRateLimit(
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: userId })}:user-sessions`,
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
    await saveUserChatStore(
      userId,
      store as ChatStoreState,
      locale,
    );

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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = z
    .object({
      userId: userIdSchema,
      locale: z.enum(LOCALES),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  try {
    const store = await ensureUserChatStore(parsed.data.userId, parsed.data.locale);
    return NextResponse.json({ store });
  } catch (error) {
    console.error("[IDA user-sessions POST]", error);
    return NextResponse.json(
      { error: "Failed to initialize sessions." },
      { status: 500 },
    );
  }
}