import { NextResponse } from "next/server";

import { loadUiConfig } from "@/lib/ui-config/server";

export async function GET() {
  const config = await loadUiConfig();

  return NextResponse.json({ config });
}