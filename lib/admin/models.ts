export type ModelProvider = "google" | "groq" | "xai" | "huggingface";

export type ModelCapability = "chat" | "vision" | "embedding" | "stt";

export interface ModelDefinition {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  capabilities: ModelCapability[];
  envKey: string;
}

export const MODEL_PROVIDERS: Record<
  ModelProvider,
  { label: string; envKey: string }
> = {
  google: { label: "Google Gemini", envKey: "GEMINI_API_KEY" },
  groq: { label: "Groq", envKey: "GROQ_API_KEY" },
  xai: { label: "xAI Grok", envKey: "XAI_API_KEY" },
  huggingface: { label: "Hugging Face", envKey: "HUGGINGFACE_API_KEY" },
};

export const MODEL_LIBRARY: ModelDefinition[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast multimodal model for general chat.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Lightweight Gemini for low-latency responses.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    description: "Balanced speed and quality.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "google",
    description: "Cost-efficient flash variant.",
    capabilities: ["chat"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    description: "Higher quality for complex reasoning.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    description: "Previous-gen fast model.",
    capabilities: ["chat", "vision"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    description: "Current IDA default — ultra-fast responses.",
    capabilities: ["chat"],
    envKey: "GEMINI_API_KEY",
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    description: "Groq-hosted Llama for versatile chat.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Very fast Groq inference.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B IT",
    provider: "groq",
    description: "Google Gemma 2 on Groq hardware.",
    capabilities: ["chat"],
    envKey: "GROQ_API_KEY",
  },
  {
    id: "whisper-large-v3",
    name: "Whisper Large v3",
    provider: "groq",
    description: "Speech-to-text (STT only).",
    capabilities: ["stt"],
    envKey: "GROQ_API_KEY",
  },
  {
    id: "whisper-large-v3-turbo",
    name: "Whisper Large v3 Turbo",
    provider: "groq",
    description: "Faster STT variant.",
    capabilities: ["stt"],
    envKey: "GROQ_API_KEY",
  },
  {
    id: "grok-2-1212",
    name: "Grok 2",
    provider: "xai",
    description: "xAI Grok 2 chat model.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xai",
    description: "xAI Grok beta endpoint.",
    capabilities: ["chat"],
    envKey: "XAI_API_KEY",
  },
  {
    id: "meta-llama/Meta-Llama-3-8B-Instruct",
    name: "Llama 3 8B Instruct",
    provider: "huggingface",
    description: "HF Inference API — Llama 3 8B.",
    capabilities: ["chat"],
    envKey: "HUGGINGFACE_API_KEY",
  },
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct",
    provider: "huggingface",
    description: "HF Inference API — Mistral 7B.",
    capabilities: ["chat"],
    envKey: "HUGGINGFACE_API_KEY",
  },
];

export function getChatModels(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((model) => model.capabilities.includes("chat"));
}

export function findModelDefinition(
  id: string,
  provider: ModelProvider,
): ModelDefinition | undefined {
  return MODEL_LIBRARY.find(
    (model) => model.id === id && model.provider === provider,
  );
}

export function isProviderConfigured(provider: ModelProvider): boolean {
  const envKey = MODEL_PROVIDERS[provider].envKey;
  return Boolean(process.env[envKey]?.trim());
}