# Repository Map

Inspection basis: `b76de0a63105c74e03ba74e28410c668a1fe6160` on `main`.

Use this map selectively. Verify every touched surface against current code and configuration; do not assume this snapshot remains correct.

## Stack and major directories

| Path | Verified responsibility |
| --- | --- |
| `src/app/` | Next.js 14 App Router pages/layout; `/` redirects to `/dashboard`. |
| `src/components/` | React UI grouped by feature and shared/layout elements. |
| `src/services/` | Frontend domain boundary selecting mock or API behavior. |
| `src/store/` | Zustand client state and persistence/hydration. |
| `src/lib/` | Shared API transport, utilities, workflow editor, and mock fixtures. |
| `tests/browser/` | Playwright mock-mode flows. |
| `tests/browser-api/` | Playwright full API/auth flows. |
| `backend/src/modules/` | Nest feature controllers/services. |
| `backend/src/repositories/` | Native MongoDB access and ownership/scope helpers. |
| `backend/src/database/` | Connection, indexes, seed data, and the explicit scope migration. |
| `backend/src/orchestrator/` | Workflow validation/traversal, prompts, structured output, drift, artifacts, and run state. |
| `backend/src/queues/` | BullMQ producer and in-process worker with a Redis run lock. |
| `backend/src/llm/` | Provider adapters and user-scoped routing. |
| `backend/src/security/` | Provider-key encryption/masking and log redaction. |
| `backend/src/config/` | Environment mapping and production-secret guard. |
| `backend/test/` | Jest unit/integration tests and separate e2e specs. |
| `scripts/` | Frontend confidence checks and Docker infrastructure startup. |

There are two independent npm projects and lockfiles; there are no npm workspaces. Root is Next.js/React/TypeScript/Tailwind/Zustand/Playwright. `backend/` is NestJS/Fastify/TypeScript with MongoDB, Redis/BullMQ, Zod, Jest, and multiple LLM adapters.

## Entry points and boundaries

- Frontend shell: `src/app/layout.tsx`; root redirect: `src/app/page.tsx`; routes: `src/app/**/page.tsx`.
- Frontend transport: `src/lib/api-client.ts`. API mode is controlled by `NEXT_PUBLIC_API_MODE=api`; the default is mock mode. It sends `X-Workspace-Id`, keeps the access token in memory, and uses the refresh cookie with single-flight retry.
- Backend bootstrap: `backend/src/main.ts`; module graph: `backend/src/app.module.ts`. Fastify registers cookies, Helmet, credentialed CORS, rate limiting, request IDs, error handling, and non-production Swagger.
- Persistence: `backend/src/database/database.service.ts`; indexes: `index-definitions.ts`; shared scoping: `repositories/base.repository.ts` and `modules/workspaces/workspace-scope.service.ts`.
- Auth: `modules/auth/`, `common/guards/jwt-auth.guard.ts`, and `config/production-secret.guard.ts`.
- Workflow execution: `orchestrator/workflow-orchestrator.service.ts`, `queues/workflow.queue.ts`, and `queues/workflow.processor.ts`. The API process hosts the worker; there is no separate worker entry point.
- API contracts: `backend/src/contracts/`, `common/filters/global-exception.filter.ts`, and controller `ok`/`list` envelopes.
- Local infrastructure: root and backend `docker-compose.yml` currently define equivalent MongoDB 7 and Redis 7 services.

Redis is used for BullMQ/run locking and health, not shared application caching. Backend usage/dashboard caches and frontend GET caches are process-local. No transaction layer is present for multi-document writes.

## Commands by verification surface

| Surface | Commands |
| --- | --- |
| Deterministic install | `npm ci`; `npm --prefix backend ci` |
| Frontend lint/types/build/checks | `npm run check` |
| Backend lint/types/build/unit | `npm run check:backend` |
| Both aggregate groups | `npm run check:all` |
| Frontend targeted confidence | `npm run test` or `npm run test:frontend` |
| Backend unit | `npm run test:backend` |
| Backend e2e with Mongo/Redis | `npm run test:e2e` |
| Mock browser | `npm run test:browser` |
| API/auth browser | `npm run test:browser:api` |
| Local services | `npm run dev:infra` |

`check:all` does not run e2e or browser suites. No formatter/format script and no tracked CI workflow exist. No Node version or package-manager version is pinned.

## High-risk surfaces

- Auth/session/cookie/CORS/secrets: run auth, origin, cookie, production-secret, HTTP e2e, and API-browser coverage as applicable.
- Workspace or ownership changes: exercise multi-user/workspace isolation and approval scope tests; keep child access behind a scoped parent.
- Database/index/migration or multi-write changes: review compatibility, partial failure, uniqueness, recovery, and existing data.
- Workflow/queue/concurrency/realtime: review snapshots, budgets, stop states, persisted-before-published events, dedupe/idempotency, the non-renewed 900-second lock, and single-process event delivery.
- Provider routing/URLs/keys and usage/pricing: review outbound-request security, encryption/redaction, user scope, and cost accuracy.
- API contract or frontend transport changes: test both mock and API modes plus envelope/error/auth-refresh behavior.

## Conflicts and unresolved facts

- `docs/PROJECT_ARCHITECTURE.md` is a 2026-06-06 working-tree snapshot. Its localStorage/no-refresh auth description is stale; current code uses memory-only access tokens and cookie refresh. Its settings/approval scope and test inventory are also outdated.
- `docs/ALFRED_v2_Master_Blueprint.md` and planning/spec artifacts contain assumptions or future work; use them only as leads and verify against code. The repository does not depend on `ALFRED_v4_Part_1.md` through `ALFRED_v4_Part_4.md`.
- `docs/RESOURCE_SCOPE_MATRIX.md` is directionally closer to current scope, but code remains authoritative.
- README's Swagger statement is incomplete: Swagger is enabled only outside production.
- The tracked `.gitignore` is effective; the separate tracked `gitignore` is legacy duplication.
