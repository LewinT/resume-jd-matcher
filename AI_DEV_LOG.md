# AI Development Log

## Project

AI Resume ↔ Job Description Matcher

## Goal

Build a one-week portfolio MVP that compares a PDF resume with a Job Description using AI semantic reasoning while keeping scoring, evidence integrity, cost protection, and important product rules deterministic and testable.

---

# Day 1 — Frontend Prototype

## Goal

Build the initial user flow before adding real backend AI behavior.

## Implemented

Created a Next.js frontend with:

- PDF resume selector
- PDF filename display
- Job Description textarea
- controlled form state
- disabled/enabled Analyze button
- loading state
- mock Match Result
- responsive Tailwind layout
- basic metadata

The initial Match Result used a mock score to prove the user flow before backend implementation.

## Client-Side PDF Validation

The frontend accepts a file when:

- MIME indicates PDF, or
- the filename ends in `.pdf`

This provides reasonable browser-side usability while leaving authoritative validation to the server.

## Result Reset Behavior

Changing either:

- selected PDF, or
- Job Description

clears the previous result.

This prevents stale analysis from remaining visible after the inputs change.

## Validation

Completed:

- manual UI test
- responsive layout check
- lint
- production build

## What I Learned

- Build the user flow before adding expensive backend behavior.
- Frontend validation is useful for UX but is not a security boundary.
- Mock results make it easier to iterate quickly on product structure.

---

# Day 2 — Server-Side PDF Extraction

## Goal

Replace the frontend mock with real resume text extraction.

## Library Decision

Selected:

```text
unpdf
```

for server-side PDF extraction.

The MVP intentionally avoids OCR.

## Endpoint

Implemented:

```text
POST /api/extract-resume
```

using the Node.js runtime.

The route receives multipart form data containing:

```text
file
```

## Server Validation

Added server-side protection for:

- missing file
- PDF metadata / filename
- empty files
- maximum 4 MB upload size
- `%PDF-` file signature
- maximum 50 pages
- damaged PDF
- password-protected PDF
- unsupported PDF
- insufficient meaningful text
- image-only/scanned PDF
- resource cleanup

PDF processing remains in memory.

## Successful Result

Successful extraction returns:

```json
{
  "text": "...",
  "pages": 1
}
```

## Real Resume Testing

Tested with real English/German text-based resume content.

Unicode extraction worked.

## Multi-Column Limitation

Observed that PDF parser text order does not necessarily preserve the visual association of information in multi-column resumes.

Decision:

Do not build layout reconstruction during the one-week MVP.

Instead, future structured analysis must prefer uncertainty over assigning information to the wrong education or experience entry.

## Frontend Integration

The frontend now calls:

```text
/api/extract-resume
```

and displays:

- loading state
- extraction errors
- development debug information

## What I Learned

The request flow became:

```text
Browser
→ FormData
→ fetch
→ Next.js API route
→ unpdf
→ JSON
→ React state
```

This was the first full frontend/backend data path in the project.

---

# Day 3 — Structured Resume and Job Analysis

## Goal

Turn unstructured Resume Text and Job Description text into validated structured profiles.

## OpenAI Integration

Added server-side OpenAI API usage.

The API key remains server-side through:

```text
OPENAI_API_KEY
```

No API key is exposed through `NEXT_PUBLIC_*`.

## Endpoint

Implemented:

```text
POST /api/analyze
```

Input:

```json
{
  "resumeText": "...",
  "jobDescription": "..."
}
```

## Structured Outputs

Used:

- official OpenAI Node SDK
- Zod
- provider-native structured outputs
- `store: false`

The model used for the MVP is configured in server code.

## Input Limits

Added meaningful-input validation.

Current effective limits include:

```text
Resume Text
≤ 100,000 characters

Job Description
≤ 50,000 characters
```

## Resume Profile

Structured fields include:

- input language
- skills
- stated skill level
- stated experience years
- evidence
- experience
- education
- languages
- uncertainties

## Job Profile

Structured fields include:

- input language
- job title
- skills
- required / preferred / unspecified importance
- experience requirements
- responsibilities
- education requirements
- language requirements
- uncertainties

## Source Separation

A critical rule was introduced:

```text
Resume Profile
→ Resume only

Job Profile
→ Job Description only
```

The model must not use Job Description information to enrich the resume.

