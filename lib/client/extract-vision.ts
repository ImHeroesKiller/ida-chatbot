import type { Locale } from "@/lib/config";
import type { IdaAttachmentType } from "@/lib/types";

export interface VisionExtractResponse {
  extractedText: string;
  summary: string;
  fileType: IdaAttachmentType;
  fileName: string;
}

export class VisionExtractError extends Error {
  readonly code: "rate_limit" | "config" | "empty" | "network" | "unknown";

  constructor(
    message: string,
    code: VisionExtractError["code"] = "unknown",
  ) {
    super(message);
    this.name = "VisionExtractError";
    this.code = code;
  }
}

export async function extractVisionFromFile(options: {
  data: string;
  mimeType: string;
  fileName: string;
  locale: Locale;
  sessionId?: string;
}): Promise<VisionExtractResponse> {
  let response: Response;

  try {
    response = await fetch("/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
  } catch {
    throw new VisionExtractError("Network error during OCR.", "network");
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    extractedText?: string;
    summary?: string;
    fileType?: IdaAttachmentType;
    fileName?: string;
  };

  if (!response.ok) {
    if (response.status === 429) {
      throw new VisionExtractError(
        data.error ?? "Rate limit exceeded.",
        "rate_limit",
      );
    }
    if (response.status === 503) {
      throw new VisionExtractError(
        data.error ?? "Vision service unavailable.",
        "config",
      );
    }
    throw new VisionExtractError(
      data.error ?? "Failed to extract text from file.",
      "unknown",
    );
  }

  if (!data.extractedText?.trim()) {
    throw new VisionExtractError(
      "No readable text found in the file.",
      "empty",
    );
  }

  return {
    extractedText: data.extractedText,
    summary: data.summary ?? "",
    fileType: data.fileType ?? "image",
    fileName: data.fileName ?? options.fileName,
  };
}