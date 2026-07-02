import { NextRequest, NextResponse } from "next/server";

/**
 * Stub Image Generation API.
 * In production: call Grok / xAI image endpoint, fal.ai, or Replicate Flux etc.
 * Returns a public image URL (deterministic placeholder for demo).
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio = "1:1", model = "grok-imagine" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // Simulate latency
    await new Promise((r) => setTimeout(r, 650));

    const seed = prompt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 99999;
    const dims = aspectRatio === "16:9" ? "768/432" : aspectRatio === "9:16" ? "512/912" : "512/512";
    const imageUrl = `https://picsum.photos/seed/${seed}/${dims}`;

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      prompt,
      imageUrl,
      model,
      aspectRatio,
      createdAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
