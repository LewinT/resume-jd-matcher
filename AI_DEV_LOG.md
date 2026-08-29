# AI Development Log

## Day 1

### Goal

Build a frontend-only prototype for the Resume ↔ JD Matcher.

No PDF parsing, AI API, database, authentication, OCR, or real scoring.

### What was implemented

- Replaced the default Next.js starter page.
- Added PDF resume file selection.
- Added basic client-side PDF validation.
- Added selected filename display.
- Added Job Description textarea using React state.
- Added Analyze button enabled only when:
  - a valid PDF is selected
  - Job Description contains non-whitespace text
- Added mock analysis results.
- Added automatic result reset when inputs change.

### Manual tests performed

- Valid `.pdf` accepted.
- `.jpg` rejected.
- Error cleared after selecting a valid PDF.
- Refresh clears temporary state.
- Analyze button disabled with no PDF.
- Analyze button disabled with no Job Description.
- Analyze button disabled when Job Description contains whitespace only.
- Analyze button enabled when both inputs are valid.
- Mock result appears correctly after clicking Analyze.

### AI workflow

#### ChatGPT
Used for:
- planning Day 1 scope
- explaining Git
- explaining React state and client components
- evaluating Gemini review feedback
- keeping implementation scope small

#### Codex
Used for:
- repository inspection
- updating AGENTS.md
- creating PROJECT_BRIEF.md
- implementing the UI
- adding React state
- adding PDF validation
- adding button validation
- adding mock results
- validating Gemini feedback
- running lint

#### Gemini
Used as an independent reviewer.

Gemini identified that checking only:

`file.type === "application/pdf"`

could reject valid PDFs when the browser reports an empty MIME type.

Codex independently verified the issue and changed validation so that a file is accepted when:
- MIME type is `application/pdf`
OR
- filename ends in `.pdf` case-insensitively

### Validation

- `npm run lint` passed
- `npm run build` passed
- production build completed successfully

### Git

Initialized Git repository.

Created first commit:

`feat: complete Day 1 resume matcher prototype`

Pushed repository to GitHub.

### What I learned

- Codex can directly modify the same local repository opened in VS Code.
- React state is temporary page memory.
- Selecting a file is different from reading or uploading it.
- Client-side PDF validation is only an initial check.
- MIME type alone may not be reliable.
- Mock data is useful for validating UI before backend logic exists.
- `git commit` creates a local project snapshot.
- `git push` uploads commits to GitHub.

### Problems / surprises

- Git had not been initialized automatically.
- `git add .` produced LF/CRLF warnings on Windows.
- Gemini initially took several minutes because it inspected too much of the repository.

### Open questions

- How PDF text extraction will work.
- Whether PDF parsing should happen client-side or server-side.
- How multilingual semantic matching will be implemented.
- How the final match score should be calculated.

## Day 2

### Goal

Replace the mock PDF behavior with real server-side PDF text extraction.

No LLM analysis yet.

### Architecture decision

Compared two approaches:

1. client-side PDF parsing
2. server-side PDF parsing

Chose server-side parsing because:
- it fits future LLM integration better
- PDF parsing stays out of the browser bundle
- validation can be centralized on the server
- uploaded files can be processed in memory
- future API credentials can remain server-side

### PDF library decision

Compared:
- unpdf
- pdf-parse
- pdfjs-dist

Selected `unpdf` because:
- simple high-level text extraction API
- good serverless compatibility
- fewer worker/bundling concerns
- suitable for a small Next.js/Vercel MVP

### What was implemented

Created:

`POST /api/extract-resume`

The endpoint:
- accepts a PDF using FormData
- validates the uploaded file
- rejects files larger than 4 MB
- verifies the PDF signature
- limits PDFs to 50 pages
- parses the PDF entirely in memory
- extracts merged plain text
- rejects unreadable or empty PDFs
- returns extracted text and page count as JSON

Frontend now:
- uploads the selected PDF to the API
- shows a loading state
- handles extraction errors
- displays the extracted resume text for development verification

### Manual tests

Successfully tested:
- normal English text-based resume PDF
- normal German text-based resume PDF
- German Unicode characters such as ä, ö, ü, ß
- image upload rejection
- invalid/fake PDF rejection
- oversized file rejection
- extraction error handling

### Known limitation

Multi-column PDF layouts are not reconstructed correctly.

Text extraction may return sections in a different order from the visual PDF layout.

Example:

A visually separated left/right column may be flattened into one text stream.

Decision:
Do not solve layout reconstruction in the one-week MVP.

