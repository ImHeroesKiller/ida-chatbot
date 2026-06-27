import { RateLimiterMemory } from "rate-limiter-flexible";

import { IDA_CONFIG } from "@/lib/config";

let rateLimiter: RateLimiterMemory | null = null;

function getRateLimiter(): RateLimiterMemory {
  if (!rateLimiter) {
    rateLimiter = new RateLimiterMemory({
      points: IDA_CONFIG.rateLimitPoints,
      duration: IDA_CONFIG.rateLimitDurationSec,
    });
  }

  return rateLimiter;
}

export class IdaRateLimitError extends Error {
  retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super("Rate limit exceeded.");
    this.name = "IdaRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

export async function enforceIdaRateLimit(key: string): Promise<void> {
  try {
    await getRateLimiter().consume(key, 1);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "msBeforeNext" in error) {
      const msBeforeNext = Number(
        (error as { msBeforeNext: number }).msBeforeNext,
      );
      throw new IdaRateLimitError(Math.ceil(msBeforeNext / 1000));
    }

    throw error;
  }
}

export function buildRateLimitKey(options: {
  ip: string | null;
  sessionId?: string;
}): string {
  const ip = options.ip ?? "unknown";
  const session = options.sessionId ?? "anonymous";
  return `${ip}:${session}`;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}