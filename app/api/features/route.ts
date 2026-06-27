import { NextResponse } from "next/server";

import { loadAppConfig } from "@/lib/admin/config";

export async function GET() {
  const config = await loadAppConfig();

  return NextResponse.json({
    features: config.features,
    rag: config.rag,
  });
}