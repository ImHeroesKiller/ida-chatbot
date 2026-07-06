import { generateId } from "@/core/shared/id";
import type { Observation } from "@ida/observation";

import type { ESLIngestResult } from "./entities";

export class ESLMapper {
  mapObservation(observation: Observation): ESLIngestResult {
    const rep = observation.representation;
    const extraction = observation.extraction;
    const now = new Date().toISOString();
    const from = rep.participants.find((p) => p.role === "from");

    const person = {
      id: generateId("person"),
      email: from?.email ?? "unknown@unknown.local",
      name: from?.name,
      organizationIds: [] as string[],
      createdAt: now,
      updatedAt: now,
    };

    const organization = extraction.company
      ? {
          id: generateId("org"),
          name: extraction.company,
          aliases: [extraction.company],
          createdAt: now,
          updatedAt: now,
        }
      : undefined;

    if (organization) {
      person.organizationIds.push(organization.id);
    }

    const communication = {
      id: generateId("comm"),
      representationId: rep.id,
      sourceId: rep.sourceId,
      subject: rep.title,
      snippet: rep.content,
      timestamp: rep.timestamp.toISOString(),
      fromPersonId: person.id,
      organizationId: organization?.id,
      observationId: observation.id,
      createdAt: now,
    };

    const artifact = {
      id: generateId("artifact"),
      communicationId: communication.id,
      organizationId: organization?.id,
      type: extraction.type,
      summary: extraction.summary,
      amount: extraction.amount,
      date: extraction.date,
      priority: extraction.priority,
      createdAt: now,
    };

    return { person, organization, communication, artifact };
  }
}

export const eslMapper = new ESLMapper();