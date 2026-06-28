import { NextResponse } from "next/server";

import { loadWorksheetBrandingConfig } from "@/lib/worksheet-branding-server";
import {
  listWorksheetLetterheadTemplates,
  seedDefaultLetterheadFromLegacyBranding,
} from "@/lib/worksheet-letterhead-templates-server";

export async function GET() {
  try {
    let templates = await listWorksheetLetterheadTemplates();

    if (templates.length === 0) {
      const legacy = await loadWorksheetBrandingConfig();
      await seedDefaultLetterheadFromLegacyBranding(legacy);
      templates = await listWorksheetLetterheadTemplates({ bypassCache: true });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[IDA worksheet letterhead-templates GET]", error);
    return NextResponse.json(
      { error: "Failed to load letterhead templates." },
      { status: 500 },
    );
  }
}