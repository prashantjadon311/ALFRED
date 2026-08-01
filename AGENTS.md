# A.L.F.R.E.D. Repository Instructions

## Authority and context

The task defines the outcome; current code/configuration define paths, behavior, commands, and conventions. Verify and adapt suggested code. Report conflicts with verified invariants.

Before editing, inspect `git status --short`, relevant code/tests, and the current diff. Preserve unrelated work. Consult `docs/codex/REPO_MAP.md` selectively and verify touched surfaces. Use `rg` and bounded reads; do not dump/repeatedly scan the repository or reread unchanged files without reason.

## Repository and commands

- Root: Next.js 14/React 18/TypeScript/Tailwind/Zustand in `src/`.
- `backend/`: NestJS 10/Fastify, MongoDB, Redis/BullMQ, Jest. Entrypoints: `backend/src/main.ts`, `backend/src/app.module.ts`.
- Install the two lockfile-backed projects with `npm ci` and `npm --prefix backend ci`. No Node version is pinned.
- Development: `npm run dev:infra`, `npm run dev`, `npm run dev:backend`, or `npm run dev:all`.
- Build: `npm run build`, `npm run build:backend`, or `npm run build:all`.
- Lint: `npm run lint`; backend: `npm --prefix backend run lint`.
- Typecheck: `npm run typecheck`; backend: `npm --prefix backend run typecheck`.
- Tests: `npm run test`, `npm run test:backend`, `npm run test:e2e`, `npm run test:browser`, and `npm run test:browser:api`.
- Aggregate checks: `npm run check`, `npm run check:backend`, `npm run check:all`. They exclude e2e and browser suites.
- Formatting: no formatter or formatting command is configured; do not invent one.

Docker is required for infrastructure/e2e/API-browser checks. Browser checks expect Chrome at `/usr/bin/google-chrome` unless `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` is set.

## Invariants

- Authenticate protected backend access. Scope user-owned records by `userId`; scope workspace resources by both `userId` and `workspaceId`. Preserve scoped-parent checks for child records without `workspaceId`.
- Keep access tokens in memory and refresh tokens in HttpOnly cookies. Preserve credentialed CORS/origin checks, production secret validation, log redaction, and encrypted/masked provider keys.
- Preserve API success/list envelopes, error envelopes, request IDs, validation behavior, and ObjectId/date serialization unless compatibility change is explicit.
- Workflow changes must preserve validated requirement/DSL snapshots, budget and human-review stops, persisted events, per-node idempotency, and the Redis run-lock ownership check.

## Task execution

Prompt contract: `docs/codex/CHATGPT_TASK_TEMPLATE.md`. Skills: `.agents/skills/execute-chatgpt-task/`, `.agents/skills/plan-complex-change/`, and `.agents/skills/review-risky-change/`. Use `PLANS.md` only for complex work and apply `docs/codex/REVIEW.md`.

Make the smallest complete change; avoid unrelated refactors. Default to one agent and task-required skills/tools only. Keep related work in one subsystem session and use a fresh session for unrelated work. Never overlap edits or repeat handoffs.

Run the smallest useful check, then broaden by risk. Test behavior changes. Inspect results and the final diff. Never claim completion when required checks failed or were not run. Bound output/store full logs locally; do not narrate routine calls. Never trade validation, security, readability, error handling, or maintainability for tokens; never minify source.

Do not commit, push, upload, create/switch branches, or open a pull request. Do not bypass tests or hooks. Update durable instructions only for recurring rules.

Final responses contain only: outcome; files changed; verification commands/results; unresolved blockers/risks; manual checks. Do not paste whole changed files or create retrospective documents.
