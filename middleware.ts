import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/chat/:path*",
    "/agent/:path*",
    "/account/:path*",
    "/auth/callback",
  ],
};