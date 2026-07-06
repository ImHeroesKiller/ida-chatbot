import type {
  CanonicalArtifact,
  CanonicalCommunication,
  CanonicalOrganization,
  CanonicalPerson,
} from "./entities";

export class ESLMemoryStore {
  private persons = new Map<string, CanonicalPerson>();
  private organizations = new Map<string, CanonicalOrganization>();
  private communications = new Map<string, CanonicalCommunication>();
  private artifacts = new Map<string, CanonicalArtifact>();

  upsertPerson(person: CanonicalPerson): CanonicalPerson {
    const existing = this.persons.get(person.id);
    if (existing) {
      const merged: CanonicalPerson = {
        ...existing,
        ...person,
        organizationIds: Array.from(
          new Set([...existing.organizationIds, ...person.organizationIds]),
        ),
        updatedAt: person.updatedAt,
      };
      this.persons.set(person.id, merged);
      return merged;
    }
    this.persons.set(person.id, person);
    return person;
  }

  upsertOrganization(org: CanonicalOrganization): CanonicalOrganization {
    const byName = this.findOrganizationByName(org.name);
    if (byName) {
      const merged: CanonicalOrganization = {
        ...byName,
        aliases: Array.from(new Set([...byName.aliases, ...org.aliases])),
        updatedAt: org.updatedAt,
      };
      this.organizations.set(byName.id, merged);
      return merged;
    }
    this.organizations.set(org.id, org);
    return org;
  }

  addCommunication(communication: CanonicalCommunication): void {
    this.communications.set(communication.id, communication);
  }

  addArtifact(artifact: CanonicalArtifact): void {
    this.artifacts.set(artifact.id, artifact);
  }

  findOrganizationByName(name: string): CanonicalOrganization | undefined {
    const normalized = name.trim().toUpperCase();
    for (const org of this.organizations.values()) {
      if (
        org.name.toUpperCase() === normalized ||
        org.aliases.some((alias) => alias.toUpperCase() === normalized)
      ) {
        return org;
      }
    }
    return undefined;
  }

  findPersonByEmail(email: string): CanonicalPerson | undefined {
    const normalized = email.trim().toLowerCase();
    for (const person of this.persons.values()) {
      if (person.email === normalized) return person;
    }
    return undefined;
  }

  getSnapshot() {
    return {
      persons: Array.from(this.persons.values()),
      organizations: Array.from(this.organizations.values()),
      communications: Array.from(this.communications.values()),
      artifacts: Array.from(this.artifacts.values()),
      counts: {
        persons: this.persons.size,
        organizations: this.organizations.size,
        communications: this.communications.size,
        artifacts: this.artifacts.size,
      },
    };
  }

  clear(): void {
    this.persons.clear();
    this.organizations.clear();
    this.communications.clear();
    this.artifacts.clear();
  }
}

export const eslStore = new ESLMemoryStore();