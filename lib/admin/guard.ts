import { NextResponse } from "next/server";

import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";

export type AdminGuardResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminGuardResult> {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Admin panel is not configured. Set ADMIN_PASSWORD." },
        { status: 503 },
      ),
    };
  }

  if (!(await isAdminAuthenticated())) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true };
}