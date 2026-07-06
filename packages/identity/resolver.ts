import type { ESLIngestResult } from "@ida/esl/entities";
import { eslStore } from "@ida/esl/store";

export class IdentityResolver {
  resolve(mapped: ESLIngestResult): ESLIngestResult {
    const existingPerson = eslStore.findPersonByEmail(mapped.person.email);
    const person = existingPerson
      ? eslStore.upsertPerson({
          ...mapped.person,
          id: existingPerson.id,
          name: mapped.person.name ?? existingPerson.name,
          organizationIds: [
            ...existingPerson.organizationIds,
            ...mapped.person.organizationIds,
          ],
          createdAt: existingPerson.createdAt,
          updatedAt: new Date().toISOString(),
        })
      : eslStore.upsertPerson(mapped.person);

    const organization = mapped.organization
      ? eslStore.upsertOrganization(mapped.organization)
      : undefined;

    const communication = {
      ...mapped.communication,
      fromPersonId: person.id,
      organizationId: organization?.id ?? mapped.communication.organizationId,
    };

    const artifact = {
      ...mapped.artifact,
      organizationId: organization?.id ?? mapped.artifact.organizationId,
    };

    eslStore.addCommunication(communication);
    eslStore.addArtifact(artifact);

    if (organization && !person.organizationIds.includes(organization.id)) {
      eslStore.upsertPerson({
        ...person,
        organizationIds: [...person.organizationIds, organization.id],
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      person,
      organization,
      communication,
      artifact,
    };
  }
}

export const identityResolver = new IdentityResolver();