import type { TtsEngine } from "@/lib/admin/types";

export interface TtsRequest {
  text: string;
  engine: TtsEngine;
  voiceId: string;
  speed: number;
}

function normalizeSpeed(speed: number): number {
  return Math.min(2, Math.max(0.5, speed));
}

export async function synthesizeSpeech(
  request: TtsRequest,
): Promise<ArrayBuffer> {
  const speed = normalizeSpeed(request.speed);

  switch (request.engine) {
    case "openai":
      return synthesizeOpenAi(request.text, request.voiceId, speed);
    case "xai":
      return synthesizeXai(request.text, request.voiceId, speed);
    case "groq":
      throw new Error("Groq TTS is not available. Use browser, OpenAI, or xAI.");
    default:
      throw new Error("Server TTS not required for browser engine.");
  }
}

async function synthesizeOpenAi(
  text: string,
  voiceId: string,
  speed: number,
): Promise<ArrayBuffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text.slice(0, 4096),
      voice: voiceId || "alloy",
      speed,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAI TTS failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return response.arrayBuffer();
}

async function synthesizeXai(
  text: string,
  voiceId: string,
  speed: number,
): Promise<ArrayBuffer> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) throw new Error("XAI_API_KEY is not configured.");

  const response = await fetch("https://api.x.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-tts",
      input: text.slice(0, 4096),
      voice: voiceId || "default",
      speed,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`xAI TTS failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return response.arrayBuffer();
}