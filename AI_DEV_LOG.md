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