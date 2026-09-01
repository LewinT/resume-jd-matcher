import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
  createRateLimitService,
  environmentKeyPrefix,
  resolveRateLimitEnvironment,
  type RateLimitDecision,
  type RateLimitService,
} from "./rate-limit-core";

const RATE_LIMIT_MESSAGE =
  "Too many real analyses. Please try again later or use Try Example.";
const UNAVAILABLE_MESSAGE =
  "Real analysis is temporarily unavailable. Please try again later or use Try Example.";

let service: RateLimitService | null = null;

function trustedClientAddress(request: Request) {
  if (process.env.VERCEL === "1") {
    const forwardedFor =
      request.headers.get("x-vercel-forwarded-for") ||
      request.headers.get("x-forwarded-for");
    const firstAddress = forwardedFor?.split(",")[0]?.trim();

    return firstAddress || "unknown-vercel-client";
  }

  return "local-development-client";
}

function createUpstashRateLimitService() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const ipSalt = process.env.RATE_LIMIT_IP_SALT;

  if (!url || !token || !ipSalt) {
    throw new Error("Rate limit configuration is incomplete.");
  }

  const redis = new Redis({ url, token });
  const environment = resolveRateLimitEnvironment({
    vercelEnvironment: process.env.VERCEL_ENV,
    vercelTargetEnvironment: process.env.VERCEL_TARGET_ENV,
    isVercel: process.env.VERCEL === "1",
  });
  const prefix = environmentKeyPrefix(environment);

  return createRateLimitService({
    extractionLimiter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: `${prefix}:pdf-extraction`,
      ephemeralCache: false,
      timeout: 0,
    }),
    paidClientLimiter: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(6, "1 h"),
      prefix: `${prefix}:paid-client`,
      ephemeralCache: false,
      timeout: 0,
    }),
    paidGlobalLimiter: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(40, "1 d"),
      prefix: `${prefix}:paid-global`,
      ephemeralCache: false,
      timeout: 0,
    }),
    ipSalt,
    getClientAddress: trustedClientAddress,
  });
}

function getRateLimitService() {
  service ??= createUpstashRateLimitService();
  return service;
}

function responseForDecision(decision: Exclude<RateLimitDecision, { allowed: true }>) {
  const headers = new Headers({ "Cache-Control": "no-store" });

  if (decision.retryAfterSeconds) {
    headers.set("Retry-After", String(decision.retryAfterSeconds));
  }

  return Response.json(
    { error: decision.status === 429 ? RATE_LIMIT_MESSAGE : UNAVAILABLE_MESSAGE },
    { status: decision.status, headers },
  );
}

async function enforce(
  request: Request,
  check: (service: RateLimitService) => Promise<RateLimitDecision>,
) {
  let decision: RateLimitDecision;

  try {
    decision = await check(getRateLimitService());
  } catch (error) {
    console.error("Rate limit verification failed.", {
      category: error instanceof Error ? error.name : "UnknownError",
    });
    decision = { allowed: false, status: 503 };
  }

  return decision.allowed ? null : responseForDecision(decision);
}

export function enforceExtractionRateLimit(request: Request) {
  return enforce(request, (currentService) =>
    currentService.checkExtraction(request),
  );
}

export function enforcePaidRateLimit(request: Request) {
  return enforce(request, (currentService) => currentService.checkPaid(request));
}
