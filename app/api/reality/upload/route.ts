import { NextRequest } from "next/server";

import {
  isPayloadTooLargeError,
  MAX_UPLOAD_BYTES,
  UPLOAD_ERRORS,
  type UploadErrorCode,
} from "@/lib/api/errors";
import { getRequestId } from "@/lib/api/request-id";
import { apiError, jsonWithRequestId } from "@/lib/api/response";
import { buildRealityViewModel } from "@/lib/enterprise/reality-adapter";
import {
  detectDocKind,
  extractTextFromDocx,
  extractTextFromPdf,
} from "@/lib/integrations/document-extract";
import { createLogger } from "@/lib/logger";
import { hydrateESLStore } from "@ida/esl/persistence";
import { runESLPipelineFromDocuments } from "@ida/esl/pipeline";
import { eslStore } from "@ida/esl/store";

function uploadError(
  requestId: string,
  code: UploadErrorCode,
  detail?: string,
) {
  const spec = UPLOAD_ERRORS[code];
  return apiError(
    requestId,
    code,
    detail ? `${spec.message} ${detail}` : spec.message,
    spec.suggestion,
    spec.status,
  );
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const log = createLogger("reality.upload", requestId);

  log.info("request.start");

  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_UPLOAD_BYTES) {
      log.warn("request.payload_too_large", { contentLength: Number(contentLength) });
      return uploadError(requestId, "UPLOAD_PAYLOAD_TOO_LARGE");
    }

    log.debug("hydrate.start");
    await hydrateESLStore();
    log.debug("hydrate.done");

    log.debug("parse.form_data.start");
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      if (isPayloadTooLargeError(error)) {
        log.warn("parse.payload_too_large");
        return uploadError(requestId, "UPLOAD_PAYLOAD_TOO_LARGE");
      }
      log.error("parse.form_data.failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return uploadError(requestId, "UPLOAD_PARSE_FAILED");
    }
    log.debug("parse.form_data.done");

    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    log.info("files.received", { count: files.length });

    if (files.length === 0) {
      log.warn("files.empty");
      return uploadError(requestId, "UPLOAD_NO_FILES");
    }

    const documents = [];

    for (const file of files) {
      log.debug("file.inspect", { name: file.name, size: file.size, type: file.type });

      if (file.size > MAX_UPLOAD_BYTES) {
        log.warn("file.too_large", { name: file.name, size: file.size });
        return uploadError(requestId, "UPLOAD_PAYLOAD_TOO_LARGE", `(${file.name})`);
      }

      const kind = detectDocKind(file.name);
      if (!kind) {
        log.warn("file.unsupported", { name: file.name });
        return uploadError(requestId, "UPLOAD_UNSUPPORTED_FILE", `(${file.name})`);
      }

      log.debug("extract.start", { name: file.name, kind });
      const buffer = Buffer.from(await file.arrayBuffer());
      let text: string;
      try {
        text =
          kind === "pdf"
            ? await extractTextFromPdf(buffer)
            : await extractTextFromDocx(buffer);
      } catch (error) {
        log.error("extract.failed", {
          name: file.name,
          error: error instanceof Error ? error.message : String(error),
        });
        return uploadError(requestId, "UPLOAD_EXTRACTION_FAILED", `(${file.name})`);
      }

      if (!text.trim()) {
        log.warn("extract.empty", { name: file.name });
        return uploadError(requestId, "UPLOAD_EXTRACTION_FAILED", `(${file.name})`);
      }

      log.info("extract.done", { name: file.name, chars: text.length });
      documents.push({ filename: file.name, text, docKind: kind });
    }

    log.debug("pipeline.start", { documents: documents.length });
    const result = await runESLPipelineFromDocuments(documents);
    log.info("pipeline.done", { processed: result.processed });

    const viewModel = buildRealityViewModel(eslStore.exportSnapshot());
    log.info("request.success", { uploaded: documents.length });

    return jsonWithRequestId(
      {
        success: true,
        uploaded: documents.length,
        pipeline: result,
        ...viewModel,
      },
      requestId,
    );
  } catch (error) {
    if (isPayloadTooLargeError(error)) {
      log.warn("request.payload_too_large");
      return uploadError(requestId, "UPLOAD_PAYLOAD_TOO_LARGE");
    }

    log.error("request.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return uploadError(requestId, "UPLOAD_FAILED");
  }
}