The model must not use resume information to weaken or change Job Description requirements.

## Hallucination Rule

When information is ambiguous:

```text
null
[]
uncertain
```

is preferred over guessing.

## API Billing Lesson

Discovered that:

```text
ChatGPT subscription
≠
OpenAI API billing
```

The initial OpenAI API request returned a quota-related error because API credits were not configured.

A small prepaid API balance was added.

Automatic recharge remained disabled.

## Controlled Test

Used a controlled resume / Job Description combination including:

- Python
- MATLAB
- SolidWorks
- German
- English
- SAP

The resume did not contain SAP.

The structured output correctly kept SAP out of the Resume Profile.

## PDF Association Issue

The real resume test exposed ambiguity from multi-column extraction.

Guardrails were strengthened:

- prefer uncertainty
- do not force ambiguous degree/date/organization associations
- do not reconstruct visual layout in the MVP

## Duplicate Paid Request Protection

The frontend prevents repeated identical Analyze submissions.

Changing:

- PDF, or
- Job Description

permits a new analysis.

## Validation

Completed:

- controlled API test
- real frontend integration
- lint
- production build

## What I Learned

- Structured outputs dramatically reduce integration ambiguity.
- Source separation is essential for resume integrity.
- LLM extraction should not silently resolve parser uncertainty.
- Product billing and ChatGPT billing are separate systems.

---

# Day 4 — Semantic Matching and Deterministic Scoring

## Goal

Build explainable semantic matching while keeping the actual percentage deterministic.

## Architecture Decision

The application now separates:

```text
semantic understanding
```

from:

```text
score calculation
```

The LLM performs semantic comparison.

TypeScript calculates the final score.

## Endpoint

Implemented:

```text
POST /api/match
```

## Stable Requirement IDs

Application code flattens Job Profile content into stable requirements.

Examples:

```text
skill-0
experience-0
responsibility-0
education-0
language-0
```

Resume evidence is also mapped into a stable evidence catalogue.

## Semantic Comparison Output

The model is only allowed to return:

```text
requirementId
status
explanation
resumeEvidenceIds
```

Supported statuses:

```text
matched
partial
missing
uncertain
```

## Validation Rules

Application code checks:

- every expected requirement is covered
- no duplicate requirement IDs
- no unknown requirement IDs
- no unknown evidence IDs
- matched requirements contain evidence
- partial requirements contain evidence
- missing requirements contain no evidence
- output remains structurally valid

## Deterministic Scoring

Requirement weights:

```text
required      = 2
preferred     = 1
unspecified   = 1
```

Match values:

```text
matched       = 1
partial       = 0.5
missing       = 0
uncertain     = 0
```

Overall:

```text
earned / possible × 100
```

rounded with TypeScript.

## Category Scores

Implemented category scores for:

- Skills
- Experience
- Responsibilities
- Education
- Languages

Empty categories return:

```text
null
```

and display:

```text
N/A
```

## Deterministic Tests

Added scoring tests.

Result:

```text
7 / 7 passing
```

## Controlled Scoring Test

Example:

```text
Python required
→ matched

SAP required
→ missing

5 years Python preferred
→ partial
```

Expected overall result:

```text
50
```

The deterministic scorer produced the expected value.

## Frontend Integration

The frontend now performs:

```text
extract
→ analyze
→ match
```

Loading phases include:

```text
Reading Resume
Analyzing Resume and Job
Calculating Match
```

The UI displays:

- overall score
- category breakdown
- requirement status
- explanations
- resume evidence

## Paid Call Reuse

If `/api/analyze` succeeds but `/api/match` fails, the frontend can retry matching without unnecessarily repeating the Analyze call.

## Manual Scenario Testing

Test cases included:

- high-match Job Description
- partial FEA / Ansys requirement
- false-positive SAP / CATIA / NX risk
- German semantic matching
- English/German cross-language matching
- responsibility overreach
- language requirements

Day 4 manual tests passed.

## Known Requirement Duplication Issue

Some Job Description requirements may appear semantically related across categories.

Example:

```text
Mechanical Engineering degree
```

may be represented in more than one structured requirement.

Requirement deduplication was noted as a possible future improvement but intentionally left outside the current MVP.

## What I Learned

