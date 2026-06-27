export type ModelProvider = "google" | "groq" | "xai" | "huggingface";

export type ModelCapability = "chat" | "vision" | "embedding" | "stt";

export type ModelReleaseStatus = "stable" | "preview" | "deprecated";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  capabilities: ModelCapability[];
  envKey: string;
  releaseStatus: ModelReleaseStatus;
  docsUrl?: string;
}

export const MODEL_PROVIDERS: Record<
  ModelProvider,
  { label: string; envKey: string; docsUrl: string }
> = {
  google: {
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models",
  },
  groq: {
    label: "Groq",
    envKey: "GROQ_API_KEY",
    docsUrl: "https://console.groq.com/docs/models",
  },
  xai: {
    label: "xAI Grok",
    envKey: "XAI_API_KEY",
    docsUrl: "https://docs.x.ai/developers/models",
  },
  huggingface: {
    label: "Hugging Face",
    envKey: "HUGGINGFACE_API_KEY",
    docsUrl: "https://huggingface.co/models",
  },
};

/** Synced with official provider docs (Jun 2026) */
export const MODEL_LIBRARY: ModelDefinition[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    description: "IDA default — frontier performance at low cost.",
    capabilities: ["chat"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "google",
    description: "Most intelligent 3.x flash for agentic and coding tasks.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "google",
    description: "Frontier-class performance at fraction of larger model cost.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "preview",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    description: "Advanced intelligence for complex reasoning and agents.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "preview",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Best price-performance for low-latency, high-volume tasks.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Fastest, most budget-friendly multimodal 2.5 model.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Deep reasoning and advanced coding capabilities.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Previous-gen workhorse (deprecated — migrate to 2.5/3.x).",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "deprecated",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    description: "Previous-gen lite model (deprecated).",
    capabilities: ["chat"],
    envKey: "GEMINI_API_KEY",
    releaseStatus: "deprecated",
    docsUrl: "https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash-lite",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    description: "Groq-hosted Llama for versatile chat.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Very fast Groq inference.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B IT",
    provider: "groq",
    description: "Google Gemma 2 on Groq hardware.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "whisper-large-v3",
    name: "Whisper Large v3",
    provider: "groq",
    description: "Speech-to-text (STT only).",
    capabilities: ["stt"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "whisper-large-v3-turbo",
    name: "Whisper Large v3 Turbo",
    provider: "groq",
    description: "Faster STT variant.",
    capabilities: ["stt"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    provider: "xai",
    description: "xAI flagship chat model — recommended for production.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://docs.x.ai/developers/models/grok-4.3",
  },
  {
    id: "grok-4.20-0309-reasoning",
    name: "Grok 4.20 Reasoning",
    provider: "xai",
    description: "Reasoning-optimized Grok 4.20 variant.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "grok-4.20-0309-non-reasoning",
    name: "Grok 4.20 Non-Reasoning",
    provider: "xai",
    description: "Fast Grok 4.20 without extended reasoning.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
    releaseStatus: "stable",
  },
  {
    id: "grok-build-0.1",
    name: "Grok Build 0.1",
    provider: "xai",
    description: "Coding-focused Grok model.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
    releaseStatus: "preview",
  },
  {
    id: "grok-2-1212",
    name: "Grok 2",
    provider: "xai",
    description: "Previous-gen Grok 2 (legacy).",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
    releaseStatus: "deprecated",
  },
  {
    id: "meta-llama/Meta-Llama-3-8B-Instruct",
    name: "Llama 3 8B Instruct",
    provider: "huggingface",
    description: "HF Inference API — Meta Llama 3 8B.",
    capabilities: ["chat"],
    envKey: "HUGGINGFACE_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct",
    provider: "huggingface",
    description: "HF Inference API — Mistral 7B.",
    capabilities: ["chat"],
    envKey: "HUGGINGFACE_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3",
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    name: "Qwen 2.5 7B Instruct",
    provider: "huggingface",
    description: "HF Inference API — Qwen 2.5 multilingual.",
    capabilities: ["chat"],
    envKey: "HUGGINGFACE_API_KEY",
    releaseStatus: "stable",
    docsUrl: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct",
  },
  {
    id: "llama-3.2-11b-vision-preview",
    name: "Llama 3.2 11B Vision",
    provider: "groq",
    description: "Groq-hosted multimodal vision for OCR.",
    capabilities: ["vision"],
    envKey: "GROQ_API_KEY",
    releaseStatus: "preview",
  },
  {
    id: "google/gemma-3-27b-it",
    name: "Gemma 3 27B IT",
    provider: "huggingface",
    description: "HF multimodal vision + text for document OCR.",
    capabilities: ["vision"],
    envKey: "HUGGINGFACE_API_KEY",
    releaseStatus: "preview",
    docsUrl: "https://huggingface.co/google/gemma-3-27b-it",
  },
];

export type ModelAvailability =
  | "available"
  | "unconfigured"
  | "deprecated"
  | "preview";

export function getModelAvailability(
  model: ModelDefinition,
): ModelAvailability {
  if (model.releaseStatus === "deprecated") return "deprecated";
  if (!isProviderConfigured(model.provider)) return "unconfigured";
  if (model.releaseStatus === "preview") return "preview";
  return "available";
}

export function getChatModels(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((model) => model.capabilities.includes("chat"));
}

export function getVisionModels(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((model) => model.capabilities.includes("vision"));
}

export function findModelDefinition(
  id: string,
  provider: ModelProvider,
): ModelDefinition | undefined {
  return MODEL_LIBRARY.find(
    (model) => model.id === id && model.provider === provider,
  );
}

export function getProviderApiKey(provider: ModelProvider): string | undefined {
  const envKey = MODEL_PROVIDERS[provider].envKey;
  return process.env[envKey]?.trim() || undefined;
}

export function isProviderConfigured(provider: ModelProvider): boolean {
  return Boolean(getProviderApiKey(provider));
}