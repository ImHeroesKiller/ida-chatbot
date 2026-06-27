import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isAdminConfigured,
  setAdminSession,
  verifyAdminPassword,
} from "@/lib/admin/auth";

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin panel is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}