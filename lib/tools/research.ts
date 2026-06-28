import {
  executeWebSearch,
  isWebSearchConfigured,
  type WebSearchSource,
} from "@/lib/tools/web-search";
import type { ResearchDepth, ResearchSource } from "@/lib/research-types";

const DEPTH_QUERY_COUNT: Record<ResearchDepth, number> = {
  quick: 2,
  standard: 4,
  deep: 6,
};

const DEPTH_RESULTS_PER_QUERY: Record<ResearchDepth, number> = {
  quick: 3,
  standard: 4,
  deep: 5,
};

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

  return variants.slice(0, DEPTH_QUERY_COUNT[depth]);
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

function buildResearchSummary(
  topic: string,
  sources: ResearchSource[],
  queries: string[],
): string {
  if (!sources.length) {
    return `No research results found for "${topic}".`;
  }

  const lines = [
    `# Research: ${topic}`,
    "",
    `**Queries used:** ${queries.length}`,
    "",
    "## Summary",
    "",
  ];

  const grouped = new Map<string, ResearchSource[]>();
  for (const source of sources) {
    const query = source.query ?? topic;
    const list = grouped.get(query) ?? [];
    list.push(source);
    grouped.set(query, list);
  }

  for (const [query, querySources] of grouped) {
    lines.push(`### ${query}`);
    for (const source of querySources.slice(0, 3)) {
      lines.push(`- **${source.title}**: ${source.snippet.slice(0, 200)}`);
    }
    lines.push("");
  }

  lines.push("## Sources", "");
  sources.forEach((source, index) => {
    lines.push(`${index + 1}. [${source.title}](${source.url})`);
  });

  return lines.join("\n").trim();
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
  const maxResults = DEPTH_RESULTS_PER_QUERY[depth];
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

    const summary = buildResearchSummary(
      topic,
      sources,
      successfulQueries.length ? successfulQueries : queries,
    );

    return {
      success: sources.length > 0,
      topic,
      depth,
      queries: successfulQueries.length ? successfulQueries : queries,
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