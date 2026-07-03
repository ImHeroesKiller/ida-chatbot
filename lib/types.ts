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

export interface IdaWebSearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface IdaResearchSource extends IdaWebSearchSource {
  query?: string;
}

export interface IdaWorkflowResultCard {
  workflowId: string;
  name: string;
  description?: string;
  nodeCount: number;
  edgeCount: number;
  mode: "created" | "edited";
  status?: "ready" | "discovery";
}

export interface IdaWorksheetResultCard {
  title: string;
  summary?: string;
  documentId?: string;
}

export interface IdaImageGenResultCard {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio?: string;
  model?: string;
}

export interface IdaVideoGenResultCard {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  aspectRatio?: string;
}

export interface IdaMusicGenResultCard {
  id: string;
  prompt: string;
  audioUrl: string;
  durationSec?: number;
}

export interface IdaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
  caption?: string;
  attachment?: IdaAttachment;
  isVoiceNote?: boolean;
  webSearchSources?: IdaWebSearchSource[];
  researchSources?: IdaResearchSource[];
  researchQueries?: string[];
  researchSummary?: string;
  workflowResult?: IdaWorkflowResultCard;
  worksheetResult?: IdaWorksheetResultCard;
  /** Map location points attached for chat cards (click opens map modal + shows dist/time). */
  mapLocations?: Array<{
    id?: string;
    lat: number;
    lng: number;
    label?: string;
  }>;
  imageGenResult?: IdaImageGenResultCard;
  videoGenResult?: IdaVideoGenResultCard;
  musicGenResult?: IdaMusicGenResultCard;
}

export interface IdaChatErrorResponse {
  error: string;
}

export interface IdaHandoffPrefill {
  topic: string;
  description: string;
}