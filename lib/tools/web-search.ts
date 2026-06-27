import { z } from "zod";

export const WEB_SEARCH_TOOL_NAME = "web_search";

export const DEFAULT_WEB_SEARCH_MAX_RESULTS = 5;
export const MAX_WEB_SEARCH_RESULTS = 8;
export const WEB_SEARCH_TIMEOUT_MS = 12_000;

export interface WebSearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchExecutionResult {
  success: boolean;
  query: string;
  sources: WebSearchSource[];
  formattedForLlm: string;
  error?: string;
}

export const webSearchToolSchema = z.object({
  query: z
    .string()
    .min(3)
    .max(500)
    .describe(
      "Concise search query for up-to-date information from the web (news, prices, regulations, events)",
    ),
  reason: z
    .string()
    .max(300)
    .optional()
    .describe("Brief reason why live web data is required"),
});

export type WebSearchToolInput = z.infer<typeof webSearchToolSchema>;

export const webSearchToolDefinition = {
  name: WEB_SEARCH_TOOL_NAME,
  description:
    "Search the web for current, real-time information. Use when the user asks about today's news, live prices, recent regulations, current events, or anything that changes frequently and is not available in the knowledge base.",
  schema: webSearchToolSchema,
};

const REALTIME_QUERY_PATTERNS = [
  /\b(hari ini|sekarang|saat ini|terbaru|terkini|update terbaru)\b/i,
  /\b(today|right now|currently|latest|up to date|as of)\b/i,
  /\b(今天|现在|最新|实时|当前)\b/,
  /\b(harga|kurs|nilai tukar|saham|emas|bitcoin|crypto)\b/i,
  /\b(price|stock|exchange rate|gold|silver|oil)\b/i,
  /\b(berita|news|headline|breaking)\b/i,
  /\b(202[4-9]|20[3-9][0-9])\b/,
];

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export function looksLikeRealtimeQuery(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 4) return false;
  return REALTIME_QUERY_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function clampMaxResults(maxResults?: number): number {
  const value = maxResults ?? DEFAULT_WEB_SEARCH_MAX_RESULTS;
  return Math.min(Math.max(Math.floor(value), 1), MAX_WEB_SEARCH_RESULTS);
}

function sanitizeQuery(query: string): string {
  return query.trim().slice(0, 500);
}

function formatSourcesForLlm(
  query: string,
  sources: WebSearchSource[],
): string {
  if (!sources.length) {
    return `Web search for "${query}" returned no usable results. Answer using existing knowledge and state that live data was unavailable.`;
  }

  const lines = [
    `Web search results for: "${query}"`,
    "Use these snippets as factual grounding. Cite source URLs in your answer.",
    "",
  ];

  sources.forEach((source, index) => {
    lines.push(
      `${index + 1}. ${source.title}`,
      `URL: ${source.url}`,
      `Snippet: ${source.snippet}`,
      "",
    );
  });

  return lines.join("\n").trim();
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

async function searchWithTavily(
  query: string,
  maxResults: number,
): Promise<WebSearchSource[]> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Tavily search failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      );
    }

    const data = (await response.json()) as TavilyResponse;

    return (data.results ?? [])
      .map((item) => ({
        title: item.title?.trim() || "Untitled",
        url: item.url?.trim() || "",
        snippet: (item.content ?? "").trim().slice(0, 600),
      }))
      .filter((item) => item.url.length > 0 && item.snippet.length > 0)
      .slice(0, maxResults);
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeWebSearch(options: {
  query: string;
  maxResults?: number;
}): Promise<WebSearchExecutionResult> {
  const query = sanitizeQuery(options.query);
  const maxResults = clampMaxResults(options.maxResults);

  if (!isWebSearchConfigured()) {
    return {
      success: false,
      query,
      sources: [],
      formattedForLlm:
        "Web search is not configured on the server. Answer with available knowledge and note that live web data is unavailable.",
      error: "not_configured",
    };
  }

  try {
    const sources = await searchWithTavily(query, maxResults);

    return {
      success: sources.length > 0,
      query,
      sources,
      formattedForLlm: formatSourcesForLlm(query, sources),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Web search request failed.";

    console.error("[IDA web-search]", { query, error: message });

    return {
      success: false,
      query,
      sources: [],
      formattedForLlm:
        "Web search failed. Answer using knowledge base and general knowledge. Mention that live web data could not be retrieved.",
      error: message,
    };
  }
}