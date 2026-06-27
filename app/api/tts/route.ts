import { NextResponse } from "next/server";
import { z } from "zod";

import { loadAppConfig } from "@/lib/admin/config";
import { synthesizeSpeech } from "@/lib/voice/tts-service";

const bodySchema = z.object({
  text: z.string().min(1).max(4096),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid TTS payload." }, { status: 400 });
  }

  const config = await loadAppConfig();
  const { tts } = config;

  if (tts.engine === "browser") {
    return NextResponse.json(
      { error: "Browser TTS is handled client-side." },
      { status: 400 },
    );
  }

  try {
    const audio = await synthesizeSpeech({
      text: parsed.data.text,
      engine: tts.engine,
      voiceId: tts.voiceId,
      speed: tts.speed,
    });

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[IDA tts]", error);

    const message =
      error instanceof Error ? error.message : "Failed to synthesize speech.";

    const status = message.includes("not configured") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}