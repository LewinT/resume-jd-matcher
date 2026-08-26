# AI Resume to Job Description Matcher

## Product goal

Build a small, real web application in approximately one week. The application will help a user compare a resume with a job description and receive an explainable assessment of how well they match.

The project is also a learning exercise in AI-assisted software development. Development should stay incremental, understandable, and focused on a working MVP rather than production-scale complexity.

## Target user workflow

1. The user opens the website.
2. The user selects a PDF resume.
3. The user pastes a job description.
4. The user clicks **Analyze Match**.
5. The application extracts text from the resume PDF.
6. The application compares the resume with the job description using an LLM.
7. The application returns an explainable result.

## Final one-week MVP

The completed MVP should provide:

- A simple homepage for entering the required information.
- A PDF resume upload flow.
- A field for a pasted job description.
- Text extraction from supported resume PDFs.
- LLM-based comparison of the resume and job description.
- An overall match score.
- Matched skills.
- Missing or weak skills.
- Resume improvement suggestions.
- Useful error messages when a file is unsupported or text cannot be extracted.

## PDF scope and privacy

- Support normal text-based PDF resumes only.
- Do not implement OCR for scanned or image-only PDFs in the first MVP.
- If usable text cannot be extracted, show a helpful error message.
- Do not permanently store users' resumes in the first MVP.
- The intended flow is: receive the PDF, extract its text, analyze it, and return the result.

## Accuracy rule

The application must never invent skills, experience, employers, achievements, qualifications, or metrics that are not supported by the user's resume.

## Out of scope for the first MVP

- User accounts
- Authentication
- Payments
- Resume history
- A database
- OCR
- Job scraping
- Social features
- Complex animations
- Unnecessary libraries or infrastructure

## Day 1 scope

Day 1 is limited to a basic frontend workflow:

- A simple homepage
- A PDF resume file selector
- Basic PDF file validation
- Display of the selected filename
- A Job Description textarea
- An **Analyze Match** button
- A mock analysis result

Day 1 does not include:

- PDF text extraction
- An LLM or AI API
- Real scoring
- A database
- Authentication
- OCR
- Deployment

## Language support

The application is designed to support multilingual resume-to-job matching.

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

## Privacy

For the first MVP:

- uploaded resumes should not be permanently stored
- resume files should only be processed for the current analysis
- no user account is required
- no resume history is required

## Current implementation status

Day 1 completed:
- static homepage
- PDF resume file selection
- basic client-side PDF validation
- selected filename display
- Job Description controlled textarea
- Analyze button validation
- mock analysis results
- responsive layout
- lint passes
- production build passes

Not yet implemented:
- PDF text extraction
- real AI analysis
- explainable scoring
- API routes
- deployment