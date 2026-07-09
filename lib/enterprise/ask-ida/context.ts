import {
  BRIEF_CARDS,
  COMPANIES,
  MEMORY_ITEMS,
  PEOPLE,
  PROJECTS,
} from "@/components/enterprise/experience/mock-data";
import { hydrateESLStore } from "@ida/esl/persistence";
import { eslStore } from "@ida/esl/store";
import { queryEngine } from "@ida/query";

const MAX_CONTEXT_CHARS = 14_000;

function truncate(text: string, max = MAX_CONTEXT_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[…context truncated for model limits…]`;
}

function buildDemoMemoryContext(): string {
  const companies = COMPANIES.map(
    (c) =>
      `- ${c.name} (${c.sector}) · health ${c.health}% · ${c.revenue}\n  ${c.summary}`,
  ).join("\n");

  const people = PEOPLE.slice(0, 12)
    .map(
      (p) =>
        `- ${p.name} · ${p.role} · ${p.email ?? "n/a"}\n  ${p.summary}`,
    )
    .join("\n");

  const projects = PROJECTS.map(
    (p) =>
      `- ${p.name} · status ${p.status} · budget ${p.budget} · progress ${p.progress}%\n  ${p.summary}`,
  ).join("\n");

  const brief = BRIEF_CARDS.slice(0, 10)
    .map(
      (b) =>
        `- [${b.tone}] ${b.title}${b.metric ? ` · ${b.metric}` : ""}\n  ${b.description}`,
    )
    .join("\n");

  const memory = MEMORY_ITEMS.slice(0, 12)
    .map((m) => `- [${m.tab}] ${m.title} (${m.date})\n  ${m.subtitle}`)
    .join("\n");

  return [
    "## Demo Organization Memory (canonical enterprise scenario)",
    "### Accounts",
    companies,
    "### People / Stakeholders",
    people,
    "### Projects / Initiatives",
    projects,
    "### Executive Brief signals",
    brief,
    "### Knowledge records (sample)",
    memory,
  ].join("\n\n");
}

function buildEslContext(): {
  text: string;
  hasLiveData: boolean;
  queryResult: unknown;
  overviewSummary: string;
} {
  const snapshot = eslStore.getSnapshot();
  const hasLiveData =
    snapshot.communications.length > 0 ||
    snapshot.organizations.length > 0 ||
    snapshot.artifacts.length > 0;

  if (!hasLiveData) {
    return {
      text: "",
      hasLiveData: false,
      queryResult: null,
      overviewSummary: "No live ESL records yet.",
    };
  }

  const overview = queryEngine.overview();
  const orgLines = overview.organizationSummaries
    .slice(0, 12)
    .map(
      (o) =>
        `- ${o.organization}: ${o.communications} comms, ${o.artifacts} artifacts, ${o.highPriority} high-priority`,
    )
    .join("\n");

  const attention = overview.attentionItems
    .slice(0, 8)
    .map(
      (a) =>
        `- [${a.priority ?? "n/a"}] ${a.title}${a.organization ? ` (${a.organization})` : ""}\n  ${a.summary}`,
    )
    .join("\n");

  const recentComms = snapshot.communications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10)
    .map((c) => {
      const org = snapshot.organizations.find((o) => o.id === c.organizationId);
      return `- ${c.timestamp} · ${org?.name ?? "Unknown org"} · ${c.subject ?? "(no subject)"}`;
    })
    .join("\n");

  const people = snapshot.persons
    .slice(0, 15)
    .map((p) => `- ${p.name}${p.email ? ` <${p.email}>` : ""}`)
    .join("\n");

  const text = [
    "## Live ESL / Knowledge Graph snapshot",
    `Counts: ${snapshot.counts.organizations} orgs · ${snapshot.counts.persons} people · ${snapshot.counts.communications} communications · ${snapshot.counts.artifacts} artifacts`,
    "### Organization summaries",
    orgLines || "(none)",
    "### Attention items",
    attention || "(none)",
    "### Recent communications",
    recentComms || "(none)",
    "### People (sample)",
    people || "(none)",
  ].join("\n\n");

  return {
    text,
    hasLiveData: true,
    queryResult: null,
    overviewSummary: orgLines,
  };
}

export type AskIdaContextBundle = {
  contextText: string;
  hasLiveData: boolean;
  queryResult: unknown;
};

/**
 * Build corporate context for Ask IDA: live ESL when available + demo org memory.
 * Always includes demo memory so the Decision OS demo works without Gmail import.
 */
export async function buildAskIdaContext(
  question: string,
): Promise<AskIdaContextBundle> {
  await hydrateESLStore();

  const esl = buildEslContext();
  let queryResult: unknown = null;

  if (esl.hasLiveData) {
    try {
      queryResult = queryEngine.queryText(question);
    } catch {
      queryResult = null;
    }
  }

  const queryBlock =
    queryResult != null
      ? `## Query engine hit for this question\n${JSON.stringify(queryResult, null, 2).slice(0, 4000)}`
      : "";

  const parts = [
    esl.text,
    buildDemoMemoryContext(),
    queryBlock,
  ].filter(Boolean);

  return {
    contextText: truncate(parts.join("\n\n---\n\n")),
    hasLiveData: esl.hasLiveData,
    queryResult,
  };
}
