import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { readBoundedJson } from "./bounded-json.ts";
import { getDemoMatchResult } from "./demo-match-result.ts";
import {
  createRateLimitService,
  environmentKeyPrefix,
  resolveRateLimitEnvironment,
  runPaidOperation,
} from "./rate-limit-core.ts";

class FakeLimiter {
  constructor(limit = Number.POSITIVE_INFINITY) {
    this.maximum = limit;
    this.counts = new Map();
    this.identifiers = [];
  }

  async limit(identifier) {
    this.identifiers.push(identifier);
    const count = (this.counts.get(identifier) ?? 0) + 1;
    this.counts.set(identifier, count);

    return {
      success: count <= this.maximum,
      reset: Date.now() + 60_000,
    };
  }
}

function requestFor(address = "203.0.113.10") {
  return new Request("https://example.test/api/analyze", {
    headers: { "x-test-address": address },
  });
}

function serviceWith({
  extraction = new FakeLimiter(),
  paidClient = new FakeLimiter(),
  paidGlobal = new FakeLimiter(),
} = {}) {
  return {
    service: createRateLimitService({
      extractionLimiter: extraction,
      paidClientLimiter: paidClient,
      paidGlobalLimiter: paidGlobal,
      ipSalt: "test-only-secret-salt",
      getClientAddress: (request) =>
        request.headers.get("x-test-address") ?? "local-test-client",
      now: () => 1_000,
    }),
    extraction,
    paidClient,
    paidGlobal,
  };
}

