export type SourceType = "gmail" | "whatsapp" | "document" | "meeting";

export type ParticipantRole = "from" | "to" | "cc";

export interface RepresentationParticipant {
  email: string;
  name?: string;
  role: ParticipantRole;
}

export interface Representation {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  title: string;
  content: string;
  participants: RepresentationParticipant[];
  timestamp: Date;
  rawPayload?: unknown;
  metadata: Record<string, unknown>;
}

export interface GmailEmailInput {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}