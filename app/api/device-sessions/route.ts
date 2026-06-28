import { NextResponse } from "next/server";
import { z } from "zod";

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
import { isValidAnonymousUserId } from "@/lib/user-id";

const DEVICE_ID_HEADER = "x-ida-device-id";

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

function resolveDeviceId(request: Request): string | null {
  const deviceId = request.headers.get(DEVICE_ID_HEADER)?.trim() ?? "";
  return isValidAnonymousUserId(deviceId) ? deviceId : null;
}

export async function GET(request: Request) {
  const deviceId = resolveDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
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
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: deviceId })}:device-sessions`,
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
    const store = await loadUserChatStore(deviceId);

    if (!store) {
      return NextResponse.json({ store: null }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error("[IDA device-sessions GET]", error);
    return NextResponse.json(
      { error: "Failed to load sessions." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const deviceId = resolveDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
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
      `${buildRateLimitKey({ ip: getClientIp(request), sessionId: deviceId })}:device-sessions`,
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
    await saveUserChatStore(deviceId, store as ChatStoreState, locale);

    return NextResponse.json({ ok: true, persisted: true });
  } catch (error) {
    console.error("[IDA device-sessions PUT]", error);
    return NextResponse.json(
      { error: "Failed to save sessions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const deviceId = resolveDeviceId(request);
  if (!deviceId) {
    return NextResponse.json({ error: "Invalid device id." }, { status: 400 });
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
    const store = await ensureUserChatStore(deviceId, parsed.data.locale);
    return NextResponse.json({ store });
  } catch (error) {
    console.error("[IDA device-sessions POST]", error);
    return NextResponse.json(
      { error: "Failed to initialize sessions." },
      { status: 500 },
    );
  }
}