The extracted semantic content is currently good enough for LLM analysis.

### What I learned

- Difference between client-side and server-side processing.
- What a Next.js API Route Handler does.
- What FormData is.
- How fetch() sends a file from the browser to the server.
- Difference between selecting, uploading, parsing, and storing a file.
- Why server-side validation is still needed even when the browser already validates a file.
- What in-memory processing means.
- Why scanned PDFs require OCR.
- Why PDF visual layout and extracted text order can differ.

### AI workflow

#### ChatGPT

Used for:
- Day 2 architecture planning
- evaluating server-side vs client-side parsing
- interpreting PDF extraction quality
- debugging PowerShell curl syntax
- deciding whether multi-column layout reconstruction was necessary for the MVP

#### Codex

Used for:
- comparing PDF parsing libraries
- implementing the extraction API
- adding unpdf
- connecting the frontend to the API
- implementing loading/error states
- running lint/build

#### Gemini

Used for:
- independent review of Day 2 implementation

### Validation

- `npm run lint` passed
- `npm run build` passed
- real English resume extraction passed
- real German resume extraction passed

### Open questions for Day 3

- Which LLM/API should perform structured extraction?
- What JSON schema should represent a resume?
- What JSON schema should represent a Job Description?
- How should multilingual semantic matching work?
- How should uncertainty and ambiguous PDF reading order be handled?
- How should the final match score be calculated?

## Day 3

### Goal

Integrate a real LLM into the application and convert:
- extracted resume text
- Job Description text

into structured JSON for later explainable matching.

Day 3 intentionally does not include final match scoring or resume rewriting.

### Architecture decision

The Day 3 flow is:

PDF Resume
→ /api/extract-resume
→ extracted resume text

Resume text + Job Description
→ /api/analyze
→ OpenAI API
→ structured JSON
→ frontend display

The LLM is used for structured extraction and normalization only.

Final scoring is deferred to Day 4.

### Structured output design

Implemented two main objects:

- resumeProfile
- jobProfile

Resume Profile contains:
- inputLanguage
- skills
- experience
- education
- languages
- uncertainties

Job Profile contains:
- inputLanguage
- jobTitle
- skills
- experienceRequirements
- responsibilities
- educationRequirements
- languageRequirements
- uncertainties

Important design rules:
- Resume data must come only from resume text.
- Job Profile data must come only from the Job Description.
- The LLM must not use JD information to fill missing resume information.
- Unsupported information should not be invented.
- Ambiguous data should use null, empty arrays, or uncertainties.
- Evidence excerpts should remain in the original input language.
- Job requirements use required, preferred, or unspecified importance.
- No match score is generated by the LLM.

### LLM integration

Created:

`POST /api/analyze`

The endpoint:
- accepts resumeText and jobDescription as JSON
- validates both inputs
- applies input size limits
- calls OpenAI server-side
- uses provider-native structured output
- validates the model result again with Zod
- returns structured resumeProfile and jobProfile JSON
- does not expose the API key to the frontend
- does not store resume text
- does not write resume data to disk
- does not add a database

The API key is stored locally in:

`.env.local`

using:

`OPENAI_API_KEY`

The file is ignored by Git.

### First real API test

The first live request initially failed with:

`429 You exceeded your current quota`

The cause was not the application code.

The API key was valid, but the OpenAI API account had no available API credit.

After adding prepaid API credit, the same request succeeded.

This helped clarify the difference between:
- ChatGPT subscription access
- OpenAI API billing
- API keys
- model usage cost

### PowerShell backend testing

Before connecting the frontend, `/api/analyze` was tested directly with controlled sample data.

Example resume contained:
- Python
- MATLAB
- SolidWorks
- German C1
- English C1

Example Job Description contained:
- Python required
- SAP required
- German C1 required
- MATLAB preferred

The returned JSON correctly:
- extracted resume skills
- extracted language proficiency
- classified required and preferred JD skills
- preserved evidence excerpts
- kept SAP only in the Job Profile
- did not add SAP to the Resume Profile
- did not generate a match score

This confirmed that resume and JD source separation worked correctly in the test.

### Frontend integration

The frontend now performs the complete Day 3 flow:

1. User selects a PDF resume.
2. User enters a Job Description.
3. User clicks Analyze Match.
4. The frontend calls /api/extract-resume.
5. The resume PDF is converted to text.
6. The frontend sends resumeText + jobDescription to /api/analyze.
7. The server calls the LLM.
8. Structured JSON is returned.
9. The frontend displays temporary Resume Profile and Job Profile sections for development verification.

