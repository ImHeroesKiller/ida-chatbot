import { NextResponse } from "next/server";

import { loadAppConfig } from "@/lib/admin/config";

export async function GET() {
  const config = await loadAppConfig();

  return NextResponse.json({
    features: config.features,
    rag: config.rag,
    tts: config.tts,
    visionModel: config.visionModel,
    webSearchAvailable: Boolean(process.env.TAVILY_API_KEY?.trim()),
    ttsEngines: {
      browser: true,
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      xai: Boolean(process.env.XAI_API_KEY?.trim()),
      groq: false,
    },
  });
}