- LLMs are useful for semantic comparison.
- Final percentages do not need to be generated by an LLM.
- Stable IDs make semantic output easier to validate.
- Deterministic scoring makes behavior testable and explainable.

---

# Day 5 — Evidence-Grounded Resume Suggestions

## Goal

Add useful resume suggestions without encouraging fabricated qualifications.

## Design Decision

Do not add a third LLM call.

Instead, generate suggestions deterministically from the validated Match Result.

Reasons:

- lower cost
- easier safety enforcement
- easier testing
- lower risk of claim strengthening
- simpler architecture

## Suggestion Types

Implemented:

```text
increase_visibility
clarify_supported_scope
protected_gap
needs_verification
```

## Matched Requirements

Matched requirements may produce:

```text
increase_visibility
```

The suggestion may recommend making existing evidence easier to notice.

It must not invent new evidence.

## Partial Requirements

Partial requirements may produce:

```text
clarify_supported_scope
```

Each partial suggestion contains a claim boundary.

The claim boundary prevents wording that is stronger than the resume evidence.

## Missing Requirements

Missing requirements become:

```text
protected_gap
```

The UI explicitly warns that the requirement is not supported.

The application must not recommend adding it unless it is genuinely true.

## Uncertain Requirements

Uncertain requirements become:

```text
needs_verification
```

The application asks the user to verify rather than guessing.

## Suggestion Priority

Supported improvements are limited and deterministically prioritized.

Typical priority:

```text
required partial
required matched
preferred partial
preferred matched
unspecified
```

Maximum supported improvement suggestions:

```text
5
```

## Suggestion Language

Job Profile language controls suggestion language.

Current behavior:

```text
de
→ German

en
→ English

mixed / unknown
→ English
```

Resume evidence remains in the original source language.

## No Automatic Bullet Rewriting

The MVP intentionally does not generate rewritten resume bullets.

Reason:

Automatic rewriting can accidentally strengthen:

- responsibility
- seniority
- achievement
- scope
- metrics
- years of experience

This is outside the current safe MVP.

## Tests

Suggestion tests:

```text
10 / 10 passing
```

Scoring tests:

```text
7 / 7 passing
```

Lint and production build also passed.

## Frontend Result Polish

Integrated:

- suggestions
- protected gaps
- improved result layout
- collapsed Technical Details for development

## What I Learned

- Not every AI feature requires another AI call.
- Deterministic post-processing can be safer and cheaper.
- Resume suggestions should preserve a clear boundary between supported evidence and unsupported gaps.

---

# Day 6 — Public Deployment Protection

## Goal

Prepare the application for safe public portfolio deployment.

No new core matching features were added.

The Day 6 focus was:

- zero-cost demo
- rate limiting
- cost control
- privacy
- request hardening
- production debug removal

---

## Zero-Cost Try Example

Added a fictional typed Match Result fixture.

Try Example:

- requires no upload
- requires no Job Description
- makes no Fetch/XHR request
- makes no Next.js API request
- makes no OpenAI request
- makes no Upstash request
- reuses the real Match Result UI

This gives portfolio visitors a free way to understand the product.

The example contains fictional information only.

---

## Distributed Rate Limiting

Added:

```text
@upstash/redis
@upstash/ratelimit
```

An in-memory `Map` was intentionally rejected because Vercel/serverless instances do not share reliable process memory.

### PDF Extraction

Limit:

```text
10 / hour / client
```

### Paid AI Routes

`/api/analyze` and `/api/match` share:

```text
6 paid calls / hour / client
```

A normal complete analysis consumes:

```text
2 paid calls
```

Therefore, one client can normally perform approximately three complete analyses per hour.

### Global Paid Ceiling

Across all clients:

```text
40 paid OpenAI calls / day
```

This protects against abuse using multiple addresses.

---

## Pseudonymous Client Identity

Raw IP addresses are not stored in Redis.

Implemented:

```text
HMAC-SHA-256(client address, RATE_LIMIT_IP_SALT)
```

Upstash receives the hash rather than the raw client address.

Environment-specific Redis namespaces were added.

---

## Fail-Closed Behavior

If Upstash configuration is missing or limiter verification fails:

```text
HTTP 503
```

and OpenAI is not called.

If the request exceeds quota:

```text
HTTP 429
```

Paid work is intentionally fail-closed.

---

## Bounded JSON Reading

