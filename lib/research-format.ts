import type { Locale } from "@/lib/config";
import type {
  ResearchDepth,
  ResearchSession,
  ResearchSource,
} from "@/lib/research-types";

export const RESEARCH_DEPTH_CONFIG: Record<
  ResearchDepth,
  { queryCount: number; resultsPerQuery: number; estimatedSeconds: number }
> = {
  quick: { queryCount: 2, resultsPerQuery: 3, estimatedSeconds: 15 },
  standard: { queryCount: 4, resultsPerQuery: 4, estimatedSeconds: 30 },
  deep: { queryCount: 6, resultsPerQuery: 5, estimatedSeconds: 45 },
};

export type ResearchProgressStage =
  | "preparing"
  | "knowledge"
  | "searching"
  | "synthesizing";

export const RESEARCH_PROGRESS_STAGES: ResearchProgressStage[] = [
  "preparing",
  "knowledge",
  "searching",
  "synthesizing",
];

export type ResearchErrorCode =
  | "rate_limit"
  | "network"
  | "not_configured"
  | "no_results"
  | "invalid_topic"
  | "unknown";

export function groupSourcesByQuery(
  sources: ResearchSource[],
  fallbackTopic: string,
): Map<string, ResearchSource[]> {
  const grouped = new Map<string, ResearchSource[]>();

  for (const source of sources) {
    const query = source.query?.trim() || fallbackTopic;
    const list = grouped.get(query) ?? [];
    list.push(source);
    grouped.set(query, list);
  }

  return grouped;
}

