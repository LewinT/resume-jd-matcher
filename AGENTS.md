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