test("Try Example returns the typed fixture without a network call", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;

  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("The example must not use fetch.");
  };

  try {
    const result = getDemoMatchResult();

    assert.equal(fetchCalls, 0);
    assert.equal(result.scoringRubric, "weighted-requirements-v1");
    assert.ok(result.requirements.some((item) => item.status === "matched"));
    assert.ok(result.requirements.some((item) => item.status === "partial"));
    assert.ok(result.requirements.some((item) => item.status === "missing"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the Try Example click handler contains no fetch or API route call", async () => {
  const pageSource = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const handlerSource = pageSource.slice(
    pageSource.indexOf("function handleTryExample()"),
    pageSource.indexOf("async function handleAnalyze()"),
  );

  assert.match(handlerSource, /getDemoMatchResult\(\)/);
  assert.doesNotMatch(handlerSource, /fetch\(|\/api\//);
});

test("an allowed paid request proceeds to the paid operation", async () => {
  const { service } = serviceWith();
  let operationCalls = 0;
  const result = await runPaidOperation(requestFor(), service, async () => {
    operationCalls += 1;
    return "completed";
  });

  assert.deepEqual(result, { completed: true, value: "completed" });
  assert.equal(operationCalls, 1);
});

test("the per-client paid limit rejects with 429", async () => {
  const { service } = serviceWith({ paidClient: new FakeLimiter(1) });

  assert.equal((await service.checkPaid(requestFor())).allowed, true);
  const decision = await service.checkPaid(requestFor());

  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 429);
  assert.equal(typeof decision.retryAfterSeconds, "number");
});

test("analyze and match consume the same paid-client limiter", async () => {
  const paidClient = new FakeLimiter(2);
  const { service } = serviceWith({ paidClient });

  const analyze = await service.checkPaid(requestFor());
  const match = await service.checkPaid(requestFor());
  const nextAnalyze = await service.checkPaid(requestFor());

  assert.equal(analyze.allowed, true);
  assert.equal(match.allowed, true);
  assert.equal(nextAnalyze.allowed, false);
  assert.equal(paidClient.identifiers.length, 3);
  assert.equal(new Set(paidClient.identifiers).size, 1);
});

test("the global daily limit blocks otherwise-allowed clients", async () => {
  const { service } = serviceWith({ paidGlobal: new FakeLimiter(1) });

  assert.equal((await service.checkPaid(requestFor("203.0.113.10"))).allowed, true);
  const secondClient = await service.checkPaid(requestFor("198.51.100.20"));

  assert.equal(secondClient.allowed, false);
  assert.equal(secondClient.status, 429);
});

test("limiter failure returns 503 and never runs the paid operation", async () => {
  const failingLimiter = {
    async limit() {
      throw new Error("simulated Upstash outage");
    },
  };
  const { service } = serviceWith({ paidClient: failingLimiter });
  let operationCalls = 0;

  const result = await runPaidOperation(requestFor(), service, async () => {
    operationCalls += 1;
  });

  assert.equal(result.completed, false);
  assert.equal(result.decision.status, 503);
  assert.equal(operationCalls, 0);
});

test("raw client addresses never reach limiter identifiers", async () => {
  const paidClient = new FakeLimiter();
  const rawAddress = "203.0.113.77";
  const { service } = serviceWith({ paidClient });

  await service.checkPaid(requestFor(rawAddress));

  assert.equal(paidClient.identifiers.length, 1);
  assert.equal(paidClient.identifiers[0].includes(rawAddress), false);
  assert.match(paidClient.identifiers[0], /^client:[a-f0-9]{64}$/);
});

test("Preview and Production Redis prefixes are isolated", () => {
  assert.notEqual(
    environmentKeyPrefix("preview"),
    environmentKeyPrefix("production"),
  );
  assert.equal(
    environmentKeyPrefix("preview"),
    "resume-jd-matcher:preview",
  );
});

test("VERCEL_ENV selects Preview and Production namespaces", () => {
  assert.equal(
    resolveRateLimitEnvironment({
      vercelEnvironment: "preview",
      vercelTargetEnvironment: "production",
      isVercel: true,
    }),
    "preview",
  );
  assert.equal(
    resolveRateLimitEnvironment({
      vercelEnvironment: "production",
      vercelTargetEnvironment: "preview",
      isVercel: true,
    }),
    "production",
  );
});

test("VERCEL_TARGET_ENV is used when VERCEL_ENV is unavailable", () => {
  assert.equal(
    resolveRateLimitEnvironment({
      vercelTargetEnvironment: "preview",
      isVercel: true,
    }),
    "preview",
  );
});

test("a Vercel deployment without environment metadata fails closed", () => {
  assert.throws(
    () => resolveRateLimitEnvironment({ isVercel: true }),
    /Vercel deployment environment is unavailable/,
  );
});

test("local development uses the development namespace", () => {
  assert.equal(
    resolveRateLimitEnvironment({ isVercel: false }),
    "development",
  );
});

test("local production-mode Next.js still uses the development namespace", async () => {
  const limiterSource = await readFile(
    new URL("./rate-limit.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(limiterSource, /NODE_ENV/);
  assert.equal(
    resolveRateLimitEnvironment({ isVercel: false }),
    "development",
  );
});

test("the deployed limiter configuration uses the requested shared limits and fail-closed timeouts", async () => {
  const limiterSource = await readFile(
    new URL("./rate-limit.ts", import.meta.url),
    "utf8",
  );

  assert.match(limiterSource, /slidingWindow\(10, "1 h"\)/);
  assert.match(limiterSource, /slidingWindow\(6, "1 h"\)/);
  assert.match(limiterSource, /fixedWindow\(40, "1 d"\)/);
  assert.equal(limiterSource.match(/timeout: 0/g)?.length, 3);
});

test("body size is enforced without a Content-Length header", async () => {
  const request = new Request("https://example.test/api/analyze", {
    method: "POST",
    body: JSON.stringify({ value: "a".repeat(100) }),
  });
  request.headers.delete("content-length");

  const result = await readBoundedJson(request, 20);

  assert.deepEqual(result, { ok: false, reason: "too_large" });
});

test("invalid requests are handled before rate limiting and OpenAI in both paid routes", async () => {
  const analyzeSource = await readFile(
    new URL("../app/api/analyze/route.ts", import.meta.url),
    "utf8",
  );
  const matchSource = await readFile(
    new URL("../app/api/match/route.ts", import.meta.url),
    "utf8",
  );

  assert.ok(
    analyzeSource.indexOf("hasMeaningfulText(resumeText)") <
      analyzeSource.indexOf("enforcePaidRateLimit(request)"),
  );
  assert.ok(
    analyzeSource.indexOf("enforcePaidRateLimit(request)") <
      analyzeSource.indexOf("openai.responses.parse"),
  );
  assert.ok(
    matchSource.indexOf("matchRequestSchema.safeParse") <
      matchSource.indexOf("enforcePaidRateLimit(request)"),
  );
  assert.ok(
    matchSource.indexOf("enforcePaidRateLimit(request)") <
      matchSource.indexOf("openai.responses.parse"),
  );
});

test("extracted resume text is capped before it is returned", async () => {
  const extractionSource = await readFile(
    new URL("../app/api/extract-resume/route.ts", import.meta.url),
    "utf8",
  );
  const limitCheck = extractionSource.indexOf(
    "text.length > MAX_EXTRACTED_TEXT_CHARACTERS",
  );

  assert.match(
    extractionSource,
    /const MAX_EXTRACTED_TEXT_CHARACTERS = 100_000;/,
  );
  assert.ok(extractionSource.indexOf("await extractText") < limitCheck);
  assert.ok(limitCheck < extractionSource.indexOf("{ text, pages:"));
  assert.match(extractionSource.slice(limitCheck), /413/);
});

test("both paid routes disable SDK retries and use a 60-second timeout", async () => {
  const routeSources = await Promise.all([
    readFile(new URL("../app/api/analyze/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/match/route.ts", import.meta.url), "utf8"),
  ]);

  for (const routeSource of routeSources) {
    assert.match(routeSource, /const OPENAI_TIMEOUT_MS = 60_000;/);
    assert.match(routeSource, /maxRetries: 0/);
    assert.match(routeSource, /timeout: OPENAI_TIMEOUT_MS/);
    assert.equal(routeSource.match(/new OpenAI\(/g)?.length, 1);
  }
});
