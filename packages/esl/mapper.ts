import { generateId } from "@/core/shared/id";
import type { Observation } from "@ida/observation";
import { ACCOUNT_DIRECTORY } from "@ida/observation";

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
      name: from?.name ?? extraction.stakeholder,
      organizationIds: [] as string[],
      createdAt: now,
      updatedAt: now,
    };

    const accountMeta = extraction.companyId
      ? ACCOUNT_DIRECTORY.find((a) => a.id === extraction.companyId)
      : undefined;

    const organization = extraction.company
      ? {
          id: generateId("org"),
          name: extraction.company,
          accountId: extraction.companyId ?? accountMeta?.id,
          aliases: [
            extraction.company,
            ...(accountMeta?.keywords ?? []),
            ...(accountMeta?.id ? [accountMeta.id.toUpperCase()] : []),
          ],
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
      snippet: rep.content.slice(0, 500),
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
      companyId: extraction.companyId,
      type: extraction.type,
      summary: extraction.summary,
      amount: extraction.amount,
      date: extraction.date,
      deadline: extraction.deadline,
      stakeholder: extraction.stakeholder,
      priority: extraction.priority,
      sourceType: rep.sourceType,
      createdAt: now,
    };

    return { person, organization, communication, artifact };
  }
}

export const eslMapper = new ESLMapper();