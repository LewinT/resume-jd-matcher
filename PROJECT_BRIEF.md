# AI Resume ↔ Job Description Matcher — Project Brief

## Overview

AI Resume ↔ Job Description Matcher is a public portfolio web application that compares a PDF resume with a Job Description and produces an explainable Match Result.

The application combines:

- server-side PDF extraction
- structured LLM analysis
- semantic requirement matching
- deterministic TypeScript scoring
- evidence-grounded resume suggestions
- multilingual EN/DE support
- privacy safeguards
- server-side abuse and cost protection
- zero-cost public demo mode
- Vercel production deployment

The MVP was built incrementally over seven days.

The project deliberately separates **semantic reasoning** from **deterministic product logic**.

The LLM does not directly invent the final match percentage.

---

## Product Goal

The application should help a job applicant answer:

> How well does my current resume match this Job Description, where are the strongest matches and gaps, and what can I safely improve without inventing qualifications?

The result should be:

- explainable
- evidence-grounded
- multilingual where practical
- resistant to hallucinated resume claims
- deterministic where deterministic logic is possible
- safe enough for a small public portfolio deployment

---

## Core User Flow

### Real Analysis

```text
User uploads PDF resume
        ↓
POST /api/extract-resume
        ↓
PDF validation + text extraction
        ↓
Resume Text + Job Description
        ↓
POST /api/analyze
        ↓
Structured Resume Profile + Job Profile
        ↓
POST /api/match
        ↓
Semantic requirement comparison
        ↓
Deterministic scoring
        ↓
Deterministic evidence-grounded suggestions
        ↓
Final Match Result
```

### Zero-Cost Demo

```text
Try Example
    ↓
Local fictional typed Match Result fixture
    ↓
Existing Match Result UI
```

Try Example:

- requires no PDF
- requires no Job Description
- makes no application API request
- makes no Upstash request
- makes no OpenAI request
- costs $0 per use

The demo fixture is fictional and does not use the developer's real resume.

---

## Current Architecture

### Frontend

Built with:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

The main user interface is implemented in `app/page.tsx`.

The frontend manages:

- PDF selection
- client-side validation
- Job Description input
- loading phases
- request cancellation
- duplicate-request protection
- real analysis
- Try Example
- Match Result rendering
- development-only Technical Details

---

## PDF Extraction

Endpoint:

```text
POST /api/extract-resume
```

Runtime:

```text
Node.js
```

Library:

```text
unpdf
```

Current safeguards include:

- PDF MIME or `.pdf` extension validation
- `%PDF-` signature validation
- maximum upload size: 4 MB
- maximum page count: 50
- maximum extracted text size: 100,000 characters
- empty-file handling
- damaged-PDF handling
- password-protected PDF handling
- unsupported-PDF handling
- image-only/scanned PDF rejection
- minimum meaningful extracted-text check
- resource cleanup
- in-memory processing
- `Cache-Control: no-store`

The MVP intentionally does not use OCR.

If a resume is scanned or image-only, the application returns a helpful error rather than attempting OCR.

### Known PDF Limitation

Multi-column PDF layouts may not preserve perfect visual reading order during text extraction.

The current MVP does not attempt layout reconstruction.

Instead, the structured analysis layer is instructed to prefer uncertainty rather than incorrectly associating education, experience, dates, organizations, or qualifications.

---

## Structured Resume and Job Analysis

Endpoint:

```text
POST /api/analyze
```

The route receives:

```json
{
  "resumeText": "...",
  "jobDescription": "..."
}
```

The OpenAI API is called server-side.

Structured outputs are validated with Zod.

The analysis produces two separate profiles.

### Resume Profile

Contains structured information such as:

- input language
- skills
- stated skill level
- stated experience years
- resume evidence
- work / internship / research experience
- education
- languages
- uncertainties

### Job Profile

Contains structured information such as:

- input language
- job title
- skills
- skill importance
- experience requirements
- responsibilities
- education requirements
- language requirements
- uncertainties

