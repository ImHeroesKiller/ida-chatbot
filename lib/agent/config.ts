import { isModelConfigured } from "@/lib/admin/model-selection";
import { loadAppConfig } from "@/lib/admin/config";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";

import { isE2bConfigured } from "./sandbox/e2b-executor";

export type AgentApiServiceId =
  | "gemini"
  | "supabase_auth"
  | "supabase_rag"
  | "e2b"
  | "redis"
  | "agent_api";

export type AgentApiServiceStatus = "ready" | "optional" | "missing" | "error";

export interface AgentApiServiceInfo {
  id: AgentApiServiceId;
  name: string;
  status: AgentApiServiceStatus;
  envKeys: string[];
  description: string;
  docsUrl?: string;
  required: boolean;
}

export interface AgentApiStatusResponse {
  ready: boolean;
  services: AgentApiServiceInfo[];
  endpoints: {
    agent: string;
    agentStatus: string;
    chat: string;
    vision: string;
  };
}

function hasEnv(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export async function getAgentApiStatus(
  baseUrl = "",
): Promise<AgentApiStatusResponse> {
  let geminiStatus: AgentApiServiceStatus = "missing";
  try {
    const appConfig = await loadAppConfig();
    geminiStatus = isModelConfigured(appConfig.defaultModel)
      ? "ready"
      : "missing";
  } catch {
    geminiStatus = hasEnv("GEMINI_API_KEY") ? "ready" : "missing";
  }

  const supabaseAuthStatus: AgentApiServiceStatus = isSupabasePublicConfigured()
    ? "ready"
    : "missing";

  const supabaseRagStatus: AgentApiServiceStatus = isSupabaseConfigured()
    ? hasEnv("GEMINI_API_KEY")
      ? "ready"
      : "missing"
    : "optional";

  const e2bStatus: AgentApiServiceStatus = isE2bConfigured() ? "ready" : "optional";

  const redisStatus: AgentApiServiceStatus =
    hasEnv("REDIS_URL") ||
    (hasEnv("UPSTASH_REDIS_REST_URL") && hasEnv("UPSTASH_REDIS_REST_TOKEN"))
      ? "ready"
      : "optional";

  const services: AgentApiServiceInfo[] = [
    {
      id: "gemini",
      name: "Google Gemini (LLM)",
      status: geminiStatus,
      envKeys: ["GEMINI_API_KEY"],
      description:
        "Workflow planning, document analysis, dan ekstraksi PDF via Vision.",
      docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
      required: true,
    },
    {
      id: "supabase_auth",
      name: "Supabase Auth (Google OAuth)",
      status: supabaseAuthStatus,
      envKeys: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ],
      description: "Login Google untuk mengakses /agent dan /api/agent.",
      docsUrl: "https://supabase.com/docs/guides/auth",
      required: true,
    },
    {
      id: "supabase_rag",
      name: "Supabase RAG (Knowledge Base)",
      status: supabaseRagStatus,
      envKeys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GEMINI_API_KEY"],
      description:
        "Konteks perusahaan via vector search (ida_document_chunks).",
      docsUrl: "https://supabase.com/docs/guides/ai",
      required: false,
    },
    {
      id: "e2b",
      name: "E2B Cloud Sandbox",
      status: e2bStatus,
      envKeys: ["E2B_API_KEY"],
      description:
        "Eksekusi Python/Playwright di microVM terisolasi. Tanpa key = mode simulasi.",
      docsUrl: "https://e2b.dev/docs/api-key",
      required: false,
    },
    {
      id: "redis",
      name: "Redis Checkpointer",
      status: redisStatus,
      envKeys: [
        "REDIS_URL",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
      ],
      description:
        "Persistensi state workflow LangGraph. Tanpa Redis = memory (dev).",
      docsUrl: "https://upstash.com/docs/redis/overall/getstarted",
      required: false,
    },
    {
      id: "agent_api",
      name: "AgentFlow API",
      status: geminiStatus === "ready" && supabaseAuthStatus === "ready"
        ? "ready"
        : "missing",
      envKeys: [],
      description: "POST /api/agent — orchestration entry point.",
      required: true,
    },
  ];

  const ready = services
    .filter((s) => s.required)
    .every((s) => s.status === "ready");

  const prefix = baseUrl.replace(/\/$/, "");

  return {
    ready,
    services,
    endpoints: {
      agent: `${prefix}/api/agent`,
      agentStatus: `${prefix}/api/agent/status`,
      chat: `${prefix}/api/chat`,
      vision: `${prefix}/api/vision`,
    },
  };
}