Added bounded request-body reading that does not rely only on `Content-Length`.

This reduces request-size bypass risk.

---

## Match Complexity Limits

Added maximums for Match requests:

```text
requirements ≤ 100
resume evidence ≤ 300
```

---

## OpenAI Output Cap

Added:

```text
max_output_tokens: 12,000
```

to paid OpenAI routes.

Existing requests continue to use:

```text
store: false
```

---

## Production Privacy

Added:

- generic configuration errors
- safer provider error handling
- safe logging
- `Cache-Control: no-store`
- production hiding of Technical Details
- privacy notice
- security headers

Technical Details remain available only during development.

---

## Environment Variables

Local development now requires:

```text
OPENAI_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_IP_SALT
```

All values remain server-side.

`.env.local` remains ignored by Git.

---

## Day 6 Automated Tests

Initial protection tests passed.

After later deployment-hardening additions, the Day 6 protection suite eventually reached:

```text
19 / 19 passing
```

---

## Manual Zero-Cost Test

Browser DevTools:

```text
Network
→ Fetch/XHR
```

was inspected.

Clicking Try Example created no requests.

Result:

```text
Try Example zero-cost path
PASS
```

---

## Manual Real Analysis Test

Using a known real resume and previously tested Job Description:

```text
/api/extract-resume → 200
/api/analyze        → 200
/api/match          → 200
```

Exactly one request to each endpoint was observed.

No duplicate requests were created.

---

## Upstash Verification

After one real analysis, Upstash showed rate-limit activity.

Observed key families included:

```text
paid-client
paid-global
pdf-extraction
```

Client identifiers appeared as long hexadecimal HMAC hashes.

No raw local or public IP address was stored.

---

## Manual Fail-Closed Test

The Upstash REST token variable was intentionally made unavailable.

After restarting the application:

```text
real analysis
→ HTTP 503
```

The UI displayed a generic temporary-unavailability message.

The normal paid pipeline did not proceed.

After restoring the environment variable, normal functionality returned.

Result:

```text
fail-closed behavior
PASS
```

---

## Production-Mode Privacy Test

Ran:

```bash
npm run build
npm start
```

In production mode:

- normal Match Result UI remained visible
- Technical Details were hidden
- extracted resume debug text was hidden
- Resume Profile debug output was hidden
- Job Profile debug output was hidden

Result:

```text
production debug-data protection
PASS
```

---

## Day 6 Lessons

- Frontend controls are not security boundaries.
- Public API routes must assume direct calls.
- Paid work should be rate-limited before OpenAI is called.
- Distributed serverless rate limiting requires shared external state.
- Global cost ceilings complement per-client limits.
- Fail-closed behavior is appropriate for paid public operations.
- Raw IP addresses do not need to be stored to implement rate limiting.
- A portfolio demo can demonstrate AI product behavior without spending AI tokens.
- Production privacy is part of architecture, not cosmetic polish.

---

# Day 7 — Security Review, Preview, and Production Deployment

## Goal

Finish the MVP and deploy it publicly.

Day 7 scope:

```text
final security review
→ fix deployment blockers
→ configure provider cost protection
→ Vercel Preview
→ smoke testing
→ Vercel Production
→ README / portfolio finish
```

Core matching/scoring/suggestion behavior was frozen.

---

## Final Pre-Deployment Review

The final code review identified three blockers.

### Blocker 1 — Extracted PDF Text Output Size

Problem:

A PDF can be smaller than 4 MB while decompressed extracted text is much larger.

Returning very large text could:

- consume excessive memory
- exceed platform response limits
- fail before `/api/analyze` applies its own limit

### Fix

Added:

```text
maximum extracted text
= 100,000 characters
```

Behavior:

```text
≤ 100,000
→ return normally

> 100,000
→ HTTP 413
```

Error:

```text
The extracted resume text is too large to analyze.
```

Oversized extracted text is never returned to the browser.

---

## Blocker 2 — Hidden OpenAI SDK Retries

The OpenAI Node SDK default retry behavior could cause multiple upstream attempts for a single accepted limiter operation.

This weakened the intended cost model:

```text
1 limiter event
≠ necessarily 1 upstream attempt
```

### Fix

Both paid OpenAI clients now use:

```text
maxRetries: 0
timeout: 60_000
```

