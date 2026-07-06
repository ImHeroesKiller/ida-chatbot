import { NextResponse } from "next/server";

import { knowledgeGraphBuilder } from "@ida/graph/builder";

export async function GET() {
  const graph = knowledgeGraphBuilder.snapshot();

  if (graph.nodes.length === 0) {
    return NextResponse.json({
      success: false,
      error: "Graph is empty. Run POST /api/esl/demo first.",
      graph,
    });
  }

  return NextResponse.json({ success: true, graph });
}