import type { ApiErrorBody } from "@/lib/api/response";

export type ParsedApiError = {
  code: string;
  message: string;
  suggestion: string;
  requestId: string;
};

export function parseApiError(data: unknown, fallbackMessage: string): ParsedApiError {
  if (data && typeof data === "object") {
    const body = data as Partial<ApiErrorBody>;
    return {
      code: body.code ?? "UNKNOWN_ERROR",
      message:
        body.message ??
        (typeof (body as { error?: string }).error === "string"
          ? (body as { error: string }).error
          : fallbackMessage),
      suggestion: body.suggestion ?? "Retry the action or open the Debug Dashboard for diagnostics.",
      requestId: body.requestId ?? "unknown",
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: fallbackMessage,
    suggestion: "Retry the action or open the Debug Dashboard for diagnostics.",
    requestId: "unknown",
  };
}

export function formatApiError(err: ParsedApiError): string {
  return `${err.message} (${err.code}) · Ref: ${err.requestId}`;
}