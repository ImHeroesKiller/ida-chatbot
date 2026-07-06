import { NextRequest, NextResponse } from "next/server";

import {
  detectDocKind,
  extractTextFromDocx,
  extractTextFromPdf,
} from "@/lib/integrations/document-extract";
import { buildRealityViewModel } from "@/lib/enterprise/reality-adapter";
import { hydrateESLStore } from "@ida/esl/persistence";
import { runESLPipelineFromDocuments } from "@ida/esl/pipeline";
import { eslStore } from "@ida/esl/store";

export async function POST(request: NextRequest) {
  try {
    await hydrateESLStore();

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files uploaded" }, { status: 400 });
    }

    const documents = [];

    for (const file of files) {
      const kind = detectDocKind(file.name);
      if (!kind) {
        return NextResponse.json(
          { success: false, error: `Unsupported file: ${file.name}. Use PDF or DOCX.` },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const text =
        kind === "pdf"
          ? await extractTextFromPdf(buffer)
          : await extractTextFromDocx(buffer);

      if (!text.trim()) {
        return NextResponse.json(
          { success: false, error: `Could not extract text from ${file.name}` },
          { status: 400 },
        );
      }

      documents.push({ filename: file.name, text, docKind: kind });
    }

    const result = await runESLPipelineFromDocuments(documents);
    const viewModel = buildRealityViewModel(eslStore.exportSnapshot());

    return NextResponse.json({
      success: true,
      uploaded: documents.length,
      pipeline: result,
      ...viewModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}