Loading states distinguish:
- resume extraction
- AI analysis

Extraction errors and AI analysis errors are handled separately.

### Real resume issue found

Testing with a real multi-column resume revealed an education association problem.

The LLM successfully extracted most education information, but PDF reading order caused one institution/date range to be associated with the wrong degree.

Example:
- Universität Stuttgart and 2020.10–2025.04 were incorrectly associated with a B.Sc. entry.

The root issue was not missing text, but ambiguous ordering caused by flattened multi-column PDF extraction.

Decision:
Do not implement PDF layout reconstruction for the MVP.

Instead, strengthen the LLM guardrail:
- do not associate education fields unless the relationship is strongly supported
- prefer null over guessed associations
- preserve partially complete entries
- record important ambiguity in uncertainties
- do not merge separate education entries to create a more complete record

After this change, the same resume was retested successfully.

### Duplicate analysis issue found

Another issue was discovered during frontend testing:

Clicking Analyze Match again without changing the resume or Job Description triggered another paid LLM request.

This was unnecessary and could create avoidable API cost.

A small client-side protection was added:

- after a successful analysis, unchanged inputs do not trigger another request
- the existing result remains visible
- changing the PDF enables a new analysis
- changing the Job Description enables a new analysis
- duplicate submissions while a request is running remain blocked

No database, caching infrastructure, localStorage, or external dependency was added.

This is a local duplicate-request protection only.

Public deployment will still require separate rate limiting and cost-abuse protection.

### Privacy and cost lessons

LLM APIs are paid external services.

Each real analysis may generate API cost.

A public deployment must therefore not expose unlimited anonymous AI requests.

Future deployment should include:
- rate limiting
- strict input limits
- API usage/budget protection
- possibly a predefined demo mode for portfolio visitors

OpenAI API auto-recharge was disabled during development to keep spending controlled.

### Manual tests

Successfully tested:
- backend structured analysis through PowerShell
- real OpenAI API request
- English structured extraction
- resume/JD source separation
- required vs preferred requirements
- evidence preservation
- frontend end-to-end analysis flow
- real PDF resume analysis
- education ambiguity handling
- duplicate-click protection
- changed Job Description triggers new analysis
- changed PDF triggers new analysis

### Validation

- npm run lint passed
- npm run build passed
- /api/analyze returned valid structured JSON
- frontend end-to-end flow passed manual testing
- no final score is generated yet

### What I learned

- What an API key is and why it must stay server-side.
- What `.env.local` is used for.
- Difference between ChatGPT billing and OpenAI API billing.
- Why structured output is more reliable than free-form LLM text.
- Why a JSON schema is useful for frontend and later matching logic.
- How Zod validates LLM output.
- Why evidence-backed extraction reduces hallucination risk.
- Why PDF reading order can create entity-association errors.
- Why conservative uncertainty handling is safer than guessing.
- Why repeated LLM calls have a real monetary cost.
- Why public AI endpoints need abuse and cost protection.

### Day 3 completed

Completed:
- OpenAI API integration
- server-side /api/analyze endpoint
- structured Resume Profile extraction
- structured Job Profile extraction
- multilingual-ready schema
- evidence-backed extraction
- uncertainty handling
- frontend integration
- live API testing
- duplicate paid-request protection
- education association guardrail

Not implemented yet:
- semantic match comparison
- deterministic explainable scoring
- matched / missing requirement logic
- final result UI
- resume improvement suggestions
- public deployment rate limiting
- deployment

### Next milestone for day 4

Resume Profile + Job Profile
→ semantic comparison
→ deterministic explainable matching
→ matched requirements
→ missing / weak requirements
→ final match score

## Day 4

### Goal

Turn the structured Resume Profile and Job Profile from Day 3 into an explainable Resume ↔ Job Description match result.

The main Day 4 principle was:

LLM
→ semantic comparison

Application code
→ deterministic numerical scoring

The LLM must not invent the final match percentage.


### Starting point

At the beginning of Day 4, the application already supported:

PDF Resume
→ text extraction
→ structured Resume Profile

Job Description
→ structured Job Profile

The frontend could display both profiles, but no real matching or score existed yet.


### Matching architecture decision

The matching pipeline was designed as:

Resume Profile + Job Profile
→ flatten Job Description requirements
→ build Resume evidence catalogue
→ LLM semantic comparison
→ validate semantic output
→ deterministic TypeScript scoring
→ Match Result

A separate endpoint was created:

`POST /api/match`

`/api/analyze` remains responsible only for structured Resume and Job Description extraction.