Existing:

```text
store: false
max_output_tokens: 12_000
```

remain unchanged.

New cost behavior:

```text
one accepted limiter operation
→ at most one automatic OpenAI SDK attempt
```

No application retry loop was added.

---

## Blocker 3 — Provider-Side Spend Ceiling

Application rate limiting is important but should not be the only financial boundary.

### Fix

Created / used a dedicated OpenAI project for the public deployment.

Created a deployment-specific API key.

Configured a deliberately low provider-side enforced hard spend limit.

The project currently uses a small monthly hard ceiling appropriate for a portfolio demo.

Automatic API recharge remains intentionally conservative.

---

## Validation After Blocker Fixes

Results:

```text
Scoring
7 / 7

Suggestions
10 / 10

Deployment / protections
14 / 14 at this stage

TypeScript
PASS

Lint
PASS

Production build
PASS
```

---

## Vercel Setup

Created a Vercel project connected to the GitHub repository.

Configured server-side environment variables:

```text
OPENAI_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_IP_SALT
```

No values use:

```text
NEXT_PUBLIC_
```

The Vercel project uses the existing external Upstash database rather than creating another Redis integration.

---

## Preview Branch

Created:

```text
day7-preview
```

and pushed it to GitHub.

A Vercel Preview Deployment was created from this branch.

---

## First Preview Smoke Test

Preview successfully served the application.

Real analysis returned:

```text
/api/extract-resume → 200
/api/analyze        → 200
/api/match          → 200
```

Try Example also worked.

However, Upstash showed:

```text
resume-jd-matcher:production:...
```

instead of:

```text
resume-jd-matcher:preview:...
```

This revealed an environment-resolution bug.

---

## Preview Namespace Bug

The original rate-limit namespace logic used:

```ts
process.env.VERCEL_ENV || process.env.NODE_ENV || "development"
```

Problem:

On a built Next.js deployment:

```text
NODE_ENV = production
```

for both Preview and Production.

If `VERCEL_ENV` was unavailable in the runtime, Preview silently fell back to:

```text
production
```

This caused Preview traffic to consume the Production limiter namespace.

The same fallback could also cause local:

```bash
npm start
```

to use Production Redis quotas.

---

## Environment Namespace Fix

The deployment environment resolver was changed to:

1. `VERCEL_ENV`
2. `VERCEL_TARGET_ENV`
3. if running on Vercel and neither is available: throw
4. outside Vercel: `development`

`NODE_ENV` is no longer used for Redis namespace selection.

New expected behavior:

```text
local npm run dev
→ development

local npm start
→ development

Vercel Preview
→ preview

Vercel Production
→ production

Vercel missing environment metadata
→ fail closed
```

This preserves environment isolation.

---

## Environment Resolver Tests

Added deterministic coverage for:

- `VERCEL_ENV=preview`
- `VERCEL_ENV=production`
- `VERCEL_ENV` precedence
- `VERCEL_TARGET_ENV` fallback
- missing Vercel environment metadata
- local development
- local production-mode Next.js
- absence of `NODE_ENV` dependency

The deployment protection suite increased to:

```text
19 / 19 passing
```

Additional validation:

```text
Scoring
7 / 7

Suggestions
10 / 10

TypeScript
PASS

Lint
PASS

Production build
PASS
```

---

## Second Preview Smoke Test

The fix was pushed to:

```text
day7-preview
```

A fresh Preview deployment was created.

Upstash now showed:

```text
resume-jd-matcher:preview:paid-client:...
resume-jd-matcher:preview:paid-global:...
resume-jd-matcher:preview:pdf-extraction:...
```

Result:

```text
Preview environment isolation
PASS
```

Final Preview validation:

- application loads
- Try Example works
- real PDF upload works
- all three APIs return 200
- OpenAI works
- Upstash works
- Preview namespace works
- no production debug content is visible

Result:

```text
Vercel Preview
PASS
```

---

## Merge to Main

The validated Preview branch was merged into:

```text
main
```

The merge completed without conflict.

The updated `main` branch was pushed to GitHub.

---

## Production Deployment

Vercel created the final Production deployment from `main`.

During the first Production test, the rate limiter correctly blocked the developer's own request.

Reason:

Earlier Preview testing had accidentally created old `production:` limiter counters before the namespace bug was fixed.

