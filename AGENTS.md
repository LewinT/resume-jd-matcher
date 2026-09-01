# AGENTS.md

## Purpose

This repository is an AI-assisted portfolio project.

AI coding agents may help with implementation, testing, review, documentation, and debugging.

Agents must preserve the architecture, product constraints, resume-integrity guarantees, privacy safeguards, and public cost protections described below.

Prefer minimal, reviewable changes over unnecessary refactors.

---

## Product

The application is an AI Resume ↔ Job Description Matcher.

Core flow:

```text
PDF Resume
→ server-side PDF extraction
→ structured Resume Profile

Job Description
→ structured Job Profile

Resume Profile + Job Profile
→ semantic requirement comparison
→ deterministic scoring
→ deterministic evidence-grounded suggestions
→ Match Result
```

The public application also provides:

```text
Try Example
→ local fictional fixture
→ no API / OpenAI cost
```

---

## MVP Scope

The v1 portfolio MVP is complete.

Do not add major product features unless explicitly requested.

Out of scope by default:

- authentication
- user accounts
- databases for resume history
- permanent resume storage
- OCR
- job-board scraping
- automated applications
- enterprise infrastructure
- automatic resume rewriting
- large architectural migrations

When solving a bug or deployment issue, prefer the smallest safe fix.

---

## Resume Integrity

Never fabricate resume content.

The system must never invent:

- skills
- employers
- responsibilities
- achievements
- metrics
- certifications
- qualifications
- proficiency levels
- years of experience
- education details
- language abilities

When evidence is ambiguous, prefer:

```text
null
[]
uncertain
```

over guessing.

Do not strengthen a user's claim beyond what the source resume supports.

---

## Source Separation

Structured extraction must preserve source separation.

Resume Profile:

```text
may only use Resume content
```

Job Profile:

```text
may only use Job Description content
```

Do not transfer Job Description requirements into the Resume Profile.

Do not weaken Job Description requirements using information from the resume.

Resume evidence must originate from resume content.

---

## PDF Processing

The current MVP supports text-based PDFs only.

Do not silently add OCR or layout reconstruction.

Preserve existing protections including:

- PDF validation
- `%PDF-` signature check
- file-size limit
- page-count limit
- extracted-text limit
- scanned/image-only handling
- damaged/password-protected handling
- cleanup
- in-memory processing

Current important limits include:

```text
upload size
≤ 4 MB

pages
≤ 50

extracted text
≤ 100,000 characters
```

Multi-column reading order is a known limitation.

Prefer uncertainty over incorrect association.

---

## Structured AI Output

Use structured schemas for AI outputs.

Prefer:

- Zod validation
- stable enums
- explicit nullable fields
- explicit uncertainty
- provider-native structured output

Do not rely on free-form prose when application code requires deterministic structure.

---

## Semantic Matching

Semantic matching and scoring are separate concerns.

The semantic model may determine whether a Job requirement is:

```text
matched
partial
missing
uncertain
```

It may explain the relationship and reference known evidence IDs.

It must not calculate the final percentage.

---

## Stable IDs

Job requirements and resume evidence should use stable application-generated IDs.

The semantic model should only reference those IDs.

Reject or fail safely when semantic output contains:

- unknown requirement IDs
- duplicate requirement IDs
- unknown evidence IDs
- missing expected requirements
- invalid evidence/status combinations

Do not allow the model to create new evidence.

---

## Deterministic Scoring

Final scores are application logic.

Current weights:

```text
required      = 2
preferred     = 1
unspecified   = 1
```

Current match values:

```text
matched       = 1.0
partial       = 0.5
missing       = 0.0
uncertain     = 0.0
```

Do not move score calculation into the LLM without explicit product approval.

If scoring changes, update deterministic tests.

---

## Suggestions

Resume suggestions are currently deterministic.

Do not add an extra LLM call for suggestions unless explicitly requested and justified.

Current conceptual behavior:

```text
matched
→ increase visibility of existing evidence

partial
→ clarify supported scope

missing
→ protected gap

uncertain
→ verify before claiming
```

Missing requirements must never be presented as supported resume improvements.

Partial suggestions must preserve a clear claim boundary.

Avoid automatic rewritten resume bullets unless explicitly requested and carefully evidence-constrained.

---

## Multilingual Behavior

The MVP supports English and German as primary tested languages.

Cross-language semantic matching is supported.

Suggestion language should follow the Job Description language when practical.

Resume evidence should remain in its original language.

Do not translate source evidence in a way that changes meaning or claim strength.

---

## Public AI Endpoint Protection

Assume public API routes can be called directly.

