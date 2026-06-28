import { NextResponse } from "next/server";

import { loadWorksheetBrandingConfig } from "@/lib/worksheet-branding-server";

export async function GET() {
  const config = await loadWorksheetBrandingConfig();

  return NextResponse.json({ config });
}