function truncateSnippet(text: string, max = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

export function buildExecutiveSummary(
  topic: string,
  sources: ResearchSource[],
): string {
  if (!sources.length) {
    return "";
  }

  const highlights = sources
    .slice(0, 4)
    .map((source) => truncateSnippet(source.snippet, 160))
    .filter(Boolean);

  if (!highlights.length) {
    return `Riset tentang "${topic}" mengumpulkan ${sources.length} sumber, namun cuplikan teks terbatas.`;
  }

  return highlights.join(" ");
}

export function buildResearchSummaryMarkdown(options: {
  topic: string;
  depth: ResearchDepth;
  sources: ResearchSource[];
  queries: string[];
  usedRag?: boolean;
}): string {
  const { topic, depth, sources, queries, usedRag } = options;

  if (!sources.length) {
    return "";
  }

  const grouped = groupSourcesByQuery(sources, topic);
  const executive = buildExecutiveSummary(topic, sources);
  const depthLabel = depth.charAt(0).toUpperCase() + depth.slice(1);

  const lines = [
    `## Ringkasan Eksekutif`,
    "",
    executive,
    "",
    `## Temuan per Kueri`,
    "",
  ];

  for (const [query, querySources] of grouped) {
    lines.push(`### ${query}`);
    for (const source of querySources.slice(0, 3)) {
      lines.push(
        `- **${source.title}** — ${truncateSnippet(source.snippet, 180)}`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## Metadata",
    "",
    `- Kedalaman: ${depthLabel}`,
    `- Kueri: ${queries.length}`,
    `- Sumber unik: ${sources.length}`,
    ...(usedRag ? ["- Knowledge base: digunakan"] : []),
    "",
    "## Daftar Sumber",
    "",
  );

  sources.forEach((source, index) => {
    lines.push(`${index + 1}. [${source.title}](${source.url})`);
  });

  return lines.join("\n").trim();
}

const WORKSHEET_HEADINGS: Record<
  Locale,
  {
    executive: string;
    findings: string;
    queries: string;
    sources: string;
    meta: string;
    depth: string;
    generated: string;
  }
> = {
  id: {
    executive: "Ringkasan Eksekutif",
    findings: "Temuan Utama",
    queries: "Kueri Riset",
    sources: "Daftar Sumber",
    meta: "Metadata Riset",
    depth: "Kedalaman",
    generated: "Dibuat dari Research Tool IDA",
  },
  en: {
    executive: "Executive Summary",
    findings: "Key Findings",
    queries: "Research Queries",
    sources: "Sources",
    meta: "Research Metadata",
    depth: "Depth",
    generated: "Generated from IDA Research Tool",
  },
  zh: {
    executive: "执行摘要",
    findings: "主要发现",
    queries: "研究查询",
    sources: "来源列表",
    meta: "研究元数据",
    depth: "深度",
    generated: "由 IDA 研究工具生成",
  },
};

export function formatResearchWorksheetContent(
  session: Pick<
    ResearchSession,
    "topic" | "depth" | "summary" | "sources" | "queries"
  >,
  locale: Locale,
): string {
  const headings = WORKSHEET_HEADINGS[locale];
  const grouped = groupSourcesByQuery(session.sources, session.topic);
  const executive =
    session.summary.split("\n").find((line) => line.trim().length > 20) ??
    buildExecutiveSummary(session.topic, session.sources);

  const lines = [
    `# ${session.topic}`,
    "",
    `> ${headings.generated}`,
    "",
    `## ${headings.executive}`,
    "",
    executive,
    "",
    `## ${headings.findings}`,
    "",
  ];

  for (const [query, querySources] of grouped) {
    lines.push(`### ${query}`);
    for (const source of querySources) {
      lines.push(
        `- **${source.title}** — ${truncateSnippet(source.snippet, 200)}`,
        `  - ${source.url}`,
      );
    }
    lines.push("");
  }

  lines.push(
    `## ${headings.queries}`,
    "",
    ...session.queries.map((query) => `- ${query}`),
    "",
    `## ${headings.meta}`,
    "",
    `- ${headings.depth}: ${session.depth}`,
    `- ${locale === "zh" ? "来源" : locale === "en" ? "Sources" : "Sumber"}: ${session.sources.length}`,
    "",
    `## ${headings.sources}`,
    "",
  );

  session.sources.forEach((source, index) => {
    lines.push(`${index + 1}. [${source.title}](${source.url})`);
  });

  return lines.join("\n").trim();
}

export function mapResearchApiError(
  status: number,
  body?: { error?: string },
): { code: ResearchErrorCode; message: string } {
  const raw = body?.error?.trim() ?? "";

  if (status === 429) {
    return {
      code: "rate_limit",
      message: raw || "Rate limit exceeded.",
    };
  }

  if (status === 503) {
    return {
      code: "not_configured",
      message: raw || "Research is not configured.",
    };
  }

  if (status === 400) {
    return {
      code: "invalid_topic",
      message: raw || "Invalid research topic.",
    };
  }

  if (status === 0 || status >= 500) {
    return {
      code: "network",
      message: raw || "Network or server error.",
    };
  }

  return {
    code: "unknown",
    message: raw || "Research failed.",
  };
}

export function resolveResearchErrorMessage(
  code: ResearchErrorCode,
  locale: Locale,
  fallback?: string,
): string {
  const copy = {
    id: {
      rate_limit: "Batas permintaan tercapai. Coba lagi dalam beberapa menit.",
      network: "Koneksi gagal. Periksa internet Anda dan coba lagi.",
      not_configured: "Riset belum dikonfigurasi di server.",
      no_results: "Tidak ada sumber ditemukan untuk topik ini. Coba ubah kata kunci atau tingkatkan kedalaman.",
      invalid_topic: "Topik riset tidak valid. Gunakan minimal 3 karakter.",
      unknown: "Riset gagal. Silakan coba lagi.",
    },
    en: {
      rate_limit: "Rate limit reached. Please try again in a few minutes.",
      network: "Connection failed. Check your network and try again.",
      not_configured: "Research is not configured on the server.",
      no_results: "No sources found for this topic. Try different keywords or increase depth.",
      invalid_topic: "Invalid research topic. Use at least 3 characters.",
      unknown: "Research failed. Please try again.",
    },
    zh: {
      rate_limit: "已达到请求限制，请几分钟后再试。",
      network: "连接失败，请检查网络后重试。",
      not_configured: "服务器未配置研究功能。",
      no_results: "未找到相关来源，请尝试其他关键词或提高深度。",
      invalid_topic: "研究主题无效，请至少输入 3 个字符。",
      unknown: "研究失败，请重试。",
    },
  }[locale];

  return fallback?.trim() || copy[code] || copy.unknown;
}