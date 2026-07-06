"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

function createClientErrorId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export default function DemoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorId = createClientErrorId();

  useEffect(() => {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        scope: "demo.error",
        requestId: errorId,
        step: "route.failed",
        message: error.message,
        digest: error.digest,
      }),
    );
  }, [error, errorId]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <AlertTriangle className="mb-4 size-12 text-red-600" strokeWidth={1.5} />
      <h1 className="text-xl font-semibold">IDA Demo encountered an error</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || "Something went wrong loading the enterprise demo."}
      </p>
      <p className="mt-4 rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
        Ref: {errorId}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}