### Source Separation

Resume Profile:

```text
may only use Resume content
```

Job Profile:

```text
may only use Job Description content
```

The extraction layer must not transfer information between sources.

When information is unsupported or ambiguous, the preferred outputs are:

```text
null
[]
uncertain
```

rather than guesses.

---

## Semantic Requirement Matching

Endpoint:

```text
POST /api/match
```

Application code first converts the Job Profile into stable requirements.

Requirement categories include:

- skills
- experience
- responsibilities
- education
- languages

Each requirement receives a stable ID.

Resume evidence is also converted into a controlled evidence catalogue with stable IDs.

The LLM semantic comparison is restricted to returning:

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

The semantic model is not allowed to:

- create new requirements
- invent new evidence
- invent resume claims
- return unknown requirement IDs
- return unknown evidence IDs
- calculate the final percentage

Application code validates semantic output before scoring.

---

## Deterministic Scoring

The final score is calculated in TypeScript.

The LLM does not assign the final match percentage.

### Requirement Weights

```text
required      = 2
preferred     = 1
unspecified   = 1
```

### Match Values

```text
matched       = 1.0
partial       = 0.5
missing       = 0.0
uncertain     = 0.0
```

### Formula

```text
earned points
────────────── × 100
possible points
```

The final overall score is rounded using application code.

Category scores are calculated for:

- Skills
- Experience
- Responsibilities
- Education
- Languages

If a category contains no requirements, the result is:

```text
null
```

and the UI displays:

```text
N/A
```

rather than inventing a score.

---

## Evidence Integrity

A central product rule is:

> Never strengthen the resume beyond what the source evidence supports.

The system must not fabricate:

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
- language ability

Matched and partial requirements must reference valid resume evidence.

Missing requirements must not pretend that supporting evidence exists.

Uncertain requirements should remain uncertain until verified.

---

## Resume Suggestions

Resume suggestions are generated deterministically from the validated Match Result.

The current MVP does not make a third LLM call for suggestions.

Current suggestion types include:

```text
increase_visibility
clarify_supported_scope
protected_gap
needs_verification
```

### Matched

The application may recommend making existing supported evidence easier to notice.

### Partial

The application may recommend clarifying supported scope.

Partial suggestions must contain a claim boundary so the user is not encouraged to overstate experience.

### Missing

Missing requirements are treated as protected gaps.

The application must not suggest adding the missing qualification unless it is genuinely true.

### Uncertain

Uncertain requirements should request verification rather than make assumptions.

### Suggestion Language

Suggestion language follows the Job Description language where possible.

Current behavior:

```text
de
→ German

en
→ English

mixed / unknown
→ English
```

Resume evidence remains in its original source language.

---

## Multilingual Support

The MVP has been manually tested with combinations including:

- English resume + English Job Description
- German resume + German Job Description
- German resume + English Job Description
- cross-language semantic matching

The product is primarily intended for English and German portfolio demonstration.

---

## Public Deployment Strategy

The application uses a hybrid public-demo strategy.

### Try Example

The public landing page offers a fictional precomputed example.

This demonstrates the result UI without paid AI usage.

### Real AI Analysis

Real resume analysis remains available but is protected by server-side limits.

The public deployment does not depend on frontend controls as a security boundary.

API endpoints are assumed to be directly callable.

---

## Rate Limiting

Distributed rate limiting is implemented with:

- Upstash Redis
- `@upstash/redis`
- `@upstash/ratelimit`

An in-memory `Map` is intentionally not used for production rate limiting because independent serverless instances do not share reliable process state.

### PDF Extraction Limit

```text
10 requests / hour / client
```

### Shared Paid Client Limit

`/api/analyze` and `/api/match` intentionally share:

```text
6 paid calls / hour / client
```

A normal complete analysis consumes:

```text
1 analyze call
+
1 match call
=
2 paid calls
```

Therefore, one client can normally perform approximately three complete real analyses per hour.

### Global Paid Limit

Across all clients:

