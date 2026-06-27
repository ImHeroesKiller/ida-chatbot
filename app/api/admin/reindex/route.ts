import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard";

export const maxDuration = 300;

function runSeedScript(): Promise<{ success: boolean; output: string }> {
  return new Promise((resolvePromise) => {
    const scriptPath = resolve(process.cwd(), "scripts/seed-ida-chunks.mjs");
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
    });

    let output = "";

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    child.on("close", (code) => {
      resolvePromise({
        success: code === 0,
        output: output.trim().slice(-4000),
      });
    });

    child.on("error", (error) => {
      resolvePromise({
        success: false,
        output: error.message,
      });
    });
  });
}

export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  try {
    const result = await runSeedScript();

    if (!result.success) {
      return NextResponse.json(
        { error: "Re-index failed.", output: result.output },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, output: result.output });
  } catch (error) {
    console.error("[IDA admin reindex]", error);
    return NextResponse.json(
      { error: "Failed to start re-index job." },
      { status: 500 },
    );
  }
}