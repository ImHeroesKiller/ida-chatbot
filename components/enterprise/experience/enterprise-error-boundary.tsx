"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

function createClientErrorId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorId: string;
  message: string;
};

export class EnterpriseErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorId: "",
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorId: createClientErrorId(),
      message: error.message || "Something went wrong loading this view.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        scope: "enterprise.error-boundary",
        requestId: this.state.errorId,
        step: "render.failed",
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      }),
    );
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorId: "", message: "" });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
        <AlertTriangle className="mb-4 size-10 text-red-600" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-foreground">This view encountered an error</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{this.state.message}</p>
        <p className="mt-4 rounded-lg bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
          Ref: {this.state.errorId}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Share this reference with your developer or check the Debug Dashboard.
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </div>
    );
  }
}