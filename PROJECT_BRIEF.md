# AI Resume to Job Description Matcher

## Product goal

Build a small, real web application in approximately one week.

The application helps users compare a resume with a job description and receive an explainable assessment of how well they match.

The project is also a learning exercise in AI-assisted software development. Development should stay incremental, understandable, and focused on a working MVP rather than production-scale complexity.

## Target user workflow

1. The user opens the website.
2. The user uploads a PDF resume.
3. The user pastes a job description.
4. The user clicks **Analyze Match**.
5. The application extracts text from the resume PDF.
6. The application analyzes the resume and job description using an LLM.
7. The application returns an explainable result.

## Final one-week MVP

The completed MVP should provide:

- A simple homepage.
- PDF resume upload.
- Job Description input.
- Text extraction from supported PDF resumes.
- LLM-based structured analysis.
- An overall match score.
- Matched skills.
- Missing or weak skills.
- Resume improvement suggestions.
- Useful error messages for unsupported or unreadable files.
- A deployed public demo.

## Language support

The application is designed for multilingual resume-to-job matching.

The MVP will primarily be tested with:

- English resumes
- German resumes
- English job descriptions
- German job descriptions

Resume and Job Description may be written in different languages.

Matching should be semantic rather than based only on exact keyword equality.

The UI may remain in English for the MVP.

Analysis output should preferably follow the primary language of the Job Description.

## Matching principle

The final match score should be explainable.

The system should distinguish between:

- required skills
- preferred skills
- relevant experience
- responsibilities
- missing or weak requirements

The LLM should help extract and normalize information.

The final score should not be an unexplained number invented by the model.

## Matching and scoring

Each Job Description requirement is classified as:

- matched
- partial
- missing
- uncertain

The semantic comparison may recognize clear cross-language and terminology equivalents, for example:

- `FEM-Simulation`
- `finite element analysis`

However, merely related technologies must not automatically count as matches.

For example:

- SolidWorks does not imply CATIA
- Python does not imply SAP
- a skill name alone does not prove that a specific responsibility was performed

The scoring rubric is:

Importance weights:

- required = 2
- preferred = 1
- unspecified = 1

Match values:

- matched = 1
- partial = 0.5
- missing = 0
- uncertain = 0

For each requirement:

`earnedPoints = importanceWeight × matchValue`

The overall score is:

`total earned points / total possible points × 100`

Category breakdowns use the same formula for:

- skills
- experience
- responsibilities
- education
- languages

If the Job Description contains no requirements in a category, that category is displayed as N/A rather than 0%.

Resume evidence used for matching must reference evidence already extracted from the Resume Profile. The semantic comparison must not invent new resume evidence.


## Resume integrity

The application must never invent:

- skills
- employers
- qualifications
- achievements
- responsibilities
- metrics
- certifications
- proficiency levels
- years of experience

Suggestions may only:

- increase the visibility of supported information
- clarify supported information
- explain the boundary of a partial match
- identify unsupported requirements as gaps
- ask the user to verify ambiguous information

Missing requirements must never be converted into resume claims.

Partial matches must not be presented as fully satisfied requirements.

The current MVP intentionally does not generate rewritten resume bullets because polished wording can unintentionally strengthen unsupported claims.

## PDF scope

The MVP supports normal text-based PDF resumes.

OCR for scanned or image-only PDFs is out of scope.

Current limits:

- maximum upload size: 4 MB
- maximum page count: 50 pages

If usable text cannot be extracted, the application should show a helpful error message.

## Privacy

Uploaded resumes are:

- processed only for the active request
- parsed in memory
- not written to disk
- not stored in a resume database
- not retained by this application as resume history

Resume and Job Description content is sent to OpenAI when real AI analysis is requested.

The application uses `store: false` for OpenAI requests.

The application does not claim that the external AI provider performs zero temporary processing or abuse-monitoring retention.

Full extracted resume/debug information is available only during development and is not shown in the production UI.

Raw client IP addresses are not stored in the rate-limit database. Pseudonymous HMAC identifiers are used instead.

## Suggestion principle

Resume suggestions are generated deterministically from the validated Match Result.

Matched:
→ supported evidence may be made more visible

Partial:
→ supported evidence may be clarified, with an explicit claim boundary

Missing:
→ displayed only as a gap

Uncertain:
→ displayed as needing verification

Suggestion generation does not require an additional LLM request.

## Out of scope for the first MVP

- user accounts
- authentication
- payments
- resume history
- database
- OCR
- job scraping
- social features
- complex animations
- unnecessary infrastructure

## Current architecture

The current MVP flow is:

### Zero-cost portfolio demo

Try Example
→ fictional typed Match Result fixture
→ existing result UI
→ no API request
→ no OpenAI usage

### Real analysis

PDF Resume
→ `/api/extract-resume`
→ server-side PDF validation and text extraction

Resume Text + Job Description
→ `/api/analyze`
→ server-side structured LLM analysis

Resume Profile + Job Profile
→ `/api/match`
→ server-side semantic comparison
→ deterministic scoring
→ deterministic resume suggestions
→ final Match Result

Real AI requests are protected by server-side distributed rate limiting before paid OpenAI calls.

## Current implementation status

Completed:

- frontend upload workflow
- PDF extraction
- structured Resume Profile
- structured Job Profile
- multilingual semantic matching
- deterministic scoring
- evidence-grounded suggestions
- final Match Result UI
- zero-cost Try Example
- distributed server-side rate limiting
- shared paid API quota
- global daily cost ceiling
- pseudonymous rate-limit identifiers
- fail-closed paid routes
- production privacy hardening
- security headers
- automated scoring tests
- automated suggestion tests
- automated Day 6 protection tests
- local production-mode validation
- 100,000-character extracted resume-text response limit
- single-attempt OpenAI requests with a 60-second SDK timeout

Not yet completed:

- Vercel Preview deployment
- production environment variables
- dedicated deployment OpenAI project/key and provider-side enforced spend limit
- final public deployment
- final README and portfolio presentation

## Known limitations

- Multi-column PDF layouts may not preserve the original visual reading order during text extraction.
- Education and other relationships in flattened PDF text may sometimes be ambiguous.
- The AI is instructed to prefer null or uncertainty over guessed associations.
- Scanned or image-only PDFs are not supported.
- OCR is out of scope for the MVP.
- Semantic matching depends on an external LLM and may occasionally classify borderline relationships differently.
- Real analysis depends on both OpenAI and Upstash being configured and available.
- The global daily rate limit is an application guardrail; an OpenAI project spend ceiling remains an important separate deployment safeguard.

## Public deployment and cost protection

Real AI analysis is a paid external operation.

The public MVP therefore uses layered cost protection.

Current protections include:

- zero-cost Try Example
- frontend duplicate-request prevention
- input-size limits
- Match complexity limits
- server-side distributed rate limiting
- shared `/api/analyze` and `/api/match` paid quota
- global daily paid-call ceiling
- OpenAI output-token limits
- disabled OpenAI SDK retries and a 60-second request timeout
- generic fail-closed behavior if the rate limiter is unavailable

Current rate limits:

- PDF extraction: 10 requests/hour/client
- paid `/api/analyze` + `/api/match`: 6 combined calls/hour/client
- global paid limit: 40 OpenAI calls/day

A normal complete real analysis consumes two paid calls.

Client identifiers are pseudonymized before being stored in the rate-limit database.

Public production deployment should use a dedicated OpenAI project and API key with a deliberately low provider-side enforced spend limit. This is a deployment configuration task, not application code, and it is not configured yet.