This separation makes debugging easier:

- incorrect extracted profile → inspect `/api/analyze`
- incorrect semantic comparison → inspect `/api/match`
- incorrect percentage → inspect deterministic scoring logic


### Requirement representation

The Job Profile is converted into individual requirements with stable application-generated IDs.

Examples:

- `skill-0`
- `experience-0`
- `responsibility-0`
- `education-0`
- `language-0`

Each requirement includes:

- category
- description
- importance
- Job Description evidence

Requirement importance is:

- required
- preferred
- unspecified

Responsibilities currently default to `unspecified` because the Day 3 extraction schema does not assign explicit importance to them.


### Resume evidence catalogue

Application code creates stable IDs for evidence already present in the Resume Profile.

Examples:

- `skill-0-evidence-0`
- `experience-0-evidence-0`
- `experience-0-highlight-0-evidence-0`
- `education-0-evidence-0`
- `language-0-evidence-0`

The semantic LLM may reference only these IDs.

It is not allowed to write arbitrary new resume evidence into the Match Result.

Application code rejects unknown evidence IDs.


### Match statuses

Four statuses were defined.

#### matched

Strong evidence supports the complete requirement.

Clear semantic or multilingual equivalents are allowed.

Example:

`FEM-Simulation`
↔
`finite element analysis`

#### partial

Relevant evidence exists, but only part of the requirement is supported.

Example:

JD:
`5 years of Python experience`

Resume:
`Python`

The skill is supported, but the required duration is not.

#### missing

No relevant Resume evidence supports the requirement.

Example:

JD:
`SAP`

Resume:
No SAP evidence.

#### uncertain

Potentially relevant evidence exists, but the relationship cannot be determined safely.

This differs from partial:

- partial = known but incomplete
- uncertain = evidence or association itself is ambiguous


### Semantic matching safeguards

The LLM returns only:

- requirement ID
- matched / partial / missing / uncertain
- short explanation
- Resume evidence IDs

The LLM does not return:

- overall percentage
- category percentages
- numerical confidence
- new resume claims
- new requirements
- new free-form resume evidence

Application code validates that:

- every JD requirement is compared exactly once
- no unknown requirements appear
- no duplicate requirements appear
- no unknown evidence IDs appear
- matched and partial results contain evidence
- missing results contain no resume evidence

This prevents the semantic comparison layer from inventing unsupported candidate information.


### Deterministic scoring

The selected MVP scoring rubric is:

Importance weights:

- required = 2
- preferred = 1
- unspecified = 1

Status values:

- matched = 1
- partial = 0.5
- missing = 0
- uncertain = 0

For every requirement:

`earnedPoints = importanceWeight × statusValue`

`possiblePoints = importanceWeight`

Overall score:

`total earned points / total possible points × 100`

Scores are rounded to the nearest whole percentage.

The LLM never calculates this percentage.


### Category breakdown

The same deterministic formula is calculated independently for:

- skills
- experience
- responsibilities
- education
- languages

If the Job Description contains no requirements in a category:

- score = null
- earnedPoints = 0
- possiblePoints = 0

The frontend displays this as:

`N/A`

rather than incorrectly displaying `0%`.

The overall score is calculated directly from all individual requirements.

It is not an average of category percentages.


### Deterministic scoring test

A controlled backend test used:

Resume:
- Python

Job Description:
- Python required
- SAP required
- five years of Python preferred

Expected semantic result:

- Python → matched
- SAP → missing
- five years Python → partial

Manual calculation:

Python:

`2 × 1 = 2`

SAP:

`2 × 0 = 0`

Five years Python:

`1 × 0.5 = 0.5`

Total earned:

`2.5`

Total possible:

`5`

Expected score:

`2.5 / 5 × 100 = 50%`

The `/api/match` endpoint returned:

- overallScore = 50
- skills score = 50
- experience score = 50
- unused categories = null

The result matched the manual calculation exactly.


### Automated scoring tests

A dedicated deterministic scoring test was added.

The tests cover:

- required matched
- required missing
- preferred matched
- partial
- uncertain
- empty category
- multiple requirements with expected mathematical score

Result:

`7 / 7 passed`


### Frontend integration

The frontend now runs the complete pipeline:

1. User selects a PDF.
2. User enters a Job Description.
3. User clicks Analyze Match.
4. `/api/extract-resume` extracts resume text.
5. `/api/analyze` creates Resume Profile and Job Profile.
6. `/api/match` performs semantic comparison and deterministic scoring.
7. The Match Result is displayed.

Loading phases are:

- `Reading Resume...`
- `Analyzing Resume and Job...`
- `Calculating Match...`


### Match Result UI

The frontend now displays:

- overall Match Score
- category breakdown
- matched requirements
- partial requirements
- missing requirements
- uncertain requirements
- requirement importance
- explanation
- Resume evidence

Empty categories display:

`N/A`

Missing requirements do not display fabricated Resume evidence.

The Day 3 structured profiles remain visible temporarily for development verification.


### Paid-request behavior

A successful complete analysis performs:

- one `/api/analyze` LLM call
- one `/api/match` LLM call

No API calls are triggered by React effects or rerenders.

Duplicate request protection remains active.

If the user clicks Analyze again without changing the PDF or Job Description:

- the existing result remains visible
- no new paid request is sent

If `/api/analyze` succeeds but `/api/match` fails:

- the structured profiles are retained
- retrying with unchanged input calls only `/api/match`
- `/api/analyze` is not repeated unnecessarily


### Real resume testing

The matching system was tested using a real German mechanical-engineering resume.

Multiple controlled Job Descriptions were created to test different matching situations.


#### High-match engineering JD

Tested requirements involving:

- MATLAB
- Python
- SolidWorks
- LabVIEW
- laboratory experiments
- technical data analysis
- sensor calibration
- quality testing
- German proficiency

Expected strong matches were identified correctly.


#### Partial-match simulation JD

Tested:

- advanced Ansys
- multiple years of finite element analysis
- CAD
- SolidWorks
- Python
- MATLAB

The resume contains only basic Ansys Workbench knowledge, allowing the system to distinguish supported skills from stronger unsupported requirements.


#### False-positive / low-match JD

Tested requirements that are not supported by the resume:

- SAP
- CATIA
- Siemens NX
- five years of automotive experience
- APQP
- FMEA
- Six Sigma

The system did not incorrectly convert related engineering experience into full matches.


#### German semantic matching

A German Job Description was tested against the German resume.

Examples included:

- Laborversuche
- technische Messdaten
- MATLAB
- Python
- LabVIEW
- optische Messtechnik
- Sensorik und Kalibrierung

Semantic relationships were classified correctly.


#### Cross-language semantic matching

An English optical-engineering Job Description was tested against the German resume.

Examples:

German Resume:

`Design und Herstellung mikrodiffraktiver optischer Elemente`

English JD:

`Experience designing optical or micro-optical components`

The system successfully recognized the semantic relationship across languages.

Additional tested concepts included:

- Zemax / ZemaxStudio
- laboratory experiments
- optical design
- Python
- SolidWorks
- CAD
- microfabrication


### Manual Day 4 result

All planned Day 4 tests passed:

- obvious matches
- obvious missing requirements
- partial requirements
- German matching
- English matching
- cross-language matching
- false-positive resistance
- evidence grounding
- deterministic score calculation
- empty-category handling
- duplicate paid-call protection


### Validation

- `npm run test:scoring` passed: 7/7
- `npm run lint` passed
- TypeScript check passed
- `npm run build` passed
- `/api/match` controlled PowerShell test passed
- full frontend pipeline passed
- real CV/JD semantic tests passed


### What I learned

- Why semantic comparison and scoring should be separate responsibilities.
- How deterministic scoring makes an AI result explainable.
- Why the LLM should classify relationships rather than invent percentages.
- How stable requirement IDs make LLM output easier to validate.
- How evidence IDs reduce hallucinated resume evidence.
- Difference between matched, partial, missing, and uncertain.
- Why partial should not mean merely “somewhat related.”
- Why multilingual matching benefits from semantic comparison instead of exact keywords.
- Why related technologies should not automatically count as equivalent.
- Why empty categories should be N/A instead of 0%.
- How to manually verify a scoring function mathematically.
- How automated tests can verify deterministic scoring independently from the LLM.
- How to reduce repeated paid LLM requests in the frontend.


### Day 4 completed

Completed:

- semantic Resume ↔ Job Description matching
- multilingual semantic comparison
- matched / partial / missing / uncertain classifications
- evidence-ID grounding
- deterministic match score
- category score breakdowns
- automated scoring tests
- frontend Match Result integration
- real CV/JD testing
- false-positive testing
- cross-language testing

Not yet implemented:

- resume improvement suggestions
- final UI polish
- production abuse protection
- rate limiting
- demo mode
- deployment
- final README / portfolio presentation


### Next milestone

Day 5:

Match Result
→ grounded resume improvement suggestions
→ clearer final result presentation
→ MVP UI/UX polish