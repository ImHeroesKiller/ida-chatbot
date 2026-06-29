import {
  buildResearchSummaryMarkdown,
  RESEARCH_DEPTH_CONFIG,
} from "@/lib/research-format";
import {
  executeWebSearch,
  isWebSearchConfigured,
  type WebSearchSource,
} from "@/lib/tools/web-search";
import type { ResearchDepth, ResearchSource } from "@/lib/research-types";

export interface ResearchExecutionResult {
  success: boolean;
  topic: string;
  depth: ResearchDepth;
  queries: string[];
  sources: ResearchSource[];
  summary: string;
  formattedForLlm: string;
  error?: string;
}

function sanitizeTopic(topic: string): string {
  return topic.trim().slice(0, 500);
}

function buildQueryVariants(topic: string, depth: ResearchDepth): string[] {
  const base = sanitizeTopic(topic);
  if (!base) return [];

  const variants = [
    base,
    `${base} overview`,
    `${base} latest developments`,
    `${base} key facts and statistics`,
    `${base} expert analysis`,
    `${base} challenges and opportunities`,
  ];

  return variants.slice(0, RESEARCH_DEPTH_CONFIG[depth].queryCount);
}

function dedupeSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Set<string>();
  const result: ResearchSource[] = [];

  for (const source of sources) {
    const key = source.url.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }

  return result;
}

function formatResearchForLlm(
  topic: string,
  summary: string,
  sources: ResearchSource[],
  ragContext?: string,
): string {
  const lines = [
    `Structured research for: "${topic}"`,
    "Use these findings as factual grounding. Cite source URLs when relevant.",
    "",
  ];

  if (ragContext?.trim()) {
    lines.push("## Knowledge Base Context", ragContext.trim(), "");
  }

  lines.push("## Research Summary", summary, "", "## Source Snippets", "");

  sources.forEach((source, index) => {
    lines.push(
      `${index + 1}. ${source.title}`,
      `Query: ${source.query ?? topic}`,
      `URL: ${source.url}`,
      `Snippet: ${source.snippet}`,
      "",
    );
  });

  return lines.join("\n").trim();
}

export function isResearchConfigured(): boolean {
  return isWebSearchConfigured();
}

export async function executeResearch(options: {
  topic: string;
  depth?: ResearchDepth;
  ragContext?: string;
}): Promise<ResearchExecutionResult> {
  const topic = sanitizeTopic(options.topic);
  const depth = options.depth ?? "standard";

  if (!topic) {
    return {
      success: false,
      topic: "",
      depth,
      queries: [],
      sources: [],
      summary: "",
      formattedForLlm:
        "Research topic is empty. Ask the user for a clear research topic.",
      error: "empty_topic",
    };
  }

  if (!isResearchConfigured()) {
    return {
      success: false,
      topic,
      depth,
      queries: [],
      sources: [],
      summary: "",
      formattedForLlm:
        "Research is not configured on the server. Answer with available knowledge and note that live research is unavailable.",
      error: "not_configured",
    };
  }

  const queries = buildQueryVariants(topic, depth);
  const maxResults = RESEARCH_DEPTH_CONFIG[depth].resultsPerQuery;
  const collected: ResearchSource[] = [];

  try {
    const results = await Promise.all(
      queries.map((query) =>
        executeWebSearch({ query, maxResults }).then((result) => ({
          query,
          result,
        })),
      ),
    );

    for (const { query, result } of results) {
      for (const source of result.sources) {
        collected.push({
          ...source,
          query,
        });
      }
    }

    const sources = dedupeSources(collected);
    const successfulQueries = results
      .filter(({ result }) => result.sources.length > 0)
      .map(({ query }) => query);

    const resolvedQueries = successfulQueries.length
      ? successfulQueries
      : queries;

    const summary = buildResearchSummaryMarkdown({
      topic,
      depth,
      sources,
      queries: resolvedQueries,
      usedRag: Boolean(options.ragContext?.trim()),
    });

    return {
      success: sources.length > 0,
      topic,
      depth,
      queries: resolvedQueries,
      sources,
      summary,
      formattedForLlm: formatResearchForLlm(
        topic,
        summary,
        sources,
        options.ragContext,
      ),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Research request failed.";

    console.error("[IDA research]", { topic, depth, error: message });

    return {
      success: false,
      topic,
      depth,
      queries,
      sources: [],
      summary: "",
      formattedForLlm:
        "Research failed. Answer using knowledge base and general knowledge. Mention that live research could not be completed.",
      error: message,
    };
  }
}

export function toResearchSources(
  sources: WebSearchSource[],
  query?: string,
): ResearchSource[] {
  return sources.map((source) => ({
    ...source,
    query,
  }));
}