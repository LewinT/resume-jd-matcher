<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project working rules

- The project owner is a beginner programmer. Explain important new concepts in beginner-friendly language when they first appear, without adding unnecessary detail.
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
