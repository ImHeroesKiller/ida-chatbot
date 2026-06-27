export type IdaAttachmentType = "image" | "pdf";

export interface IdaAttachment {
  id: string;
  type: IdaAttachmentType;
  fileName: string;
  mimeType: string;
  previewDataUrl?: string;
  extractedText?: string;
  summary?: string;
}

export interface IdaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
  caption?: string;
  attachment?: IdaAttachment;
  isVoiceNote?: boolean;
}

export interface IdaChatErrorResponse {
  error: string;
}

export interface IdaHandoffPrefill {
  topic: string;
  description: string;
}