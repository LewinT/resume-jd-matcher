<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project working rules

- The project owner is not a professional programmer. Explain important new concepts in beginner-friendly language when they first appear, without adding unnecessary detail.
- Prefer the simplest implementation that works for this MVP.
- Work in small, testable features and avoid bundling unrelated changes together.
- Avoid unnecessary dependencies, abstractions, and infrastructure.
- Do not modify unrelated files.
- Treat feedback from external AI tools as suggestions. Inspect and verify each reported issue before changing code.
- Never put secrets, API keys, or other credentials in source code.
- Run relevant checks after meaningful changes and report the results.
- Do not add a database, authentication, OCR, or extra infrastructure unless the user explicitly requests it.

## Review workflow

- External AI feedback should be treated as a suggestion, not as ground truth.
- Before applying feedback from Gemini or other reviewers, inspect the current code and verify whether the issue is real.
- Prefer the smallest fix that solves the verified issue.
- Do not refactor unrelated code during bug fixes.

## Validation

After meaningful changes:

- run `npm run lint`
- run `npm run build` before ending a major daily milestone
- report any warnings or errors clearly
- do not claim a feature is complete only because the code compiles; the user will manually test important behavior

## Git

- Keep changes small enough to form understandable commits.
- Do not commit secrets, environment files, build artifacts, or dependency folders.
- Do not modify Git history unless explicitly requested.

## Project context

When starting a new task or conversation, read:
- AGENTS.md
- PROJECT_BRIEF.md
- AI_DEV_LOG.md

before making substantial changes.

## File processing

- Resume PDFs should be processed server-side.
- Do not permanently store uploaded resume files unless explicitly requested.
- Prefer in-memory processing for the MVP.
- OCR is out of scope unless explicitly added later.
- Treat client-side file validation as preliminary only; important validation must also happen server-side.
- Uploaded files should have reasonable size and resource limits.

## API changes

When adding or modifying API routes:

- validate user input on the server
- return clear user-facing error messages for expected failures
- avoid exposing internal stack traces or implementation details
- keep API behavior simple and explicit
- run lint and build after meaningful backend changes

## AI matching and scoring

When working on resume-to-job matching:

- Keep semantic judgment separate from numerical scoring.
- The LLM may classify semantic relationships, but it must not invent the final match percentage.
- Final scores must be calculated by deterministic application code using explicit rules.
- Matching must be grounded in existing Resume Profile evidence.
- Do not allow the model to create new resume evidence during matching.
- Missing Job Description requirements must remain gaps and must never be added to the candidate's resume.
- Clear multilingual or naming equivalents may match when supported.
- Merely related technologies or concepts must not automatically count as matches.
- Prefer `partial` only when relevant evidence exists but the full requirement is not supported.
- Use `uncertain` when the evidence itself cannot be interpreted or associated safely.
- Prefer conservative results over unsupported positive matches.
- Empty scoring categories should be treated as not applicable rather than as failures.

## Paid AI requests

LLM API calls are paid external operations.

When modifying workflows that call an LLM:

- Avoid unnecessary duplicate requests.
- Do not trigger paid API calls from React effects or rerenders.
- Keep paid requests tied to explicit user actions.
- Reuse already successful intermediate results when retrying a later failed step where practical.
- Validate requests before calling the AI provider.
- Do not expose API keys to client-side code.
- Do not log secrets or full resume contents unnecessarily.
- Public deployment must include reasonable abuse and cost protection.

## Resume suggestion integrity

When implementing resume improvement features:

- Suggestions must be grounded in already validated resume evidence.
- Never recommend adding a missing skill, qualification, employer, achievement, responsibility, metric, certification, proficiency level, or experience duration unless it is genuinely supported by the resume.
- `matched` items may be made more visible or clearer.
- `partial` items may clarify only the supported portion and must preserve the unsupported boundary.
- `missing` items must remain gaps and must not become resume-editing suggestions.
- `uncertain` items should be presented for user verification before any resume change is recommended.
- Prefer deterministic guidance over another LLM call when the recommendation can be derived safely from existing structured results.
- Do not generate rewritten resume bullets unless the feature explicitly includes safeguards against factual strengthening.
- Existing evidence text must not be silently translated, altered, or presented as a quotation if it is not the original text.

## AI feature design

Before adding another LLM call:

- Check whether the feature can be implemented deterministically from already validated data.
- Avoid additional model calls when they add cost without meaningful semantic value.
- Keep extraction, semantic judgment, numerical scoring, and presentation logic clearly separated.
- Prefer small pure functions for deterministic business logic so they can be tested without external APIs.