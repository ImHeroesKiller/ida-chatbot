import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/guard";
import { IDA_CONFIG, LOCALES } from "@/lib/config";
import {
  detectFileType,
  extractDocumentText,
  slugifyFileName,
} from "@/lib/rag/extract-document";
import { createKbDocument } from "@/lib/rag/kb-service";

export const maxDuration = 300;

const uploadFieldsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  locale: z.enum(LOCALES),
  pageSlug: z.string().min(1).max(64).optional(),
  section: z.string().min(1).max(64).optional(),
  sourceType: z.enum(["knowledge", "faq", "guide"]),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (file.size > IDA_CONFIG.maxUploadBytes) {
    return NextResponse.json(
      { error: `File exceeds ${IDA_CONFIG.maxUploadBytes / (1024 * 1024)}MB limit.` },
      { status: 400 },
    );
  }

  const parsedFields = uploadFieldsSchema.safeParse({
    title: formData.get("title")?.toString() || undefined,
    locale: formData.get("locale")?.toString(),
    pageSlug: formData.get("pageSlug")?.toString() || undefined,
    section: formData.get("section")?.toString() || undefined,
    sourceType: formData.get("sourceType")?.toString(),
  });

  if (!parsedFields.success) {
    return NextResponse.json({ error: "Invalid upload metadata." }, { status: 400 });
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PDF, TXT, MD, or DOCX." },
      { status: 400 },
    );
  }

  const { locale, sourceType } = parsedFields.data;
  const pageSlug = parsedFields.data.pageSlug?.trim() || slugifyFileName(file.name);
  const section = parsedFields.data.section?.trim() || "main";
  const title = parsedFields.data.title?.trim() || file.name.replace(/\.[^.]+$/, "");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const content = await extractDocumentText({
      buffer,
      fileName: file.name,
      fileType,
      locale,
    });

    const result = await createKbDocument({
      title,
      fileName: file.name,
      fileType,
      locale,
      pageSlug,
      section,
      sourceType,
      content,
      metadata: { uploadedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      ok: true,
      document: result.document,
      chunksIndexed: result.chunksIndexed,
      contentLength: content.length,
    });
  } catch (error) {
    console.error("[IDA admin kb upload]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process uploaded document.",
      },
      { status: 500 },
    );
  }
}