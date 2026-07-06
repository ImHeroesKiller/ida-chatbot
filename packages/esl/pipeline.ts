import { knowledgeGraphBuilder } from "@ida/graph/builder";
import { identityResolver } from "@ida/identity";
import { observationEngine } from "@ida/observation";
import {
  createDocumentRepresentation,
  createEmailRepresentation,
  DEMO_GMAIL_EMAILS,
  type DocumentInput,
  type GmailEmailInput,
  type Representation,
} from "@ida/representation";
import { queryEngine } from "@ida/query";

import { persistESLStore } from "./persistence";
import { eslMapper } from "./mapper";
import { eslStore } from "./store";

export interface PipelineRunResult {
  mode: "demo" | "gmail" | "document" | "append";
  processed: number;
  lastSync: string;
  pipeline: Array<{
    representationId: string;
    observationId: string;
    organization?: string;
    accountId?: string;
    artifactType: string;
  }>;
  overview: ReturnType<typeof queryEngine.overview>;
}

export function resetESLPipeline(): void {
  eslStore.clear();
  knowledgeGraphBuilder.clear();
}

export function ingestRepresentation(representation: Representation): PipelineRunResult["pipeline"][0] {
  const observation = observationEngine.observe(representation);
  const mapped = eslMapper.mapObservation(observation);
  const resolved = identityResolver.resolve(mapped);
  knowledgeGraphBuilder.ingest(resolved);

  return {
    representationId: representation.id,
    observationId: observation.id,
    organization: resolved.organization?.name,
    accountId: resolved.organization?.accountId,
    artifactType: resolved.artifact.type,
  };
}

export async function runESLPipelineFromEmails(
  emails: GmailEmailInput[],
  mode: PipelineRunResult["mode"] = "demo",
  options?: { reset?: boolean },
): Promise<PipelineRunResult> {
  if (options?.reset) {
    resetESLPipeline();
  }

  const pipeline: PipelineRunResult["pipeline"] = [];

  for (const email of emails) {
    const representation = createEmailRepresentation(email);
    pipeline.push(ingestRepresentation(representation));
  }

  await persistESLStore();

  return {
    mode,
    processed: pipeline.length,
    lastSync: new Date().toISOString(),
    pipeline,
    overview: queryEngine.overview(),
  };
}

export async function runESLPipelineFromDocuments(
  documents: DocumentInput[],
): Promise<PipelineRunResult> {
  const pipeline: PipelineRunResult["pipeline"] = [];

  for (const doc of documents) {
    const representation = createDocumentRepresentation(doc);
    pipeline.push(ingestRepresentation(representation));
  }

  await persistESLStore();

  return {
    mode: "document",
    processed: pipeline.length,
    lastSync: new Date().toISOString(),
    pipeline,
    overview: queryEngine.overview(),
  };
}

export async function runDemoESLPipeline(): Promise<PipelineRunResult> {
  resetESLPipeline();
  return runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo", { reset: false });
}