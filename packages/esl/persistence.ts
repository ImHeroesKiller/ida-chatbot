import { promises as fs } from "fs";
import path from "path";

import { knowledgeGraphBuilder } from "@ida/graph/builder";

import type {
  CanonicalArtifact,
  CanonicalCommunication,
  CanonicalOrganization,
  CanonicalPerson,
} from "./entities";
import { eslStore } from "./store";

export type ESLSnapshot = {
  persons: CanonicalPerson[];
  organizations: CanonicalOrganization[];
  communications: CanonicalCommunication[];
  artifacts: CanonicalArtifact[];
  lastSync: string | null;
};

const globalForESL = globalThis as unknown as {
  eslHydrated?: boolean;
};

function storePath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "ida-esl-store.json");
  }
  return path.join(process.cwd(), ".data", "ida-esl-store.json");
}

export async function persistESLStore(): Promise<void> {
  const snapshot = eslStore.exportSnapshot();
  const dir = path.dirname(storePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(snapshot, null, 2), "utf-8");
}

export async function hydrateESLStore(): Promise<ESLSnapshot | null> {
  if (globalForESL.eslHydrated) {
    return eslStore.exportSnapshot();
  }

  try {
    const raw = await fs.readFile(storePath(), "utf-8");
    const snapshot = JSON.parse(raw) as ESLSnapshot;
    eslStore.importSnapshot(snapshot);
    rebuildGraphFromStore();
    globalForESL.eslHydrated = true;
    return snapshot;
  } catch {
    globalForESL.eslHydrated = true;
    return null;
  }
}

export function rebuildGraphFromStore(): void {
  knowledgeGraphBuilder.clear();
  const snapshot = eslStore.getSnapshot();

  for (const comm of snapshot.communications) {
    const person = snapshot.persons.find((p) => p.id === comm.fromPersonId);
    const organization = comm.organizationId
      ? snapshot.organizations.find((o) => o.id === comm.organizationId)
      : undefined;
    const artifact = snapshot.artifacts.find((a) => a.communicationId === comm.id);

    if (!person || !artifact) continue;

    knowledgeGraphBuilder.ingest({
      person,
      organization,
      communication: comm,
      artifact,
    });
  }
}