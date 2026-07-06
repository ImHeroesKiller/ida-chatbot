export type GmailErrorCode =
  | "GMAIL_NOT_CONFIGURED"
  | "GMAIL_NO_CODE"
  | "GMAIL_OAUTH_FAILED"
  | "GMAIL_ACCESS_DENIED"
  | "GMAIL_SYNC_FAILED";

export type UploadErrorCode =
  | "UPLOAD_PAYLOAD_TOO_LARGE"
  | "UPLOAD_NO_FILES"
  | "UPLOAD_UNSUPPORTED_FILE"
  | "UPLOAD_EXTRACTION_FAILED"
  | "UPLOAD_PARSE_FAILED"
  | "UPLOAD_FAILED";

export const GMAIL_ERRORS: Record<
  GmailErrorCode,
  { message: string; suggestion: string; status: number }
> = {
  GMAIL_NOT_CONFIGURED: {
    message: "Gmail OAuth is not configured on this server.",
    suggestion:
      "Follow the setup wizard at /docs/setup/gmail, or use Load demo emails for the investor demo.",
    status: 503,
  },
  GMAIL_NO_CODE: {
    message: "Google did not return an authorization code.",
    suggestion: "Try connecting again from Import Data. If it persists, check redirect URI in Google Cloud Console.",
    status: 400,
  },
  GMAIL_OAUTH_FAILED: {
    message: "Gmail authorization failed.",
    suggestion:
      "Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI match your Google Cloud OAuth client.",
    status: 502,
  },
  GMAIL_ACCESS_DENIED: {
    message: "Gmail access was denied.",
    suggestion: "Approve the Gmail read-only permission when prompted, or use Load demo emails instead.",
    status: 403,
  },
  GMAIL_SYNC_FAILED: {
    message: "Gmail sync failed unexpectedly.",
    suggestion: "Check server logs for the requestId, then retry or use Load demo emails.",
    status: 500,
  },
};

export const UPLOAD_ERRORS: Record<
  UploadErrorCode,
  { message: string; suggestion: string; status: number }
> = {
  UPLOAD_PAYLOAD_TOO_LARGE: {
    message: "Upload is too large for the server.",
    suggestion: "Upload one file at a time under 4 MB, or split large PDFs before importing.",
    status: 413,
  },
  UPLOAD_NO_FILES: {
    message: "No files were uploaded.",
    suggestion: "Select or drag a PDF or DOCX file, then try again.",
    status: 400,
  },
  UPLOAD_UNSUPPORTED_FILE: {
    message: "Unsupported file type.",
    suggestion: "Use PDF (.pdf) or Word (.docx) only. Scanned images without text may fail extraction.",
    status: 400,
  },
  UPLOAD_EXTRACTION_FAILED: {
    message: "Could not extract text from the document.",
    suggestion: "Ensure the file is not password-protected and contains selectable text (not a blank scan).",
    status: 400,
  },
  UPLOAD_PARSE_FAILED: {
    message: "Could not read the upload payload.",
    suggestion: "Retry the upload. If the file is very large, try a smaller document.",
    status: 400,
  },
  UPLOAD_FAILED: {
    message: "Document upload failed.",
    suggestion: "Check server logs for the requestId, then retry with a smaller PDF or DOCX.",
    status: 500,
  },
};

export function mapGmailQueryError(param: string | null): GmailErrorCode {
  switch (param) {
    case "not_configured":
      return "GMAIL_NOT_CONFIGURED";
    case "no_code":
      return "GMAIL_NO_CODE";
    case "access_denied":
      return "GMAIL_ACCESS_DENIED";
    case "oauth_failed":
    default:
      return "GMAIL_OAUTH_FAILED";
  }
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isPayloadTooLargeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("payload too large") ||
    msg.includes("body exceeded") ||
    msg.includes("request entity too large") ||
    msg.includes("content length") ||
    msg.includes("413")
  );
}