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

Current Day 3 flow:

PDF Resume
→ server-side PDF extraction
→ resume text

Resume text + Job Description
→ server-side LLM structured analysis
→ Resume Profile + Job Profile

Resume Profile + Job Profile
→ planned explainable matching logic
→ final result

## Current implementation status

### Day 1 completed

- homepage UI
- PDF resume file selection
- client-side PDF validation
- selected filename display
- Job Description controlled textarea
- Analyze button validation
- mock result UI
- responsive layout
- lint passed
- production build passed

### Day 2 completed

- server-side PDF extraction API
- server-side PDF validation
- in-memory PDF parsing using unpdf
- file-size protection
- page-count protection
- invalid/damaged PDF handling
- frontend-to-backend PDF upload
- loading state
- extraction error state
- extracted text preview
- English resume PDF tested successfully
- German resume PDF tested successfully
- German Unicode characters tested successfully
- lint passed
- production build passed

### Day 3 completed

- server-side LLM integration
- structured Resume Profile extraction
- structured Job Profile extraction
- English/German-ready structured schema
- evidence-backed extraction
- uncertainty handling
- frontend end-to-end analysis flow
- duplicate analysis protection

### Not yet implemented

- semantic matching
- explainable scoring
- matched / missing requirement logic
- final result UI
- resume suggestions
- deployment protection
- deployment

## Known limitations

- Multi-column PDF layouts may not preserve the original visual reading order during text extraction.
- Scanned/image-only PDFs are not supported.
- Extracted text is currently shown mainly for development verification.

These limitations are acceptable for the current MVP unless they block downstream LLM analysis.

When extracted PDF text contains ambiguous layout or ordering, downstream AI analysis should prefer explicit evidence and avoid inventing uncertain relationships.

## Next milestone

Day 3 will focus on:

- integrating an LLM
- converting extracted resume text into a structured resume profile
- converting the Job Description into structured requirements
- testing English and German inputs