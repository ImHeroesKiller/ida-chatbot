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
          organizationIds: Array.from(
            new Set([...existingPerson.organizationIds, ...mapped.person.organizationIds]),
          ),
          createdAt: existingPerson.createdAt,
          updatedAt: new Date().toISOString(),
        })
      : eslStore.upsertPerson(mapped.person);

    let organization = mapped.organization;
    if (organization?.accountId) {
      const existingOrg = eslStore.findOrganizationByAccountId(organization.accountId);
      if (existingOrg) {
        organization = eslStore.upsertOrganization({
          ...existingOrg,
          aliases: Array.from(new Set([...existingOrg.aliases, ...organization.aliases])),
          updatedAt: new Date().toISOString(),
        });
      } else {
        organization = eslStore.upsertOrganization(organization);
      }
    } else if (organization) {
      const byName = eslStore.findOrganizationByName(organization.name);
      organization = byName
        ? eslStore.upsertOrganization({
            ...byName,
            aliases: Array.from(new Set([...byName.aliases, ...organization.aliases])),
            accountId: organization.accountId ?? byName.accountId,
            updatedAt: new Date().toISOString(),
          })
        : eslStore.upsertOrganization(organization);
    }

    const communication = {
      ...mapped.communication,
      fromPersonId: person.id,
      organizationId: organization?.id ?? mapped.communication.organizationId,
    };

    const artifact = {
      ...mapped.artifact,
      organizationId: organization?.id ?? mapped.artifact.organizationId,
      companyId: organization?.accountId ?? mapped.artifact.companyId,
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