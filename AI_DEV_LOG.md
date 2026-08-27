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