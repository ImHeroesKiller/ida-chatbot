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
  getChatModels,
  getVisionModels,
  isProviderConfigured,
  MODEL_LIBRARY,
  MODEL_PROVIDERS,
} from "@/lib/admin/models";
import type { IdaAppConfig, ToolModelKey } from "@/lib/admin/types";
import { TOOL_MODEL_KEYS } from "@/lib/admin/types";

const modelProviderSchema = z.enum(["google", "groq", "xai", "huggingface"]);

const modelSelectionSchema = z.object({
  id: z.string().min(1),
  provider: modelProviderSchema,
});

const configSchema = z.object({
  defaultModel: modelSelectionSchema,
  fallbackModel: modelSelectionSchema.nullable(),
  visionModel: modelSelectionSchema,
  tts: z.object({
    engine: z.enum(["browser", "openai", "xai", "groq"]),
    voiceId: z.string(),
    speed: z.number().min(0.5).max(2),
    pitch: z.number().min(0).max(2),
  }),
  features: z.object({
    rag: z.boolean(),
    voice: z.boolean(),
    ocr: z.boolean(),
    autoSpeak: z.boolean(),
    webSearch: z.boolean(),
  }),
  systemPromptOverride: z.string().nullable(),
  rag: z.object({
    confidenceThreshold: z.number().min(0).max(1),
    topK: z.number().int().min(1).max(20),
    retrievalThreshold: z.number().min(0).max(1),
  }),
  webSearch: z
    .object({
      maxResults: z.number().int().min(1).max(20),
    })
    .optional(),
  toolModels: z
    .record(z.string(), modelSelectionSchema.nullable())
    .optional(),
});

function validateModelSelection(
  selection: z.infer<typeof modelSelectionSchema>,
  capability: "chat" | "vision",
): boolean {
  return MODEL_LIBRARY.some(
    (model) =>
      model.id === selection.id &&
      model.provider === selection.provider &&
      model.capabilities.includes(capability),
  );
}

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
    chatModels: getChatModels(),
    visionModels: getVisionModels(),
    providerStatus,
    modelAvailability,
    providerDocs: MODEL_PROVIDERS,
    ttsEngines: {
      browser: true,
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      xai: Boolean(process.env.XAI_API_KEY?.trim()),
      groq: false,
    },
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

  if (!validateModelSelection(parsed.data.defaultModel, "chat")) {
    return NextResponse.json({ error: "Unknown primary chat model." }, { status: 400 });
  }

  if (
    parsed.data.fallbackModel &&
    !validateModelSelection(parsed.data.fallbackModel, "chat")
  ) {
    return NextResponse.json({ error: "Unknown fallback chat model." }, { status: 400 });
  }

  if (!validateModelSelection(parsed.data.visionModel, "vision")) {
    return NextResponse.json({ error: "Unknown vision model." }, { status: 400 });
  }

  if (parsed.data.toolModels) {
    for (const [key, selection] of Object.entries(parsed.data.toolModels)) {
      if (!TOOL_MODEL_KEYS.includes(key as ToolModelKey)) {
        return NextResponse.json(
          { error: `Unknown tool model key: ${key}` },
          { status: 400 },
        );
      }

      if (selection && !validateModelSelection(selection, "chat")) {
        return NextResponse.json(
          { error: `Unknown chat model for tool: ${key}` },
          { status: 400 },
        );
      }
    }
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