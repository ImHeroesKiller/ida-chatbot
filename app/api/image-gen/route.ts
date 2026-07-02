import { NextRequest, NextResponse } from "next/server";

import { getMediaModel } from "@/lib/admin/media-models";

/**
 * Real Image Generation API supporting multiple providers via media models from DB.
 * 
 * Providers supported out of box:
 * - replicate (Flux via Replicate): requires REPLICATE_API_TOKEN
 * - fal (Flux via fal.ai): requires FAL_KEY
 * - xai / grok / grok-imagine: uses XAI_API_KEY (or custom api_endpoint from the Media Model record)
 * 
 * Request body:
 * {
 *   prompt: string,
 *   aspectRatio?: "1:1" | "16:9" | "9:16",
 *   modelId?: string   // id from ida_media_models (controls provider + model_id + endpoint)
 * }
 * 
 * Returns: { id, prompt, imageUrl, model, aspectRatio, createdAt, provider }
 */

interface GenerateResult {
  id: string;
  prompt: string;
  imageUrl: string;
  model: string;
  provider: string;
  aspectRatio: string;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = "1:1", modelId } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json({ error: "Valid prompt (min 3 chars) is required" }, { status: 400 });
    }

    let model: Awaited<ReturnType<typeof getMediaModel>> = null;
    let effectiveProvider = "stub";
    let effectiveModelId = "picsum-stub";

    if (modelId) {
      model = await getMediaModel(modelId);
      if (!model || !model.is_active) {
        return NextResponse.json({ error: "Media model not found or inactive" }, { status: 404 });
      }
      effectiveProvider = model.provider;
      effectiveModelId = model.model_id;
    } else {
      // Fallback to default if no modelId (for backward / testing)
      effectiveProvider = "stub";
    }

    // If the user has XAI_API_KEY configured, prefer real Grok Imagine
    // even if no specific media model record was selected yet.
    if (effectiveProvider === "stub" && process.env.XAI_API_KEY) {
      effectiveProvider = "xai";
      effectiveModelId = "grok-imagine";
    }

    let result: GenerateResult;

    switch (effectiveProvider.toLowerCase()) {
      case "replicate":
      case "flux-replicate": {
        result = await generateWithReplicate(prompt, aspectRatio, effectiveModelId);
        break;
      }
      case "fal":
      case "flux-fal": {
        result = await generateWithFal(prompt, aspectRatio, effectiveModelId);
        break;
      }
      case "xai":
      case "grok":
      case "grok-imagine": {
        const token = process.env.XAI_API_KEY;
        if (!token) {
          throw new Error("XAI_API_KEY is not configured for Grok Imagine. Set it in your environment.");
        }
        const endpoint = model?.api_endpoint || "https://api.x.ai/v1/images/generations";
        result = await generateWithXAI(prompt, aspectRatio, effectiveModelId || "grok-imagine", endpoint);
        result.provider = "grok-imagine";
        break;
      }
      default: {
        // Safe stub for unknown / testing
        result = await generateStub(prompt, aspectRatio, effectiveModelId);
      }
    }

    // If model had default_settings, could merge but for now return as-is
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    const status = message.toLowerCase().includes("not configured") ? 503 : 500;
    console.error("[image-gen] error", message);
    return NextResponse.json({ error: message }, { status });
  }
}

// --- Provider implementations ---

async function generateWithReplicate(prompt: string, aspectRatio: string, modelId: string): Promise<GenerateResult> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not configured");

  const aspect = mapAspectRatio(aspectRatio);

  const createRes = await fetch(`https://api.replicate.com/v1/models/${modelId}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait", // if supported, but for safety we poll
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspect,
        num_outputs: 1,
        output_format: "jpg",
        output_quality: 90,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Replicate create failed: ${err}`);
  }

  let prediction = await createRes.json();

  // Poll until done (max ~60s)
  const start = Date.now();
  const maxWait = 120_000;
  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    if (Date.now() - start > maxWait) throw new Error("Replicate prediction timeout");
    await new Promise((r) => setTimeout(r, 1500));
    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) throw new Error("Replicate poll failed");
    prediction = await pollRes.json();
  }

  if (prediction.status === "failed") {
    throw new Error(prediction.error || "Replicate generation failed");
  }

  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

  if (!imageUrl) throw new Error("No image URL returned from Replicate");

  return {
    id: prediction.id,
    prompt,
    imageUrl,
    model: modelId,
    provider: "replicate",
    aspectRatio,
    createdAt: new Date().toISOString(),
  };
}

