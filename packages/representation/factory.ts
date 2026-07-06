import { generateId } from "@/core/shared/id";

import type { GmailEmailInput, Representation, RepresentationParticipant } from "./types";

function parseFromHeader(from: string): RepresentationParticipant {
  const match = from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return {
      email: match[2].trim().toLowerCase(),
      name: match[1]?.trim() || undefined,
      role: "from",
    };
  }

  return {
    email: from.trim().toLowerCase(),
    role: "from",
  };
}

export function createEmailRepresentation(input: GmailEmailInput): Representation {
  const participants = [parseFromHeader(input.from)];

  return {
    id: generateId("rep"),
    sourceType: "gmail",
    sourceId: input.id,
    title: input.subject,
    content: input.snippet,
    participants,
    timestamp: new Date(input.date),
    rawPayload: input,
    metadata: {
      channel: "email",
      subject: input.subject,
    },
  };
}

export type DocumentInput = {
  filename: string;
  text: string;
  docKind: "pdf" | "docx";
};

export function createDocumentRepresentation(input: DocumentInput): Representation {
  const title = input.filename.replace(/\.(pdf|docx)$/i, "").replace(/[-_]/g, " ");

  return {
    id: generateId("rep"),
    sourceType: "document",
    sourceId: input.filename,
    title,
    content: input.text,
    participants: [],
    timestamp: new Date(),
    rawPayload: { filename: input.filename },
    metadata: {
      channel: "document",
      docKind: input.docKind,
      filename: input.filename,
    },
  };
}