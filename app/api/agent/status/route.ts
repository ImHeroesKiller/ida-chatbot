import { NextResponse } from "next/server";

import { getAgentApiStatus } from "@/lib/agent/config";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const status = await getAgentApiStatus(origin);

  return NextResponse.json(status);
}