These stale test-only Production limiter keys were removed before the public launch.

The actual rate-limiter behavior itself was correct.

This incident also verified:

```text
quota exceeded
→ user-visible rate-limit message
→ request blocked
```

---

## Final Production Smoke Test

After removing stale pre-launch test counters:

```text
Production page
PASS

Try Example
PASS

PDF extraction
PASS

/api/extract-resume
200

/api/analyze
200

/api/match
200

OpenAI deployment key
PASS

Upstash production namespace
PASS

Production debug protection
PASS
```

New Redis keys correctly used:

```text
resume-jd-matcher:production:...
```

Preview and Production were now isolated.

Result:

```text
Production deployment
PASS
```

---

## README Finalization

The project README was rewritten as a public portfolio document.

It now explains:

- product purpose
- architecture
- semantic matching
- deterministic scoring
- hallucination safeguards
- resume suggestions
- multilingual behavior
- PDF limitations
- cost protection
- privacy
- rate limiting
- local setup
- testing
- deployment
- known limitations
- development journey

The README links to the public Production deployment.

---

## Final Repository State

Final Git state:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

This confirms:

```text
local main
=
GitHub origin/main
```

No pending local changes remain.

---

# Final Test Summary

## Scoring

```text
7 / 7 passing
```

## Suggestions

```text
10 / 10 passing
```

## Deployment / Protection

```text
19 / 19 passing
```

## Additional Validation

```text
TypeScript
PASS

Lint
PASS

Production build
PASS

Preview smoke test
PASS

Production smoke test
PASS
```

---

# Final Architecture

```text
PDF Resume
    ↓
Next.js /api/extract-resume
    ↓
unpdf extraction
    ↓
Structured Resume + Job analysis
    ↓
OpenAI structured output
    ↓
Stable Job Requirements + Resume Evidence
    ↓
OpenAI semantic comparison
    ↓
TypeScript validation
    ↓
Deterministic scoring
    ↓
Deterministic evidence-grounded suggestions
    ↓
Match Result UI
```

Public protection:

```text
User
 ↓
Vercel
 ↓
server-side validation
 ↓
Upstash rate limiter
 ↓
OpenAI
```

Cost protection:

```text
Try Example
→ $0

Real analysis
→ per-client quota
→ global daily ceiling
→ maxRetries: 0
→ output limits
→ provider-side hard spend limit
```

---

# Seven-Day Development Summary

```text
Day 1
→ Frontend prototype

Day 2
→ PDF extraction

Day 3
→ Structured LLM analysis

Day 4
→ Semantic matching + deterministic scoring

Day 5
→ Evidence-grounded suggestions

Day 6
→ Public demo + cost / abuse / privacy protection

Day 7
→ Security hardening + Preview + Production deployment
```

---

# Main Lessons Learned

## AI Architecture

Use LLMs for tasks where semantic understanding is useful.

Do not automatically delegate:

- scoring
- IDs
- validation
- evidence integrity
- safety rules
- rate limiting
- cost control

to an LLM.

---

## Hallucination Resistance

Resume applications require unusually strict evidence boundaries.

When data is ambiguous:

```text
uncertainty
```

is safer than:

```text
plausible fabrication
```

---

## Deterministic Logic

Deterministic scoring and suggestions are:

- cheaper
- easier to test
- easier to explain
- easier to debug
- safer

than generating all product behavior through an LLM.

---

## Public AI Cost Safety

A public AI endpoint needs layered protection.

Frontend controls alone are insufficient.

Useful layers include:

```text
input validation
rate limiting
global quotas
retry control
provider hard spending limits
zero-cost demo paths
```

---

## Serverless Deployment

Serverless production behavior differs from local development.

Important lessons included:

- shared rate-limit state must live outside process memory
- `NODE_ENV=production` does not mean Vercel Production
- Preview and Production must use separate namespaces
- deployment metadata should fail closed when required for financial protection

---

## Privacy

Debug information that is useful during development should not automatically appear in Production.

Resume content should not be logged or stored unnecessarily.

External-provider privacy claims should not be stronger than what can actually be guaranteed.

---

# MVP Status

The one-week v1 portfolio MVP is complete and publicly deployed.

Core product scope is frozen.

Future changes should be treated as post-MVP improvements rather than unfinished Day 1–7 work.