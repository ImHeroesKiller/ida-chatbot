import { randomUUID } from "crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogDetail = Record<string, unknown>;

export type Logger = {
  requestId: string;
  debug: (step: string, detail?: LogDetail) => void;
  info: (step: string, detail?: LogDetail) => void;
  warn: (step: string, detail?: LogDetail) => void;
  error: (step: string, detail?: LogDetail) => void;
  child: (childScope: string) => Logger;
};

export function createRequestId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function writeLog(
  level: LogLevel,
  scope: string,
  requestId: string,
  step: string,
  detail?: LogDetail,
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    requestId,
    step,
    ...(detail ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function createLogger(scope: string, requestId?: string): Logger {
  const rid = requestId ?? createRequestId();

  const log =
    (level: LogLevel) =>
    (step: string, detail?: LogDetail) =>
      writeLog(level, scope, rid, step, detail);

  return {
    requestId: rid,
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (childScope: string) => createLogger(`${scope}:${childScope}`, rid),
  };
}