```text
40 OpenAI calls / day
```

The global ceiling provides an additional cost boundary if abuse originates from multiple client addresses.

---

## Client Identifier Privacy

Raw client IP addresses are not stored in Redis.

The client address is transformed with:

```text
HMAC-SHA-256(client address, RATE_LIMIT_IP_SALT)
```

Upstash stores only the resulting pseudonymous hash and limiter counters.

The secret salt remains server-side.

---

## Environment Isolation

Rate-limit namespaces are separated by deployment environment.

Current namespaces:

```text
resume-jd-matcher:development:...
resume-jd-matcher:preview:...
resume-jd-matcher:production:...
```

Environment selection uses:

1. `VERCEL_ENV`
2. `VERCEL_TARGET_ENV`
3. if running on Vercel and both are unavailable: fail closed
4. outside Vercel: `development`

`NODE_ENV` is intentionally not used to distinguish deployment namespaces.

This prevents:

- Vercel Preview from silently using Production quotas
- local `npm start` from consuming Production quotas

If Vercel deployment metadata is missing, real analysis fails closed.

---

## Fail-Closed Behavior

Paid operations are fail-closed.

If Upstash configuration is missing or limiter verification fails:

```text
request
↓
limiter unavailable
↓
HTTP 503
↓
OpenAI is not called
```

If a quota is exhausted:

```text
HTTP 429 Too Many Requests
```

Client-facing messages remain generic.

Try Example remains available.

---

## Input and Complexity Protection

Current production protections include:

- bounded JSON body reading
- request-size enforcement independent of `Content-Length`
- resume text maximum: 100,000 characters
- Job Description maximum: 50,000 characters
- extracted PDF text maximum: 100,000 characters
- Match requirement maximum: 100
- Match evidence maximum: 300
- OpenAI output-token maximum: 12,000

These limits reduce memory, latency, and cost-abuse risk.

---

## OpenAI Client Protection

Paid OpenAI clients are explicitly configured with:

```text
maxRetries: 0
timeout: 60,000 ms
```

Existing requests also use:

```text
store: false
max_output_tokens: 12,000
```

Disabling SDK retries ensures:

```text
one accepted limiter operation
→ at most one automatic OpenAI SDK attempt
```

No application-level retry loop is used.

---

## Provider-Side Cost Protection

The public deployment uses a dedicated OpenAI project and API key.

A deliberately low provider-side hard spend limit is configured for the project.

This provides another protection layer beyond application-side rate limiting.

Cost protection is intentionally layered:

```text
frontend duplicate protection
        ↓
input / complexity limits
        ↓
per-client distributed rate limit
        ↓
global daily paid-call ceiling
        ↓
OpenAI retry disabled
        ↓
provider-side hard spend limit
```

No single layer is assumed to be sufficient on its own.

---

## Privacy

Uploaded resumes are:

- processed for the active request
- parsed in memory
- not written to application disk
- not stored in a resume database
- not retained as application resume history

Resume and Job Description content is sent to OpenAI when real AI analysis is requested.

OpenAI requests use:

```text
store: false
```

The application does not claim that an external AI provider performs zero temporary processing or abuse-monitoring retention.

Development-only technical details are hidden in Production.

User-derived API responses use:

```text
Cache-Control: no-store
```

Full resume text, Job Description content, structured candidate profiles, provider response bodies, secrets, and stack traces should not be logged unnecessarily.

---

## Security Headers

The production application currently includes baseline headers such as:

```text
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
```

A stricter Content Security Policy is a possible future improvement but is not part of the current MVP.

---

## Deployment

Source control:

```text
GitHub
```

Hosting:

```text
Vercel
```

Rate-limit state:

```text
Upstash Redis
```

AI provider:

```text
OpenAI API
```

Deployment workflow:

```text
feature / preview branch
        ↓
Vercel Preview
        ↓
public smoke test
        ↓
merge into main
        ↓
Vercel Production
        ↓
production smoke test
```

The final public Production URL is documented in `README.md`.

