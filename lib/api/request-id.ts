import type { NextRequest } from "next/server";

import { createRequestId } from "@/lib/logger";

export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get("x-request-id") ??
    request.headers.get("x-vercel-id")?.split(":")[0] ??
    createRequestId()
  );
}