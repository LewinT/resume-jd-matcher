import { createHmac } from "node:crypto";

export type LimiterResult = {
  success: boolean;
  reset?: number;
};

export type Limiter = {
  limit(identifier: string): Promise<LimiterResult>;
};

export type RateLimitDecision =
  | { allowed: true }
  | {
      allowed: false;
      status: 429 | 503;
      retryAfterSeconds?: number;
    };

export type RateLimitService = {
  checkExtraction(request: Request): Promise<RateLimitDecision>;
  checkPaid(request: Request): Promise<RateLimitDecision>;
};

type RateLimitServiceDependencies = {
  extractionLimiter: Limiter;
  paidClientLimiter: Limiter;
  paidGlobalLimiter: Limiter;
  ipSalt: string;
  getClientAddress(request: Request): string;
  now?: () => number;
};

const GLOBAL_PAID_IDENTIFIER = "all-paid-calls";

export function environmentKeyPrefix(environment: string) {
  const safeEnvironment = environment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `resume-jd-matcher:${safeEnvironment || "unknown"}`;
}

export function pseudonymousClientIdentifier(address: string, ipSalt: string) {
  return `client:${createHmac("sha256", ipSalt).update(address).digest("hex")}`;
}

function rejectedDecision(
  result: LimiterResult,
  now: () => number,
): RateLimitDecision {
  const retryAfterSeconds = result.reset
    ? Math.max(1, Math.ceil((result.reset - now()) / 1000))
    : undefined;

  return {
    allowed: false,
    status: 429,
    ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
  };
}

export function createRateLimitService({
  extractionLimiter,
  paidClientLimiter,
  paidGlobalLimiter,
  ipSalt,
  getClientAddress,
  now = Date.now,
}: RateLimitServiceDependencies): RateLimitService {
  async function clientIdentifier(request: Request) {
    return pseudonymousClientIdentifier(getClientAddress(request), ipSalt);
  }

  return {
    async checkExtraction(request) {
      try {
        const result = await extractionLimiter.limit(
          await clientIdentifier(request),
        );

        return result.success ? { allowed: true } : rejectedDecision(result, now);
      } catch {
        return { allowed: false, status: 503 };
      }
    },

    async checkPaid(request) {
      try {
        const identifier = await clientIdentifier(request);
        const clientResult = await paidClientLimiter.limit(identifier);

        if (!clientResult.success) {
          return rejectedDecision(clientResult, now);
        }

        const globalResult = await paidGlobalLimiter.limit(
          GLOBAL_PAID_IDENTIFIER,
        );

        return globalResult.success
          ? { allowed: true }
          : rejectedDecision(globalResult, now);
      } catch {
        return { allowed: false, status: 503 };
      }
    },
  };
}

export async function runPaidOperation<T>(
  request: Request,
  service: RateLimitService,
  operation: () => Promise<T>,
): Promise<
  | { completed: true; value: T }
  | { completed: false; decision: Exclude<RateLimitDecision, { allowed: true }> }
> {
  const decision = await service.checkPaid(request);

  if (!decision.allowed) {
    return { completed: false, decision };
  }

  return { completed: true, value: await operation() };
}