---

## Preview Validation

Preview deployment was manually verified for:

- page rendering
- Try Example
- real PDF upload
- `/api/extract-resume` → 200
- `/api/analyze` → 200
- `/api/match` → 200
- OpenAI connectivity
- Upstash connectivity
- Preview Redis namespace
- production debug-data removal

A namespace issue was discovered during Preview testing because the original implementation fell back from missing `VERCEL_ENV` to `NODE_ENV=production`.

That behavior was fixed before final Production deployment.

---

## Production Validation

Production deployment was manually smoke-tested.

Verified:

- Production page opens correctly
- Try Example works
- real PDF analysis works
- all three API routes return 200 for a valid analysis
- OpenAI project key works
- Upstash production limiter works
- Production namespace is correct
- rate-limit user messaging works
- Technical Details are not exposed
- final GitHub `main` matches the deployed code

---

## Automated Validation

Current automated validation includes:

### Scoring

```text
7 / 7 passing
```

### Suggestions

```text
10 / 10 passing
```

### Deployment / Protection Tests

```text
19 / 19 passing
```

Protection tests cover areas including:

- deterministic quota logic
- shared paid quota
- global quota
- pseudonymous client identifiers
- environment namespace isolation
- Vercel environment resolution
- fail-closed behavior
- bounded input behavior
- extracted PDF text limit
- OpenAI retry configuration
- OpenAI timeout configuration

Additional checks:

- TypeScript passes
- lint passes
- production build passes

---

## Current Implementation Status

### Completed

- frontend MVP
- PDF upload
- server-side PDF extraction
- structured Resume Profile
- structured Job Profile
- semantic requirement matching
- deterministic scoring
- category scores
- evidence validation
- evidence-grounded resume suggestions
- multilingual EN/DE behavior
- zero-cost Try Example
- duplicate paid-request protection
- distributed Upstash rate limiting
- per-client quota
- shared analyze/match paid quota
- global daily paid-call ceiling
- HMAC client pseudonymization
- environment namespace isolation
- fail-closed paid routes
- bounded JSON input
- Match complexity caps
- PDF extracted-text cap
- OpenAI output cap
- OpenAI automatic retry disabled
- OpenAI explicit timeout
- privacy notice
- security headers
- production debug hiding
- dedicated OpenAI deployment project
- provider-side hard spend limit
- Vercel Preview deployment
- Vercel Production deployment
- public production smoke testing
- final public README

### MVP Complete

The v1 portfolio MVP is considered complete.

---

## Non-Goals

The MVP intentionally does not include:

- OCR
- user authentication
- accounts
- persistent analysis history
- resume database
- permanent resume storage
- automatic application submission
- ATS scraping
- job-board integrations
- enterprise abuse prevention
- enterprise observability
- automatic rewritten resume bullets
- hiring decisions

---

## Known Limitations

Current limitations include:

- scanned/image-only resumes are unsupported
- multi-column PDF extraction order may be imperfect
- semantic LLM output can still contain errors
- Job Descriptions can contain ambiguous or duplicated requirements
- related requirements may occasionally be represented separately
- no OCR
- no user history
- no authentication
- no automatic resume rewriting
- public rate limiting is intended for a portfolio deployment, not enterprise-scale hostile traffic

The tool should be treated as an assistive comparison tool rather than an automated employment decision system.

---

## Possible Future Improvements

Potential post-MVP improvements include:

- improved multi-column PDF reconstruction
- OCR
- requirement deduplication
- configurable scoring weights
- richer evidence visualization
- more languages
- export of verified suggestions
- accessibility review
- stronger Content Security Policy
- richer automated integration testing
- monitoring and analytics that preserve resume privacy

These are intentionally outside the current one-week MVP.

---

## Final Product Principle

Use AI where semantic understanding is valuable.

Use deterministic application code where rules, scoring, validation, safety, cost control, and evidence integrity can be explicitly enforced.

The product should prefer:

```text
uncertain
```

over:

```text
invented certainty
```