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