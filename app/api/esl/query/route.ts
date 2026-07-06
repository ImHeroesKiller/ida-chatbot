import { NextRequest, NextResponse } from "next/server";

import { queryEngine } from "@ida/query";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const organization = request.nextUrl.searchParams.get("organization");

  try {
    if (organization) {
      const result = queryEngine.organizationActivity({ organization });
      return NextResponse.json({ success: true, query: "organization", result });
    }

    if (q) {
      const result = queryEngine.queryText(q);
      return NextResponse.json({ success: true, query: q, result });
    }

    const result = queryEngine.overview();
    return NextResponse.json({ success: true, query: "overview", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { q?: string; organization?: string };
    if (body.organization) {
      const result = queryEngine.organizationActivity({
        organization: body.organization,
      });
      return NextResponse.json({ success: true, result });
    }

    const result = queryEngine.queryText(body.q ?? "");
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Query failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}