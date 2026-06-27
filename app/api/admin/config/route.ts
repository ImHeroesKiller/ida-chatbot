import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEFAULT_APP_CONFIG,
  loadAppConfig,
  saveAppConfig,
} from "@/lib/admin/config";
import { requireAdmin } from "@/lib/admin/guard";
import {
  getModelAvailability,
  isProviderConfigured,
  MODEL_LIBRARY,
  MODEL_PROVIDERS,
} from "@/lib/admin/models";
import type { IdaAppConfig } from "@/lib/admin/types";

const modelProviderSchema = z.enum(["google", "groq", "xai", "huggingface"]);

const configSchema = z.object({
  defaultModel: z.object({
    id: z.string().min(1),
    provider: modelProviderSchema,
  }),
  features: z.object({
    rag: z.boolean(),
    voice: z.boolean(),
    ocr: z.boolean(),
    autoSpeak: z.boolean(),
  }),
  systemPromptOverride: z.string().nullable(),
  rag: z.object({
    confidenceThreshold: z.number().min(0).max(1),
    topK: z.number().int().min(1).max(20),
    retrievalThreshold: z.number().min(0).max(1),
  }),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const config = await loadAppConfig({ bypassCache: true });
  const providerStatus = Object.fromEntries(
    (["google", "groq", "xai", "huggingface"] as const).map((provider) => [
      provider,
      isProviderConfigured(provider),
    ]),
  );

  const modelAvailability = Object.fromEntries(
    MODEL_LIBRARY.map((model) => [
      `${model.provider}:${model.id}`,
      getModelAvailability(model),
    ]),
  );

  return NextResponse.json({
    config,
    defaults: DEFAULT_APP_CONFIG,
    models: MODEL_LIBRARY,
    providerStatus,
    modelAvailability,
    providerDocs: MODEL_PROVIDERS,
  });
}

export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid config payload." }, { status: 400 });
  }

  const modelExists = MODEL_LIBRARY.some(
    (model) =>
      model.id === parsed.data.defaultModel.id &&
      model.provider === parsed.data.defaultModel.provider &&
      model.capabilities.includes("chat"),
  );

  if (!modelExists) {
    return NextResponse.json({ error: "Unknown chat model." }, { status: 400 });
  }

  try {
    await saveAppConfig(parsed.data as IdaAppConfig);
    return NextResponse.json({ ok: true, config: parsed.data });
  } catch (error) {
    console.error("[IDA admin config PUT]", error);
    return NextResponse.json(
      { error: "Failed to save configuration." },
      { status: 500 },
    );
  }
}