async function generateWithFal(prompt: string, aspectRatio: string, modelId: string): Promise<GenerateResult> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY is not configured");

  const aspect = mapAspectRatio(aspectRatio, "fal");

  // fal.ai REST for flux
  const endpoint = modelId.includes("/") ? modelId : `fal-ai/${modelId}`;
  const url = `https://fal.run/${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: aspect, // e.g. "square" or "landscape_16_9"
      num_inference_steps: 4,
      guidance_scale: 3.5,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`fal.ai error: ${errText}`);
  }

  const data = await res.json();
  const imageUrl = data.images?.[0]?.url || data.image?.url;

  if (!imageUrl) throw new Error("No image URL from fal.ai");

  return {
    id: data.request_id || `fal-${Date.now()}`,
    prompt,
    imageUrl,
    model: modelId,
    provider: "fal",
    aspectRatio,
    createdAt: new Date().toISOString(),
  };
}

async function generateWithXAI(prompt: string, aspectRatio: string, modelId: string, endpoint: string = "https://api.x.ai/v1/images/generations"): Promise<GenerateResult> {
  const token = process.env.XAI_API_KEY;
  if (!token) throw new Error("XAI_API_KEY is not configured");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model: modelId || "grok-imagine",  // or the model name configured in Admin > Media Models for xAI/Grok
      n: 1,
      aspect_ratio: aspectRatio,  // xAI/Flux likely supports "1:1", "16:9", "9:16" etc. directly
      // Note: removed "size" as it caused 400 "Argument not supported: size" on xAI API.
      // If xAI supports other params, pass via the model's default_settings in Admin and merge here in future.
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`xAI image generation failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;  // support url or base64

  if (!imageUrl) {
    throw new Error("No image URL (or base64) returned from xAI");
  }

  // If base64, convert to data URL for the frontend
  const finalImageUrl = imageUrl.startsWith("data:") || imageUrl.startsWith("http")
    ? imageUrl
    : `data:image/jpeg;base64,${imageUrl}`;

  return {
    id: `xai-${Date.now()}`,
    prompt,
    imageUrl: finalImageUrl,
    model: modelId || "grok-imagine",
    provider: "grok-imagine",
    aspectRatio,
    createdAt: new Date().toISOString(),
  };
}

async function generateStub(prompt: string, aspectRatio: string, modelId: string): Promise<GenerateResult> {
  // Deterministic placeholder for dev / when no key configured
  await new Promise((r) => setTimeout(r, 400));
  const seed = prompt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 99999;
  const dims = aspectRatio === "16:9" ? "768/432" : aspectRatio === "9:16" ? "512/912" : "512/512";
  const imageUrl = `https://picsum.photos/seed/${seed}/${dims}`;

  return {
    id: `stub-${Date.now()}`,
    prompt,
    imageUrl,
    model: modelId || "stub",
    provider: "stub",
    aspectRatio,
    createdAt: new Date().toISOString(),
  };
}

function mapAspectRatio(aspect: string, provider: "replicate" | "fal" | "xai" | "default" = "default"): string {
  if (provider === "replicate" || provider === "default") {
    // replicate uses "1:1", "16:9", "9:16", "4:3", "3:2", "2:3" etc.
    const map: Record<string, string> = {
      "1:1": "1:1",
      "16:9": "16:9",
      "9:16": "9:16",
    };
    return map[aspect] || "1:1";
  }
  if (provider === "fal") {
    // fal uses square, landscape_16_9, portrait_9_16 etc.
    const map: Record<string, string> = {
      "1:1": "square",
      "16:9": "landscape_16_9",
      "9:16": "portrait_9_16",
    };
    return map[aspect] || "square";
  }
  if (provider === "xai") {
    // xAI (Grok/Flux) uses OpenAI-compatible sizes
    const map: Record<string, string> = {
      "1:1": "1024x1024",
      "16:9": "1792x1024",
      "9:16": "1024x1792",
    };
    return map[aspect] || "1024x1024";
  }
  return aspect;
}
