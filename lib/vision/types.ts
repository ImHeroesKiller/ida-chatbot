export type VisionFileType = "image" | "pdf";

export interface VisionExtractRequest {
  data: string;
  mimeType: string;
  fileName: string;
  locale: "id" | "en" | "zh";
}

export interface VisionExtractResult {
  extractedText: string;
  summary: string;
  fileType: VisionFileType;
  fileName: string;
}