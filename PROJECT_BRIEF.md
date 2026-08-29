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
- years of experience

Suggestions may only improve wording or visibility of information that is already supported by the resume.

If the Job Description requires something not found in the resume, the tool should identify it as a gap rather than fabricate it.

When extracted PDF text contains ambiguous layout or reading order, downstream AI analysis should prefer explicit evidence and avoid inventing uncertain relationships.

## PDF scope

The MVP supports normal text-based PDF resumes.

OCR for scanned or image-only PDFs is out of scope.

Current limits:

- maximum upload size: 4 MB
- maximum page count: 50 pages

If usable text cannot be extracted, the application should show a helpful error message.

## Privacy

Uploaded resumes are currently:

- received by the server only for the active request
- processed in memory
- not written to disk
- not stored in a database
- not permanently retained
- not sent to an AI provider yet

Future LLM integration should preserve this privacy-first design as much as practical.

No user account or resume history is required for the MVP.

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

PDF Resume
→ browser upload
→ POST /api/extract-resume
→ server-side PDF validation and in-memory text extraction
→ resumeText

resumeText + Job Description
→ POST /api/analyze
→ server-side LLM structured extraction
→ Resume Profile + Job Profile

Resume Profile + Job Profile
→ POST /api/match
→ server-side semantic requirement comparison
→ deterministic TypeScript scoring
→ explainable Match Result
→ frontend display

The LLM is responsible for:
- structured information extraction
- multilingual semantic comparison
- identifying matched, partial, missing, and uncertain relationships

The LLM does not calculate the final match percentage.

Final numerical scoring is calculated by deterministic application code using explicit weighting rules.

Uploaded resume files and extracted profile data are processed only for the active request and are not permanently stored.


## Current implementation status

Completed:

- responsive homepage
- PDF resume selection
- client-side PDF validation
- Job Description input
- server-side PDF validation
- in-memory PDF text extraction
- English and German PDF extraction
- structured Resume Profile extraction
- structured Job Profile extraction
- multilingual-ready LLM analysis
- evidence-backed structured extraction
- uncertainty handling
- server-side semantic requirement comparison
- stable Job Description requirement IDs
- stable Resume evidence IDs
- matched / partial / missing / uncertain classification
- deterministic explainable scoring
- category score breakdown
- frontend Match Result display
- duplicate paid-request protection
- separate extraction / analysis / matching error handling
- deterministic scoring tests
- English semantic matching tests
- German semantic matching tests
- cross-language semantic matching tests
- false-positive matching tests
- real resume testing

### Not yet implemented:

- resume improvement suggestions
- final UI/UX polish
- public-demo abuse protection
- rate limiting
- portfolio demo mode
- deployment
- final README and project presentation


## Known limitations

- Multi-column PDF layouts may not preserve the original visual reading order during text extraction.
- Education and other relationships in flattened PDF text may sometimes be ambiguous.
- The AI is instructed to prefer null or uncertainty over guessed associations.
- Scanned or image-only PDFs are not supported.
- OCR is out of scope for the MVP.
- Semantic matching depends on an external LLM and may occasionally classify borderline relationships differently.
- The current public-facing UI is still a development-oriented result view.
- Public deployment will require rate limiting and cost-abuse protection because each real AI analysis uses a paid API.


## Next milestone

Day 5 will focus on:

- resume improvement suggestions grounded only in existing resume evidence
- turning the development result view into a clearer final product UI
- improving how matched, partial, missing, and uncertain requirements are presented
- deciding which technical/debug information should remain visible in the final MVP
