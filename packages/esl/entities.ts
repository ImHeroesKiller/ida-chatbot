import type { BusinessArtifactType, PriorityLevel } from "@ida/observation";

export type CanonicalEntityType =
  | "person"
  | "organization"
  | "communication"
  | "artifact";

export interface CanonicalPerson {
  id: string;
  email: string;
  name?: string;
  organizationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalOrganization {
  id: string;
  name: string;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalCommunication {
  id: string;
  representationId: string;
  sourceId: string;
  subject: string;
  snippet: string;
  timestamp: string;
  fromPersonId: string;
  organizationId?: string;
  observationId: string;
  createdAt: string;
}

export interface CanonicalArtifact {
  id: string;
  communicationId: string;
  organizationId?: string;
  type: BusinessArtifactType;
  summary: string;
  amount?: number;
  date?: string;
  priority?: PriorityLevel;
  createdAt: string;
}

export interface ESLIngestResult {
  person: CanonicalPerson;
  organization?: CanonicalOrganization;
  communication: CanonicalCommunication;
  artifact: CanonicalArtifact;
}