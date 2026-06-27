import { NextResponse } from "next/server";

import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";

export async function GET() {
  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: await isAdminAuthenticated(),
  });
}