Frontend controls are not a security boundary.

When modifying any endpoint that can trigger paid work:

- validate server-side before paid calls
- apply authoritative rate limiting before OpenAI
- preserve request-size limits
- preserve complexity limits
- preserve output limits
- preserve generic errors
- preserve fail-closed behavior
- avoid hidden or automatic retries
- do not create new paid-call bypasses

Do not rely only on button disabling or frontend duplicate prevention.

---

## Current Rate Limits

Current public portfolio limits are:

```text
PDF extraction
10 / hour / client

/api/analyze + /api/match
shared 6 paid calls / hour / client

global paid OpenAI ceiling
40 calls / day
```

These values are product configuration.

If changing them, review:

- cost exposure
- normal user flow
- shared quota behavior
- global protection
- test coverage

A normal complete real analysis currently consumes two paid calls.

---

## Shared Paid Quota

`/api/analyze` and `/api/match` intentionally share the same paid-client quota.

Do not give them independent quotas that allow a caller to bypass the intended limit by alternating endpoints.

Preserve the global paid ceiling.

---

## Distributed Rate Limiting

Production rate limiting uses Upstash Redis.

Do not replace production protection with:

```text
new Map()
```

or another process-local in-memory counter.

Serverless instances do not share reliable process memory.

Test-only in-memory abstractions are acceptable when they do not replace production enforcement.

---

## Client Identifier Privacy

Do not store raw client IP addresses in Redis.

The application uses a pseudonymous HMAC identifier derived from:

```text
client address
+
RATE_LIMIT_IP_SALT
```

Preserve:

```text
HMAC-SHA-256
```

or an equally strong server-side pseudonymization strategy.

Never expose the HMAC salt to the browser.

---

## Deployment Environment Resolution

Redis namespaces must remain separated between:

```text
development
preview
production
```

Do not use:

```text
NODE_ENV
```

to determine Vercel deployment namespace.

`NODE_ENV=production` is true for built Preview deployments as well as Production deployments.

Current precedence is:

1. `VERCEL_ENV`
2. `VERCEL_TARGET_ENV`
3. if running on Vercel and both are unavailable: fail closed
4. outside Vercel: `development`

Do not infer security-sensitive deployment environment from:

- URL strings
- branch-name guessing
- client-side variables

If required Vercel environment metadata is unavailable, paid routes should fail closed.

---

## Fail-Closed Paid Operations

Paid AI routes are fail-closed.

If the authoritative rate limiter cannot be verified:

```text
HTTP 503
```

and OpenAI must not be called.

Do not silently bypass rate limiting because Upstash is:

- unavailable
- slow
- misconfigured
- missing credentials

If a quota is exhausted:

```text
HTTP 429
```

Use generic client-facing messaging.

---

## OpenAI Client Configuration

Paid OpenAI clients currently use:

```text
maxRetries: 0
timeout: 60,000 ms
max_output_tokens: 12,000
store: false
```

Do not re-enable automatic SDK retries without also redesigning paid-call accounting.

The intended invariant is:

```text
one accepted limiter operation
→ at most one automatic OpenAI SDK attempt
```

Do not introduce hidden application retry loops around paid calls.

---

## Input Protection

Preserve bounded server-side input reading.

Do not rely exclusively on:

```text
Content-Length
```

for request-size enforcement.

Important current limits include:

```text
Resume Text
≤ 100,000 characters

Job Description
≤ 50,000 characters

Match requirements
≤ 100

Resume evidence
≤ 300

OpenAI output
≤ 12,000 tokens
```

Oversized inputs should be rejected before unnecessary paid work.

---

## Zero-Cost Demo

Try Example must remain zero-cost.

It should:

- use a local fictional fixture
- reuse the existing Match Result UI
- make no `/api/*` request
- make no OpenAI request
- make no Upstash request

Do not accidentally route Try Example through the real analysis pipeline.

The demo must not contain real developer resume data or personal information.

---

## Duplicate Paid Requests

Preserve frontend duplicate-request protection.

Changing inputs should allow a new analysis.

Unchanged inputs should not accidentally create repeated paid calls.

When an intermediate paid result can be safely reused, prefer reuse over repeating earlier paid work.

Frontend duplicate protection is a cost optimization, not a security boundary.

---

## Secrets

Never expose server secrets to client code.

Server-only secrets include:

```text
OPENAI_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_IP_SALT
```

Do not use:

```text
NEXT_PUBLIC_
```

for these values.

Do not hard-code secret values.

Do not commit `.env.local`.

Do not print secrets in:

- logs
- test output
- docs
- screenshots
- error messages

---

