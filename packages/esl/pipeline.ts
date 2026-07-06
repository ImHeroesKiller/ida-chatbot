import { knowledgeGraphBuilder } from "@ida/graph/builder";
import { identityResolver } from "@ida/identity";
import { observationEngine } from "@ida/observation";
import {
  createEmailRepresentation,
  DEMO_GMAIL_EMAILS,
  type GmailEmailInput,
} from "@ida/representation";
import { queryEngine } from "@ida/query";

import { eslMapper } from "./mapper";
import { eslStore } from "./store";

export interface PipelineRunResult {
  mode: "demo" | "gmail";
  processed: number;
  lastSync: string;
  pipeline: Array<{
    representationId: string;
    observationId: string;
    organization?: string;
    artifactType: string;
  }>;
  overview: ReturnType<typeof queryEngine.overview>;
}

export function resetESLPipeline(): void {
  eslStore.clear();
  knowledgeGraphBuilder.clear();
}

export function runESLPipelineFromEmails(
  emails: GmailEmailInput[],
  mode: PipelineRunResult["mode"] = "demo",
): PipelineRunResult {
  const pipeline: PipelineRunResult["pipeline"] = [];

  for (const email of emails) {
    const representation = createEmailRepresentation(email);
    const observation = observationEngine.observe(representation);
    const mapped = eslMapper.mapObservation(observation);
    const resolved = identityResolver.resolve(mapped);
    knowledgeGraphBuilder.ingest(resolved);

    pipeline.push({
      representationId: representation.id,
      observationId: observation.id,
      organization: resolved.organization?.name,
      artifactType: resolved.artifact.type,
    });
  }

  return {
    mode,
    processed: pipeline.length,
    lastSync: new Date().toISOString(),
    pipeline,
    overview: queryEngine.overview(),
  };
}

export function runDemoESLPipeline(): PipelineRunResult {
  resetESLPipeline();
  return runESLPipelineFromEmails(DEMO_GMAIL_EMAILS, "demo");
}