## Logging and Privacy

Do not unnecessarily log:

- full resumes
- Job Description bodies
- extracted resume text
- structured candidate profiles
- OpenAI provider response bodies
- API keys
- Upstash tokens
- rate-limit salts
- raw client IP addresses
- stack traces containing sensitive request data

Prefer minimal operational logging.

Client-facing configuration/provider errors should remain generic.

---

## Application Privacy

The application does not provide persistent resume storage.

Preserve the current design:

- process uploads for the active request
- parse in memory
- do not write resume files to application disk
- do not create resume history unless explicitly requested as a future feature

User-derived API responses should use:

```text
Cache-Control: no-store
```

Do not make stronger external-provider retention claims than the implementation can guarantee.

`store: false` does not justify claiming zero external processing or zero abuse-monitoring retention.

---

## Production Debug Information

Development-only Technical Details may contain:

- extracted resume text
- Resume Profile
- Job Profile
- internal structured data

Do not expose these by default in Production.

When modifying debug functionality, verify production behavior with:

```bash
npm run build
npm start
```

or an equivalent Production deployment.

---

## Security Headers

Preserve current baseline security headers unless intentionally replacing them with stronger tested configuration.

Current protections include:

```text
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
```

Do not add a Content Security Policy casually.

A CSP must be tested against:

- Next.js
- Vercel
- client scripts
- required network calls

A broken CSP is not preferable to a working baseline configuration.

---

## Provider-Side Spend Protection

Application-side rate limiting is not the final cost boundary.

Public Production should use:

- a dedicated OpenAI project/key when practical
- a deliberately low provider-side hard spend limit

Do not document a provider spending limit as configured unless it has actually been configured.

Do not assume provider enforcement is perfectly instantaneous.

Keep application-side protection even when a provider hard limit exists.

---

## Testing

When changing scoring:

```bash
npm run test:scoring
```

When changing suggestions:

```bash
npm run test:suggestions
```

When changing:

- rate limiting
- deployment environment behavior
- request protection
- cost controls
- OpenAI client configuration

run:

```bash
npm run test:day6
```

Before deployment or major merge, also run:

```bash
npm run lint
npm run build
```

Current expected results:

```text
Scoring
7 / 7 passing

Suggestions
10 / 10 passing

Deployment / Protection
19 / 19 passing
```

If tests change intentionally, update documentation accordingly.

---

## Deployment Workflow

Prefer:

```text
feature / preview branch
→ Vercel Preview
→ smoke test
→ merge to main
→ Vercel Production
→ minimal Production smoke test
```

Preview tests should verify:

- Try Example
- one real analysis
- API status
- Preview Redis namespace
- no Production debug data

Production tests should be minimal to avoid unnecessary paid calls.

Do not intentionally hit the global paid-call ceiling as a manual test.

Use deterministic tests for quota-boundary testing.

---

## Documentation Responsibilities

Keep documentation roles separate.

### `AGENTS.md`

Durable engineering rules for AI coding agents.

Do not use it as a daily diary.

### `PROJECT_BRIEF.md`

Current product architecture, scope, constraints, and implementation status.

Do not use it as chronological history.

### `AI_DEV_LOG.md`

Chronological development decisions, experiments, tests, failures, fixes, and lessons.

### `README.md`

Public project presentation for GitHub visitors, recruiters, and engineers.

Do not expose internal secrets or unnecessary personal information in any document.

---

## Change Discipline

Before modifying code:

1. understand the existing architecture
2. identify the smallest relevant files
3. avoid unrelated refactors
4. preserve existing validated behavior
5. add or update deterministic tests where practical
6. run relevant validation
7. report exactly what changed

Do not rewrite working architecture solely for stylistic preference.

---

## Agent Review Behavior

When reviewing code, classify findings by practical severity.

Prefer categories such as:

```text
MUST FIX
NICE TO IMPROVE
NOT A BLOCKER
```

A MUST FIX finding should include:

- concrete failure scenario
- affected file / code area
- smallest safe fix

Do not invent enterprise requirements for a one-week portfolio MVP.

Avoid recommending:

- authentication
- new databases
- large cloud infrastructure
- microservices
- major rewrites

unless a concrete requirement makes them necessary.

---

## Final Engineering Principle

Use AI for semantic understanding.

Use deterministic code for:

- scoring
- validation
- IDs
- evidence integrity
- safety boundaries
- rate limits
- privacy controls
- cost controls

Prefer:

```text
explicit uncertainty
```

over:

```text
confident invention
```

Prefer:

```text
small safe changes
```

over:

```text
unnecessary architectural complexity
```