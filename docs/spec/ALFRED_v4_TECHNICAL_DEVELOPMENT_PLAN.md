# A.L.F.R.E.D. v4 — Technical Development Plan

**Plan type:** technical decomposition of the approved 20-phase development execution plan  
**Product:** A.L.F.R.E.D. — Agentic Logic Framework for Real-time Execution and Deployment  
**Canonical scope authority:** A.L.F.R.E.D. v4 and ANNEX A — IMPLEMENTATION ARTIFACTS  
**Implementation baseline:** prashantjadon311/ALFRED, main at b76de0a63105c74e03ba74e28410c668a1fe6160  
**Baseline date:** 2026-06-11  
**Prepared:** 2026-08-01  
**Technical decomposition:** 20 development phases → 150 technical sub-phases  

## 1. Purpose and boundary

This document converts every approved development phase into dependency-ordered technical sub-phases. It does not replace the 20-phase plan, modify A.L.F.R.E.D. v4, create a new product capability, create a new durable object, or create a new requirement ID.

The technical sub-phases are implementation packages. Each should normally become a small milestone containing one or more tightly related GitHub issues and reviewable pull requests. A sub-phase is complete only when its code, migration, test, telemetry, rollback, documentation, and traceability evidence all pass.

No dates, staffing promise, or total budget are included. v4 §28 remains **BLOCKED — NOT SUPPLIED**: developers and skills, guaranteed hours, monthly budget, funded months, competing obligations, and failure consequence are unknown.

## 2. Source precedence

1. A.L.F.R.E.D. v4 — fixed product and requirement authority.
2. ANNEX A — data, state, layout, component, edge-case, error, and 181-ID traceability authority.
3. Approved 20-phase development plan — phase outcomes, release gates, kill gates, and exclusions.
4. GitHub baseline and PROJECT_ARCHITECTURE snapshot — current implementation evidence only.
5. v2 and older architecture/deployment/API documents — historical evidence only; they cannot override v4.

## 3. How a technical sub-phase must execute

Every technical sub-phase follows this internal order:

1. **Contract:** link existing FR/NFR IDs, define scope, interfaces, failure behavior, tenant boundary, cost treatment, and acceptance evidence.
2. **Migration:** use expand → dual-read/write → backfill → verify → cutover → contract for persisted-data changes.
3. **Backend/runtime:** implement repository, service, controller/worker, validation, authorization, audit, and typed errors.
4. **Frontend:** implement only applicable happy, empty, loading, waiting, denied, failed, partial, recovery, and budget-blocked states.
5. **Verification:** unit, integration, API E2E, browser, isolation, adversarial, migration, recovery, performance, accessibility, and evaluation tests according to risk.
6. **Operations:** emit correlation IDs, structured logs, metrics, traces, alerts, runbook steps, and support evidence.
7. **Release:** default risky breadth off, canary where applicable, verify rollback/forward-fix, update Annex A8, then close the gate.

## 4. Cross-cutting technical rules

- Preserve the Next.js + NestJS/Fastify + MongoDB + Redis/BullMQ modular monolith.
- Keep Web, API, and Worker as deployables from one repository. Isolate only code, browser, parser, and render workloads for security/resource boundaries.
- FlowVersion remains the sole executable definition.
- No external side effect may bypass Work Contract, Authority Grant, budget, Effect, audit, and usage enforcement.
- Persist the Effect identity before dispatch. Unknown provider outcome becomes uncertain and blocks overlapping retry.
- Persist events before publication. Realtime transport is delivery, not the source of truth.
- Never mix a dependency-major upgrade with a kernel schema redesign in the same PR.
- Never make destructive schema changes without verified backfill and rollback/forward-fix evidence.
- Every tenant-owned resource must be filtered at repository level and verified by cross-user and cross-workspace tests.
- Every user-facing value must be labelled live, demo, mock, estimated, unavailable, beta, partial, or planned as applicable.
- No public API freeze before Phase 10 proves the kernel resources end to end.
- No microservice extraction without a measured scale or security trigger.
- No invisible production prompt/Agent self-modification.
- A failed phase gate blocks the next phase; later UI or feature work cannot hide it.

## 5. Release and dependency map

| Release | Development phases | Technical sub-phases | Gate |
|---|---|---:|---|
| Pre-build | 1 | 7 | Verified baseline and 181-ID status |
| R0 — Truth & Reliability | 2–7 | 45 | Safe, truthful, recoverable current product |
| R1 — Universal Work Core | 8–10 | 23 | Human-accepted governed Mission |
| R2 — Builder Core | 11–14 | 29 | Governed Builder + knowledge + tools |
| R3 — AI Company + Professional Packs | 15–16 | 14 | Evaluated packs and justified organization |
| R4 — Creator Work OS | 17 | 7 | Rights-aware creator pipeline |
| R5 — Operate & Team GA | 18–20 | 25 | Automations, paid team, measured GA |
| **Total** | **1–20** | **150** | |

The phases remain sequential. Within a phase, backend, frontend, QA/security, and documentation may proceed in parallel only after the relevant contract/schema is frozen and only when shared production-code edits do not overlap.

---

## Phase 1 — Repository Truth, Reproduction, and 181-ID Baseline

**Outcome:** one reproducible baseline and no unsupported implementation claim.  
**Primary source:** approved Phase 1; Annex A8; all requirement families.  
**Prerequisite:** none.  
**Change rule:** no feature or dependency-major work in this phase.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T01.1 | Source freeze and provenance | Record repository, branch, SHA, tags, active PRs, lockfile hashes, runtime versions, environment contract, deployment targets, and architecture-document status. Create a baseline manifest without changing production behavior. | Manifest resolves every build input to an exact version; dirty or untracked production changes are explained. |
| T01.2 | Clean-environment reproduction | Start MongoDB, Redis, API, Worker, and Web from clean checkout using documented commands. Verify ports, environment validation, seed behavior, health/readiness, and shutdown/restart. | Another clean environment reaches login and health checks using the same instructions. |
| T01.3 | Test and failure census | Run install integrity, lint, typecheck, frontend/backend builds, backend unit tests, HTTP E2E, multi-user/workspace isolation, Playwright mock/API, and existing scripts. Classify every failure as product defect, test defect, environment defect, flaky, or obsolete. | Baseline report contains raw command, result, owner/blocker, and reproduction for every red test. |
| T01.4 | Route/API/runtime inventory | Map current Next.js routes, services, Zustand stores, NestJS modules/controllers/services, API envelopes, queues, worker processors, providers, SSE/polling, feature flags, mocks, and environment variables. | Inventory is code-linked and identifies live, partial, mock-only, unused, and conflicting paths. |
| T01.5 | Data and operational inventory | Map MongoDB collections/indexes, tenant keys, Redis keys/locks/queues, migrations/seeds, backups, logs, metrics, audit paths, secret locations, cost paths, and deployment/runbook gaps. | Every current durable collection and queue has owner, scope, lifecycle, index, recovery, and test status. |
| T01.6 | 181-ID evidence ledger | For each Annex A8 literal ID, record Implemented, Partial, Missing, Incorrect/Risky, or Blocked plus exact code, test, UI, evaluation, or runbook evidence. Do not infer implementation from page names. | Exactly 181 unique IDs; every claim has evidence or an explicit Blocked reason; no new ID is invented. |
| T01.7 | Authority cleanup and blockers | Mark v4/Annex/20-phase plan as authoritative; archive or label conflicting Vite/Express/SQLite/t3.micro and v2 instructions. Carry hypothesis segments as UNVALIDATED. Keep stakeholder/capacity/design blockers explicit. | No active setup/API/deployment guide points to the wrong stack; §28 remains visibly blocked unless factual inputs are supplied. |

**Phase 1 exit:** T01.1–T01.7 green and baseline approved.  
**Rollback boundary:** documentation/manifest only; no product behavior changed.  
**Next phase prohibited if:** clean reproduction or evidence ledger is incomplete.

## Phase 2 — Delivery Engineering, Security Baseline, and Migration Safety

**Outcome:** every later change is gated, recoverable, and reproducible.  
**Primary requirements:** NFR-SEC, NFR-REL, NFR-OBS; approved Phase 2.  
**Prerequisite:** Phase 1 accepted.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T02.1 | Git and release controls | Protect main; require PRs, status checks, review, signed/intentional release tags, changelog discipline, ownership, and emergency forward-fix rules. Define one concern per PR and dependency-upgrade isolation. | Deliberately failing PR cannot merge; release tag resolves to passing evidence. |
| T02.2 | CI build/test matrix | Add deterministic install, lint, typecheck, Web/API/Worker builds, unit, API E2E, isolation, Playwright mock/API, and artifact-retention jobs. Separate fast PR gates from slower release gates. | CI reproduces Phase 1 commands and publishes useful failure artifacts. |
| T02.3 | Supply-chain and secret gates | Add dependency audit, license inventory, secret scan, SBOM, container/package scan, and critical/high triage. Patch compatible vulnerabilities before major upgrades; remove dependencies only after reachability checks. | No unresolved release-blocking secret or critical/high dependency finding. |
| T02.4 | Runtime and environment determinism | Pin Node/package manager/container images; enforce lockfiles and environment schemas; separate local, test, demo, staging, and production configuration; hard-fail unsafe production settings. | Same commit produces reproducible builds; production cannot start with a development-only profile. |
| T02.5 | Migration framework | Create versioned migration registry, preflight, checkpoint, progress, resumability, idempotency, dry-run where possible, verification, forward-fix/rollback policy, and migration audit. | Interrupted migration resumes safely; already-completed step does not duplicate data. |
| T02.6 | Backup and restore rehearsal | Automate or document MongoDB backup/restore plus Redis/BullMQ recovery semantics using non-production data. Verify checksums, indexes, application startup, and recovery ownership. | Restored environment passes smoke/API tests and preserves queue/effect safety assumptions. |
| T02.7 | Fixture and seed containment | Separate development/demo fixtures from production seeds; label test tenants; prevent fixture import in production; make cleanup repeatable. | Production-mode test rejects mock/demo seed and fixture paths. |

**Phase 2 exit:** protected delivery path, recoverable migrations, successful restore, and clean security gate.  
**Rollback boundary:** CI/config/migration tooling can revert without changing product schema.  
**Next phase prohibited if:** dependency or restore gate is red.

## Phase 3 — Backend, Runtime, Database, and Queue Modernization

**Outcome:** supported backend foundations with unchanged product semantics.  
**Primary requirements:** NFR-SEC, NFR-REL, NFR-PERF, NFR-OBS.  
**Prerequisite:** Phase 2 migration and CI gates.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T03.1 | Node 24 LTS runtime | Update engines, local runtime, CI, containers, production process configuration, native modules, and TypeScript target. Remove unsupported Node assumptions. | Current product tests pass on Node 24; prior runtime rollback/forward-fix is documented. |
| T03.2 | NestJS 10 → 11 | Upgrade Nest packages only; resolve lifecycle, DI, metadata, testing, HTTP adapter, and bootstrap changes while preserving success/error envelopes. | API contract snapshots and module/unit/E2E suites show no semantic regression. |
| T03.3 | Fastify 5 family | Upgrade adapter/plugins; migrate schemas/plugin options; validate Helmet, CORS, rate limiting, Swagger, multipart, cookies, and request context. | Auth, validation, uploads, rate limits, error envelopes, and Swagger non-production behavior pass. |
| T03.4 | Backend tooling compatibility | Stage TypeScript, Zod, Jest, ts-jest, ESLint, Pino, RxJS, bcrypt, UUID, Mongo types, and OpenAPI upgrades by compatibility decision. Remove deprecations before the next major. | Each major has isolated PR/evidence; no automatic broad dependency bump. |
| T03.5 | MongoDB driver and server | Upgrade driver, validate sessions/timeouts/ObjectId/date/serialization, rehearse MongoDB 7 → stable 8.0 patch, and control feature compatibility version. | Read/write/query/aggregation/backup/restore and isolation suites pass on target server. |
| T03.6 | Index and migration verification | Recreate/compare index definitions, identify duplicate/missing indexes, measure query plans for critical routes, and backfill only through Phase 2 tooling. | Index verification is repeatable; no unbounded collection scan on critical baseline queries. |
| T03.7 | BullMQ/ioredis/Redis compatibility | Upgrade BullMQ/ioredis first, validate locks, delayed/repeatable jobs, retries, events, reconnect, queue scheduler behavior, then test Redis 7 → supported 8.x. | Worker/API restarts, delayed jobs, failed jobs, dedupe, and reconnect behave as baseline or better. |
| T03.8 | Modernization regression and rollback | Run full API/UI/provider/queue/migration/isolation suite after each upgrade; compare performance and memory; publish per-step rollback/forward-fix record. | Existing product behaves equivalently; upgrades remain independently revertible. |

**Phase 3 exit:** all target backend components supported and baseline semantics preserved.  
**Rollback boundary:** one runtime/framework/data/queue concern per PR.  
**Next phase prohibited if:** data, queue, auth, provider, or isolation behavior changed unintentionally.

## Phase 4 — Frontend Modernization and UI Foundation

**Outcome:** supported, accessible frontend foundation before new product surfaces.  
**Primary requirements:** NFR-UX, NFR-PERF, NFR-SEC.  
**Prerequisite:** stable Phase 3 API contracts.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T04.1 | Next.js 14 → 15 | Upgrade framework/config/lint/runtime behavior, clear deprecations, and verify App Router, redirects, client/server boundaries, dynamic imports, and route builds. | All current routes pass build, hydration, navigation, browser, and API-mode smoke. |
| T04.2 | Next.js 15 → 16 | Upgrade only after T04.1 is stable; migrate configuration/caching/request APIs and remove legacy assumptions. | Route contract and bundle comparison accepted; no hidden runtime fallback. |
| T04.3 | React 18.3 → 19.2 | Upgrade React/DOM and validate Zustand, React Flow, Recharts, Markdown, syntax highlighting, Framer Motion, forms, portals, and Strict Mode behavior. | No duplicate mutation, hydration error, lost state, or broken graph/chart interaction. |
| T04.4 | Frontend tooling | Stage TypeScript, ESLint configuration, Playwright, browser targets, test utilities, and build tooling. Add route bundle reporting and visual-test support. | Deterministic frontend build/test pipeline runs in CI. |
| T04.5 | Styling-system decision | Evaluate Tailwind 3 retention versus 4 migration using migration cost, browser output, accessibility, bundle, and visual regression. Execute only the accepted decision. | Written ADR and passing visual baseline; novelty is not sufficient reason to upgrade. |
| T04.6 | Design tokens and component primitives | Implement approved tokens and Annex A11 component behavior: typography, spacing, color/contrast, focus, reduced motion, responsive rules, forms, tables, overlays, navigation, skeletons, errors, and DataRealityLabel. | Component harness covers states, keyboard, screen reader, contrast, zoom, and reduced motion. |
| T04.7 | Existing-route UI quality gate | Migrate current routes onto the foundation without redesigning product semantics. Verify responsive behavior, performance budgets, visual regression, and blocked human-design links/assets. | Existing UI is stable and accessible; Figma/prototype/assets are supplied or remain explicitly BLOCKED. |

**Phase 4 exit:** supported UI stack and reusable state-complete component foundation.  
**Rollback boundary:** framework, React, styling, and component-system changes remain separate.  
**Next phase prohibited if:** hydration, accessibility, or route performance regresses without accepted evidence.

## Phase 5 — Production Truth, Tenant Isolation, Identity, Secrets, and Cost Truth

**Outcome:** the current product no longer misleads users or leaks platform boundaries.  
**Primary requirements:** FR-MOD, FR-GOV, FR-RUN, NFR-SEC, NFR-PRV, NFR-CST, NFR-OBS.  
**Prerequisite:** Phases 1–4 green.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T05.1 | Mock/production enforcement | Centralize mode policy; refuse mock LLM routing, local fixtures, mock billing, and fallback data in production. Add live/demo/mock/estimated/unavailable metadata through services and DataRealityLabel in UI. | Production-mode E2E proves no mock path can masquerade as live. |
| T05.2 | Resource-scope enforcement | Apply the resource-scope matrix to controller guards, services, repositories, queries, search, events, exports, caches, indexes, and aggregate endpoints. | Cross-user/workspace adversarial tests cover every current resource and mutation. |
| T05.3 | Provider/model scope safety | Preserve verified user-scoped provider ownership until Team rules exist; prevent keys, models, defaults, capabilities, aliases, and health data from crossing owners/workspaces. | Provider/model isolation and masked-response tests pass. |
| T05.4 | Refresh-session architecture | Move refresh token to secure HttpOnly/SameSite cookie, keep access token in memory, implement single-flight refresh/retry, expiry handling, rotation, and frontend boot recovery. | Session survives access expiry; replayed/rotated refresh token is rejected. |
| T05.5 | CSRF, logout, and revocation | Apply CSRF defenses where cookie-authenticated mutation requires them; implement server-side session revocation, logout invalidation, and consistent 401/403 behavior. | Logout/revocation terminates future access across tabs/devices covered by current scope. |
| T05.6 | Secret hardening | Hard-fail weak/missing production secrets; implement key version references, rotation path, redaction in Pino/error/support/export/audit, and ciphertext compatibility. | Secret scan and runtime tests show no plaintext credential in response, log, artifact, or support bundle. |
| T05.7 | Usage and cost truth | Normalize provider/model usage units, cached/reasoning units where supplied, price snapshot/version, currency, method, exact/estimated/unavailable class; correct token estimates and zero-cost behavior. | Recorded provider fixtures reconcile cost; real calls are never shown as zero unless provider-confirmed. |
| T05.8 | Correlated truth gate | Add privacy-aware audit fields and correlation IDs across auth, providers, models, usage, settings, approvals, and existing Runs. Exercise tenant, session, secret, mock, and cost adversarial tests. | One request can be traced safely without exposing secrets/PII; all Phase 5 gates pass. |

**Phase 5 exit:** truthful production mode, repository-level isolation, secure session lifecycle, redacted secrets, and attributable cost.  
**Rollback boundary:** dual auth compatibility only in controlled migration; no indefinite dual-token architecture.  
**Next phase prohibited if:** any critical/high tenant, auth, secret, or cost-truth defect remains.

## Phase 6 — Approval Inbox, Authority Grants, Durable Effects, and Budget Safety

**Outcome:** no governed external action without bounded authority, durable identity, and accepted budget.  
**Primary requirements:** FR-RUN-005, FR-GOV, FR-AST, FR-TOL, NFR-REL, NFR-SEC, NFR-CST, NFR-OBS.  
**Prerequisite:** Phase 5 security and cost truth.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T06.1 | Approval Inbox completion | Expand approval data/API/UI for workspace, assignee, expiry, exact requested action/target/payload digest, risk, cost, decision/reason, correlation, and recovery. Migrate existing approvals safely. | Approve/deny/expire/reassign/filter/audit paths pass tenant and browser tests. |
| T06.2 | AuthorityGrant persistence and lifecycle | Implement Annex A9/v4 fields, indexes, tenant ownership, actor/subject/action/target/payload bounds, environment, expiry, revocation, use count, budget, and lifecycle transitions. | Immutability/lifecycle/repository/isolation tests pass; no self-granted authority. |
| T06.3 | Grant evaluation engine | Compute effective authority by deny-by-default intersection at dispatch time. Centralize reasoned allow/deny output and typed error mapping; block direct service/worker bypass. | Expired, revoked, overused, wrong actor/action/target/payload/environment/budget requests are denied. |
| T06.4 | Effect persistence and seven-state machine | Implement stable Effect identity/idempotency key, exact payload digest, seven states, attempts, provider reference, timestamps, result/error, reconciliation, and compensation evidence where supported. | State-transition, uniqueness, immutability, isolation, and duplicate-delivery tests pass. |
| T06.5 | Effect dispatcher and reconciliation | Persist identity before dispatch; atomically claim; handle confirmed success/failure versus uncertain timeout; reconcile provider state; block overlapping retry/successor action while uncertain. | Crash and unknown-outcome tests produce zero duplicate external effects. |
| T06.6 | Approval invalidation | Recalculate approval validity when actor, action, target, payload digest, authority, environment, or material cost changes; re-request rather than reuse stale approval. | Payload-digest/change tests prove stale approval cannot dispatch. |
| T06.7 | Budget reservation and settlement | Implement estimate/range, accepted cap, atomic reservation, parallel reservation, warnings, debit, release/refund, exhaustion, and budget-blocked state using truthful cost classes. | Concurrent work cannot overspend accepted cap; unknown cost follows declared blocking policy. |
| T06.8 | Common-path integration and threat gate | Route Compare, current provider calls, approved actions, and later tool hooks through the same Grant/Effect/budget/audit/usage contracts. Add bypass, replay, crash, timeout, revocation, and race tests. | Approval denial creates no Grant/dispatch; all external-action paths use common enforcement. |

**Phase 6 exit:** AuthorityGrant and Effect are common mandatory primitives, not optional wrappers.  
**Rollback boundary:** feature-gated cutover with no external write path enabled until reconciliation evidence passes.  
**Next phase prohibited if:** any duplicate/unauthorized action is observed.

## Phase 7 — Worker Recovery, Realtime, Cancellation, Stable Errors, and R0

**Outcome:** current product is recoverable and observable enough to begin the Universal Work Kernel.  
**Primary requirements:** FR-RUN, FR-TOL-008, NFR-REL, NFR-OBS-004, NFR-PERF, NFR-UX.  
**Prerequisite:** common Grant/Effect/budget enforcement.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T07.1 | Renewable leases and fencing | Replace fixed run lock with renewable lease/heartbeat, owner token/fencing, stale-owner protection, and safe checkpoint ownership. | Two workers cannot concurrently own the same execution after lease races/restarts. |
| T07.2 | Retry, DLQ, and stale-Run reconciliation | Add bounded attempts/backoff, terminal/DLQ state, stale scanner, operator-safe retry/reconcile/replay, and completed-node/Effect idempotency preservation. | Worker-kill/API-restart/DLQ tests recover without duplicate completed work or Effect. |
| T07.3 | Durable event backplane | Persist workflow/Mission events before publication; add Redis Streams-backed event IDs, ordering/retention, consumer semantics, and multi-instance delivery. | Persisted history survives publisher/API restart and can rebuild the supported view. |
| T07.4 | Authenticated resumable realtime | Replace polling-first/EventSource limitations with authenticated resumable SSE/fetch stream, last-event resume, slow-consumer policy, reconnect, and visible polling degradation. | Disconnect/reconnect loses no retained event and does not duplicate UI state incorrectly. |
| T07.5 | Streaming and cancellation | Propagate provider streaming and AbortController where supported; implement safe checkpoint, settling/waiting, partial-output, and uncancellable-action behavior. | Supported cancellation stops promptly; unsupported cancellation is honestly shown and cannot trigger overlap. |
| T07.6 | Stable errors and end-to-end telemetry | Implement typed internal errors, stable user categories, retryability/recovery action/correlation ID. Trace Run → node → Grant → provider/tool → ArtifactVersion/Effect; add core metrics/alerts. | Every tested failure maps to a stable category and trace without leaking secrets. |
| T07.7 | Runbooks, chaos drills, and R0 gate | Create runbooks for worker/API restart, provider outage, DLQ, stale lease, uncertain Effect, restore, and emergency Grant revoke. Run all R0 isolation/auth/secret/code/action/recovery gates. | R0 signed green; no open critical/high tenant, auth, secret, arbitrary-code, or duplicate-action defect. |

**R0 exit:** T07.7 passes and release evidence is published.  
**Rollback boundary:** historical events/Effects remain immutable; rollback changes future processing only.  
**Hard stop:** Phase 8 cannot start while R0 is red.

## Phase 8 — Universal Kernel Compatibility and Core-Object Contracts

**Outcome:** controlled migration from the current Project/Requirement/Workflow model to one v4 execution semantic.  
**Primary requirements:** FR-MIS, FR-RUN, FR-FLW, FR-GOV, FR-AST; NFR-REL, NFR-SEC.  
**Prerequisite:** R0 green.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T08.1 | Semantic mapping and ADRs | Map Project, RequirementContract, workflow DSL, WorkflowRun, ArtifactVersion, Approval, usage, and events to Mission, WorkContract, FlowVersion, Run, AuthorityGrant, Effect, and MissionChangeProposal. Record only physical decisions not fixed by v4. | ADRs identify compatibility, ambiguity, migration, and BLOCKED facts without inventing product semantics. |
| T08.2 | Eight core-object contracts | Implement Annex A9 field-level contracts for Mission, WorkContract, FlowVersion, Run, ArtifactVersion, AuthorityGrant, Effect, and MissionChangeProposal with types, validation, tenant keys, version IDs, timestamps, lineage, and immutability. | Schema/validation tests match Annex A9; no ninth core object is invented. |
| T08.3 | Repositories, indexes, and scope | Add/extend repositories, index definitions, ownership filters, uniqueness/lineage constraints, and serialization. Apply repository-level tenant enforcement. | Repository/compound-index/isolation tests pass for all eight core objects. |
| T08.4 | Expand and dual-read/write migration | Add new fields/collections without breaking old reads; implement versioned dual-read/write, checkpoints, backfill, verification counters, and reversible cutover flags. | Existing tenants/runs remain readable throughout staged migration. |
| T08.5 | Legacy compatibility adapter | Translate current workflow snapshots/run/event/artifact views into kernel-compatible projections. Preserve historical identity and explicitly classify unsupported legacy semantics. | Existing WorkflowRuns remain inspectable/replayable under documented compatibility rules. |
| T08.6 | FlowVersion execution boundary | Refactor run creation/dispatch so only an immutable FlowVersion can execute. Agent, Skill, Tool, Work Pack, Plan, and Organization references must compile/bind, not run independently. Keep Organization Orchestrator inside monolith. | Architecture and tests prove one scheduler/orchestrator path; bypass attempts fail. |
| T08.7 | Kernel contract gate | Test immutability, lineage, tenant isolation, dual migration, rollback, legacy reads, one-runtime rule, and failure envelopes. Update Annex A8 status. | No competing old/new orchestrator and no mutation of published versions. |

**Phase 8 exit:** core object contracts and compatibility layer pass without losing historical data.  
**Rollback boundary:** dual-read/write remains until verification; contract cleanup is deferred.  
**Next phase prohibited if:** old Runs become unreadable or a second runtime exists.

## Phase 9 — Mission Intake, Work Contract, Planning, Preview, and Cockpit

**Outcome:** user can define, inspect, approve, and supervise a governed Mission.  
**Primary requirements:** FR-MIS, FR-PLN, FR-GOV, FR-CST; NFR-AIQ, NFR-UX, NFR-OBS.  
**Prerequisite:** Phase 8 contracts stable.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T09.1 | Mission intake contract/API | Implement immutable original request plus clarified requirements, exclusions, constraints, deliverables, acceptance criteria, budget, evidence needs, and requested authority. Add validation, repository, API, and audit transitions. | Intake round-trip, immutability, tenant, validation, and API E2E tests pass. |
| T09.2 | WorkContract lifecycle | Implement draft, version, diff, review, approval/rejection/expiry, active version, and immutable approved contract. Define typed blocking errors for missing/invalid contract. | Run start cannot select an unapproved or stale WorkContract. |
| T09.3 | Typed plan projection | Generate plan dependencies, assumptions, time/cost range, provider-call multiplicity, risk profile, actor/tool/data needs, outputs, evaluations, and authority requests as a projection—not an executable runtime. | Plan is traceable to the exact Mission/WorkContract version and fails explicitly on missing inputs. |
| T09.4 | Authority and cost preview | Resolve proposed Grant bounds, budget reservation, provider responsibility, risk/approval points, and unavailable cost. Mandatory Governed BYOK cannot silently reduce checks to fit cost. | Unaffordable compliant plan blocks with explanation; user sees call multiplicity and responsibility before approval. |
| T09.5 | Governed run-start transaction | Atomically verify approved contract, immutable FlowVersion, budget reservation, valid authority/approvals, and tenant references before creating/queuing Run. Make duplicate start idempotent. | Missing approval/budget/authority or duplicate submit cannot create unintended Runs/Effects. |
| T09.6 | Mission cockpit shell and seven tabs | Build the Work surface/cockpit routing, header/status/owner/budget/actions, and seven Annex A10 tabs using Phase 4 components. Lazy-load heavy views and keep one Work/Build/Operate IA. | Deep links, permissions, navigation, status consistency, and route bundles pass. |
| T09.7 | State-complete UX and PWA boundary | Implement happy, empty, loading, waiting, permission-denied, provider-failed, budget-blocked, partial, retry, recovery, stale, and offline/degraded states. Limit mobile to review/approval/status/light input/artifact review. | Keyboard, screen reader, responsive, reduced-motion, reconnect, and truthful-label tests pass. |
| T09.8 | UJ-01 and audit gate | Exercise request → clarification → contract diff/approval → plan/authority/cost preview → waiting Run → decision through API and browser. Audit each transition. | UJ-01 is explainable from correlated events; no hidden start or approval reuse. |

**Phase 9 exit:** approved contract and safe run-start are usable from one cockpit.  
**Rollback boundary:** new cockpit can be feature-gated while legacy project detail remains read-only compatible.  
**Next phase prohibited if:** user cannot explain scope, authority, budget, or why execution is blocked.

## Phase 10 — Materiality, Successor Runs, Carry-Forward, Evidence, Acceptance, and R1

**Outcome:** one governed Mission safely handles change/recovery and reaches human acceptance.  
**Primary requirements:** FR-MIS-006a, FR-MIS-006b, FR-MIS-006c, FR-RUN, FR-AST, FR-EVL; NFR-REL, NFR-AIQ, NFR-CST, NFR-OBS.  
**Prerequisite:** Phase 9 governed run-start.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T10.1 | Materiality policy and execution signature | Normalize structured contract/Grant/Flow inputs, version the policy, compute execution signature, classify restrictive/material/permissive/no-op changes, and expose reasons. Never compare document text alone. | Golden cases and property tests produce stable classification and signature behavior. |
| T10.2 | MissionChangeProposal concurrency | Implement proposal creation, base-version optimistic concurrency, diff, review, approve/reject/expire, superseded proposal handling, and one effective transition owner. | Concurrent proposals cannot both mutate the active execution decision. |
| T10.3 | Restrictive/material supersession | Pause predecessor at next safe checkpoint, stop new dispatch, settle/cancel work, publish successor versions, close predecessor as Cancelled with superseded_by_change, and create predecessor-linked successor Run. | Crash/restart during supersession converges to one predecessor closure and one successor. |
| T10.4 | Strictly permissive overlay | Allow same-Run continuation only when immutable FlowVersion/execution signature is unchanged and approved WorkContract/Grant bounds broaden safely. Record overlay version and decision evidence. | Any restrictive field, changed signature, payload, or graph forces successor path. |
| T10.5 | Successor identity and Effect safety | Preserve predecessor/successor immutable linkage and existing Effect identities. Block successor overlap on uncertain Effect; reconcile before equivalent action. Never copy NodeExecution into changed graph. | No duplicate external action across predecessor and successor under retries/crashes. |
| T10.6 | Artifact validation and carry-forward | Evaluate immutable ArtifactVersions against successor inputs/dependencies; carry only validated versions with explicit lineage/reuse reason. Handle no-reusable-artifact deterministically. | Stale/incompatible artifact is rejected; full-restart scenario still maintains lineage. |
| T10.7 | Evidence, acceptance, and metrics | Implement minimum assumption, decision, claim/citation, evaluation, artifact, and acceptance views. Separate planned supersession from failure/recovery; record discarded cost/time. | Accepted outcome links to exact contract/Flow/Run/evidence/evaluation versions. |
| T10.8 | R1 vertical slice and kernel API freeze | Run crash, provider failure, budget exhaustion, restrictive/permissive/payload changes, concurrent proposal, uncertain action, no reuse, recovery, and acceptance. Then publish full proven kernel endpoint schemas/stable errors. | One human-accepted Mission within approved scope/authority/budget; R1 signed green. |

**R1 exit:** the Universal Work Kernel works end to end and is better enough to justify continuing.  
**Rollback boundary:** immutable history remains; rollback changes future policy/version selection only.  
**Commercial kill gate:** if a simpler provider-native workflow is not materially worse on accepted outcome, rework the kernel/differentiation before Phase 11.

## Phase 11 — DSL v2 and Deterministic Execution Control

**Outcome:** safe composable control flow with v1 compatibility.  
**Primary requirements:** FR-FLW, FR-RUN, FR-TOL, NFR-REL, NFR-PERF, NFR-CST.  
**Prerequisite:** R1 kernel semantics frozen.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T11.1 | DSL v2 schema and migration | Define versioned schema, typed ports, input/output contracts, node/edge validation, migrations, canonical serialization, and v1 read/run compatibility. | Golden v1/v2 fixtures validate and execute under declared compatibility. |
| T11.2 | Bounded expression mechanism | Replace unsafe arbitrary expressions with approved typed/bounded policy evaluation; define allowed operators, inputs, complexity limits, and error categories. | Injection, unbounded complexity, type mismatch, and nondeterminism tests pass. |
| T11.3 | Sequential/router/loop controls | Implement sequential, router, and bounded loop semantics with iteration/time/token/cost/no-progress limits and explicit termination reasons. | Infinite/no-progress loops cannot publish or exceed declared bounds. |
| T11.4 | Split/join/quorum controls | Implement parallel split, join identity, deterministic merge where promised, quorum, branch output completeness, and budget reservation. | Join completes exactly once under duplicate delivery and branch retries. |
| T11.5 | Subflow/failure/timeout/cancel controls | Implement subflow reference/versioning, failure routes, timeouts, branch cancellation, compensatable/non-compensatable behavior, and human intervention points. | Invalid reference/failure/timeout/cancel paths produce typed recoverable state. |
| T11.6 | Scheduler and checkpoint persistence | Extend scheduler/worker state for branches, loop counters, checkpoints, leases, partial results, retry ownership, Effect awareness, and replay/resume. | Killed branch resumes without corrupting join, output, budget, or Effect identity. |
| T11.7 | DSL compatibility and chaos gate | Test invalid graphs, cycles, bounds, nested subflows, worker kill, duplicate events, pause/resume, replay, budget exhaustion, and v1 compatibility. | Invalid/unbounded graph cannot publish; supported v1 Runs remain usable. |

**Phase 11 exit:** DSL v2 is safe, bounded, resumable, and backward-compatible.  
**Rollback boundary:** published version selects interpreter version; no in-place DSL mutation.  
**Next phase prohibited if:** parallel/join recovery is nondeterministic or duplicates effects.

## Phase 12 — Flow Builder, Agent Builder, Natural-Language Drafting, and Dev Deployments

**Outcome:** users can build/test/version/publish definitions that use the same kernel.  
**Primary requirements:** FR-FLW, FR-AGT, FR-MOD, FR-GOV, FR-EVL; NFR-UX, NFR-PERF, NFR-AIQ.  
**Prerequisite:** DSL v2 and kernel contracts stable.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T12.1 | Flow editor domain model | Update React Flow/editor helpers for typed nodes/ports, schema mapping, validation markers, graph limits, selection, connection rules, and autosave-draft boundaries. | Editor cannot create/persist structurally invalid connections without visible errors. |
| T12.2 | Flow version/diff/publish/rollback | Implement draft versions, validation, dry run, trace, diff, immutable publish, exact reference inspector, rollback-by-new-binding, and migration from current workflows. | Published FlowVersion never mutates; rollback affects future execution only. |
| T12.3 | Legacy agent-nodes retirement | Inventory remaining callers, migrate valid data, switch reads, remove write path or return 410 Gone, delete module only after compatibility evidence. | No active UI/API/runtime depends on legacy agent-nodes; historical Runs remain readable. |
| T12.4 | AgentVersion contract and Builder | Implement Agent draft/version with purpose, instructions, model/fallback, requested capabilities, guardrails, knowledge/tools, limits, handoff, and evaluations. Build corresponding editor surface. | Immutable AgentVersion round-trip and tenant/permission tests pass. |
| T12.5 | Dependency and authority validation | Resolve referenced model/tool/knowledge/evaluation versions and availability; block unauthorized/unavailable/stale dependency and explain remediation. | Agent/Flow cannot publish with unresolved or unauthorized dependency. |
| T12.6 | Test Runs and development deployments | Implement traceable test conversation/Run, cost/evaluation/failure/recovery views, and exact-version development Deployment binding. Production promotion remains blocked. | Build → validate → test → publish → dev Run succeeds under Contract/Grant/Effect. |
| T12.7 | Natural-language drafting and Builder gate | Generate Flow/Agent drafts with assumptions and validation errors; require human review, schema validation, authority/budget checks, and immutable publish. Verify IA, accessibility, performance, and browser behavior. | Generated draft cannot execute/publish silently and creates no competing runtime. |

**Phase 12 exit:** Builder output compiles/binds to FlowVersion and runs only through the kernel.  
**Rollback boundary:** draft/published versions are immutable; legacy removal follows verified cutover.  
**Next phase prohibited if:** generated or published definitions bypass approval or execution semantics.

## Phase 13 — Object Storage, Knowledge/RAG, Citations, Memory, and Assets

**Outcome:** governed tenant-isolated knowledge and artifact storage.  
**Primary requirements:** FR-KNW, FR-AST, FR-GOV, FR-EVL; NFR-SEC, NFR-PRV, NFR-AIQ, NFR-PERF.  
**Prerequisite:** Phase 12 version/reference contracts.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T13.1 | Private object-storage abstraction | Add S3-compatible port, private buckets, checksums, presigned upload/download, size/type limits, encryption/config, malware hook, retention, export/deletion, and ArtifactVersion lineage. | Cross-tenant URL/object attempts fail; checksum and expired-link tests pass. |
| T13.2 | KnowledgeBase/source lifecycle | Implement KnowledgeBase/source ownership, immutable source ArtifactVersion, authorized upload/web source, ingestion job status/progress/error/cancel/retry, and source-version refresh. | Ingestion lifecycle is resumable, tenant-scoped, and auditable. |
| T13.3 | Parse/chunk/index pipeline | Isolate parsers; validate content type; produce versioned chunks/metadata; handle malicious/corrupt files; store index references and ingestion lineage. | Parser crash/malware/partial failure cannot leak or mark incomplete index ready. |
| T13.4 | Vector and hybrid retrieval | Implement RetrievalPort, per-tenant namespaces, embedding version, hybrid lexical/vector search, rerank, filters, and declared lexical degradation during vector outage. | Retrieval never crosses tenant and degrades without fabricating grounding. |
| T13.5 | Citations and claim evidence | Record retrieval events, cited source/version/span, claim/source links, unsupported/contradictory evidence, confidence/uncertainty, and coverage metrics. | Evidence-required answer exposes citations and unresolved contradiction status. |
| T13.6 | Governed memory policies | Implement Mission/project/agent/run memory with provenance, sensitive-data filtering, write policy, retention, correction, edit/forget, explicit versioned inputs, and no ambient context injection. | Memory source is inspectable; deletion/correction propagates according to policy. |
| T13.7 | Knowledge security and quality gate | Test poisoned documents, prompt injection, parser/embedding outage, stale index, deletion/export, source update, citation integrity, access isolation, performance, and RAG evaluation baseline. | Security and groundedness gates pass; dependent work shows honest degraded/blocked state. |

**Phase 13 exit:** storage/retrieval/memory are traceable, private, and failure-aware.  
**Rollback boundary:** source/artifact versions remain; index can be rebuilt from durable source lineage.  
**Next phase prohibited if:** deletion, tenant isolation, or citation integrity is unproven.

## Phase 14 — Typed Tools, Secret Broker, Connectors, and Isolated Workers

**Outcome:** narrow safe actions and untrusted workloads use the common governance kernel.  
**Primary requirements:** FR-TOL, FR-RUN, FR-GOV, FR-CST, FR-AST; NFR-SEC, NFR-REL, NFR-PRV, NFR-OBS.  
**Prerequisite:** Phase 13 object/evidence foundation and Phase 6 Effect enforcement.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T14.1 | Typed Tool definition and registry | Implement versioned Tool schema for input/output, side-effect class, timeout, retry, rate, cost, stable errors, idempotency, reconciliation, compensation, capability, and availability. | Invalid/incomplete Tool cannot publish; versions are immutable and tenant-safe. |
| T14.2 | Connections and secret broker | Store credential references, not secret values; inject at worker runtime; implement rotation/revocation, masking, access audit, and no-secret context/artifact/log/support behavior. | Secret leakage and revoked-connection tests pass. |
| T14.3 | Egress and SSRF enforcement | Enforce allowlisted scheme/domain/port, DNS resolution/pinning, private/link-local/metadata denial, redirect policy, request size/time limits, and outbound audit. | SSRF, DNS rebinding, redirect, IPv4/IPv6 private-range, and oversized response tests pass. |
| T14.4 | Governed Tool execution | Route every call through WorkContract, AuthorityGrant, budget reservation, durable Effect, queue, usage, audit, typed error, result ArtifactVersion, and reconciliation. | No controller/worker/connector bypass; duplicate/timeout behavior is Effect-safe. |
| T14.5 | Isolated code worker | Implement no-network default, CPU/memory/time/process/filesystem limits, tenant workspace cleanup, signed artifact transfer, kill, retry, and security telemetry. | Escape/resource-exhaustion/cross-tenant/residual-file tests pass. |
| T14.6 | Browser/parser/render worker foundations | Apply separate runtime profiles, egress policy, secret boundaries, artifact transfer, cancellation, partial-result, cleanup, and recovery for browser/parser/render workloads. | Worker kill or malicious workload does not compromise host/tenant or lose durable lineage. |
| T14.7 | Representative connector certification | Implement/certify narrow HTTP/search/GitHub/MCP-class adapters according to v4 scope. Record scopes, data use, cost/rate, failure, idempotency, reconciliation, and provider terms. | Only certified capabilities are production-enabled; connector count is not a success metric. |
| T14.8 | R2 threat and vertical-slice gate | Run prompt-injection, exfiltration, SSRF, malicious file, secret leak, sandbox escape, tenant, rate, timeout, duplicate-action, uncertain outcome, and reconciliation tests. Execute Builder + Knowledge + Tool vertical slice. | R2 signed green; no Tool/connector bypass of Grant/Effect and no critical/high security defect. |

**R2 exit:** a Builder-created definition uses authorized knowledge and a certified Tool to create traceable artifacts/effects.  
**Rollback boundary:** disable connector/worker capability without mutating historical Effect or ArtifactVersion.  
**Hard stop:** no R3/public beta while injection, egress, isolation, or external-action gates are red.

## Phase 15 — Evaluation Platform and Initial Professional Work Packs

**Outcome:** task-specific quality evidence and Work Packs that compile into the kernel.  
**Primary requirements:** FR-EVL, FR-CMP, FR-AGT, FR-FLW; NFR-AIQ, NFR-CST, NFR-OBS.  
**Prerequisite:** R2 green.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T15.1 | Evaluation contracts and lineage | Implement versioned suite, dataset/case/rubric, evaluator configuration, run, result, baseline, threshold, and lineage contracts already defined by v4. | Exact subject/data/rubric/evaluator versions are recoverable from every result. |
| T15.2 | Evaluation runtime | Add deterministic checks, model judges, and human-evaluation orchestration through bounded queues, budgets, retries, provider isolation where possible, and resumable state. | Evaluator failure/timeout/cost limit does not silently become a pass. |
| T15.3 | Metrics and human review | Measure requirement adherence, artifact acceptance, groundedness/citation quality, unsupported claims, tool correctness, safety, latency, cost, rework, and intervention by Work Pack. Build override/review queue with rationale. | Generic score cannot hide task-specific failure; human override is explicit/audited. |
| T15.4 | Regression/adversarial promotion gates | Add hidden, regression, safety, prompt-injection, tool, retrieval, and drift cases; compare against baselines; block required deployment/promotion failures. | Known regression fails the gate and cannot be waived without authorized recorded decision. |
| T15.5 | Work Pack contract/compiler | Implement intake/WorkContract template, plan/Flow template, roles, tools, knowledge, outputs, evaluations, and UX guidance as versioned bindings that compile to FlowVersion. | Work Pack cannot execute independently and resolves exact dependency versions. |
| T15.6 | Four initial professional packs | Implement only Idea→Product, Coding, Research, and Writing with representative fixtures, success/failure/edge cases, evaluation threshold, cost range, documentation, and accepted-artifact test. | Each pack completes a representative Mission and reaches declared human/evaluation acceptance. |
| T15.7 | Matched comparison and release decision | Compare each representative pack with a simpler provider-native workflow on acceptance, rework, unsupported claims, irreversible-action error, time, and cost. Record D3 evidence. | Breadth continues only where governed workflow shows material defensible value. |

**Phase 15 exit:** initial Work Packs are evaluated kernel configurations, not mini-products.  
**Rollback boundary:** disable a Work Pack version/deployment while preserving results and accepted artifacts.  
**Next phase prohibited if:** required evaluations are gamed, generic, missing, or non-blocking.

## Phase 16 — AI Company, Employee Passports, Assignments, Handoffs, and R3

**Outcome:** smallest evaluated organization improves outcomes over one capable Agent.  
**Primary requirements:** FR-CMP, FR-AGT, FR-EVL, FR-GOV; NFR-AIQ, NFR-CST, NFR-OBS.  
**Prerequisite:** Phase 15 Work Pack baselines.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T16.1 | Organization Architect | Implement in-monolith planner that proposes minimum roles from task/risk/evaluations, explains rationale/cost, compares one-Agent alternative, and requires approval. It emits bindings/projections only. | Proposed organization cannot execute or grant authority by itself. |
| T16.2 | Employee Passport versions | Implement immutable identity/version, evaluated capabilities, responsibilities, model/tool/data limits, escalation, and evidence references. Reject title-only capability claims. | Every usable capability links to evaluation and permitted bounds. |
| T16.3 | Assignment contract and ownership | Implement one accountable owner, typed inputs/outputs, acceptance criteria, reviewer, dependencies, status, handoff, escalation, replacement, and exact version references. | No active Assignment lacks an unambiguous accountable owner. |
| T16.4 | Handoff and RACI semantics | Implement typed handoff package, accept/reject/rework, information-loss tracking, and RACI views that never grant authority. | Handoff cannot silently drop required inputs/evidence; role label cannot authorize action. |
| T16.5 | Bounded organization orchestration | Support sequential handoff, parallel independent work, critique/resolution, reviewer intervention, replacement/escalation, coordination budgets, and safe failure. | Organization remains one FlowVersion runtime; coordination cannot become unbounded. |
| T16.6 | Cockpit, telemetry, and comparison | Add Team/Decision/Evidence views; measure handoff acceptance, rework, information loss, role utilization, coordination cost, time, and outcome versus one Agent. | User can explain who did what, why, under whose authority, at what cost. |
| T16.7 | Segment pilot and R3 kill gate | Run Work-Pack-specific organization evaluations and a fixed-scope pilot against the selected UNVALIDATED segment. Record paid commitment/deposit, acceptable price/overhead, rejection, and outcome evidence where obtained. | R3 only if organization improves outcome enough to justify cost/latency; otherwise ship simpler Agent path. |

**R3 exit:** evaluated, accountable organization has measured benefit and honest beta status.  
**Rollback boundary:** replace/simplify organization bindings; never rewrite historical Assignment/evidence records.  
**Kill rule:** if multi-agent organization is not better than one Agent, stop theatrical expansion.

## Phase 17 — Creator Work OS and R4

**Outcome:** rights-aware provider-backed creator pipelines with deterministic assembly, not a professional NLE.  
**Primary requirements:** FR-AST, FR-EVL, FR-GOV, FR-CST; NFR-PRV, NFR-AIQ, NFR-REL.  
**Prerequisite:** R3 plus paid-demand and rights-policy evidence.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T17.1 | Demand, rights, and policy gate | Confirm target creator workflow/paid demand; approve rights, consent, retention, revocation, publish, and provider-terms policy before implementation breadth. | Missing demand or policy keeps remaining creator breadth blocked. |
| T17.2 | Media capability adapters | Implement image/video/speech/music provider adapters through the common gateway with version, capability, cost, latency, rights, safety, cancellation, failure, and fallback metadata. | Contract fixtures and provider failure/cost tests pass; no proprietary-model claim. |
| T17.3 | Media ArtifactVersion and consent lineage | Record source/derivative lineage, voice/likeness consent, permitted use, subject/scope, expiry/revocation, rights evidence, and provider metadata. | Missing/expired/revoked consent blocks generation/publication and is auditable. |
| T17.4 | Deterministic assembly/render pipeline | Implement pipeline-owned ordering, trim, transitions, captions, music/SFX, render jobs, partial asset reuse, and isolated render-worker recovery. | Same declared timeline/version yields reproducible assembly intent and traceable output. |
| T17.5 | YouTube Work Pack | Implement research → script → storyboard → assets → generation → assembly → review → budget → publish preview as a Work Pack, not a separate runtime. | Representative end-to-end video artifact meets evaluation, rights, cost, and acceptance gates. |
| T17.6 | Reel and localization variants | Implement Reel pack plus caption, translation, and dubbing variants with platform/language/provider limitations and lineage. | Variants preserve consent, source lineage, timing limitations, and truthful quality status. |
| T17.7 | Publish, recovery, analytics, and R4 | Require human publish approval; bind exact payload/Grant/Effect; reconcile uncertain publish before retry; ingest analytics as evidence for proposed immutable improvements. Test partial provider failure/reuse. | R4 green; zero duplicate publish, revoked consent blocks action, and NLE boundary is explicit. |

**R4 exit:** repeatable creator pipeline with rights/effect/recovery evidence.  
**Rollback boundary:** provider/work-pack deployment version can be disabled; accepted assets/effects remain immutable.  
**Permanent exclusion:** general-purpose frame-accurate manually operated professional NLE.

## Phase 18 — Persistent Deployments, Automations, Channels, and Operate

**Outcome:** approved immutable versions run persistently and operators can recover them safely.  
**Primary requirements:** FR-AUT, FR-RUN, FR-TOL, FR-GOV; NFR-REL, NFR-OBS, NFR-CST, NFR-UX.  
**Prerequisite:** R4 kernel/connector/rights controls.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T18.1 | Deployment lifecycle | Implement exact Flow/Agent/Work Pack version binding to environment/configuration plus draft/active/suspended/failed/retired behavior, activate, suspend, rollback, audit, and future-run selection. | Rollback changes future execution only; historical Runs retain exact deployment/version references. |
| T18.2 | Schedules and triggers | Implement timezone/DST, input identity, dedupe key, catch-up/skip, missed-run, next-run, disable, authority/budget preconditions, and idempotent enqueue. | A missed/duplicate trigger creates at most one governed Run under declared policy. |
| T18.3 | Automation state and reconciliation | Implement active/paused/blocked/failed/waiting states, retry/reconcile, connector/Grant expiry/revocation response, budget blocking, and recovery guidance. | Revoked connector/Grant blocks future action without deleting Mission/deployment history. |
| T18.4 | Production connector certification | Promote only connectors with documented scopes, side-effect class, idempotency, reconciliation/compensation, limits/cost, data use, provider terms, observability, and support owner. | Uncertified capability cannot be enabled in production. |
| T18.5 | Channels and Service Account binding | Implement approved inbound/outbound channel identity, bounded Service Account, consent, message correlation, Inbox handoff, escalation, rate limits, and Effect handling. | Channel cannot impersonate user or exceed Service Account/Grant bounds. |
| T18.6 | Operate dashboards | Build queue lag, stuck Runs, deployment/provider health, cost anomaly, approval backlog, failed/uncertain Effects, schedule misses, and dependency state views using durable telemetry. | Operator can move from alert to correlated Run/Effect/recovery path. |
| T18.7 | Operator controls and runbooks | Implement permissioned pause, drain, retry, reconcile, replay, suspend, rollback, revoke, and support-bundle actions with confirmation/audit and safe preconditions. | Control cannot duplicate Effect, bypass approval, mutate history, or expose secrets. |
| T18.8 | Automation outage and recovery gate | Drill provider outage, API/worker restart, DLQ, missed schedule, revoked connector, uncertain Effect, duplicate trigger, backup/restore, and partial dependency. | Operate gate green; every supported stuck/terminal class is explainable and recoverable. |

**Phase 18 exit:** persistent execution is governed, idempotent, visible, and recoverable.  
**Rollback boundary:** suspend/rollback Deployment; do not mutate historical Run/Effect.  
**Next phase prohibited if:** operator recovery requires database editing or hidden manual fixes.

## Phase 19 — Team RBAC, Shared Resources, Billing, Account Security, and Privacy

**Outcome:** paid teams share resources without violating authority, data, cost, or audit boundaries.  
**Primary requirements:** FR-SAA, FR-GOV, FR-CST; NFR-SEC, NFR-PRV, NFR-OBS.  
**Prerequisite:** Phase 18 operational controls.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T19.1 | Membership and RBAC foundation | Implement organization/workspace membership, owner/admin/member/viewer, policy inheritance, permission evaluation, repository filters, and server-side authorization for shared collections/actions. | Complete authorization matrix denies cross-org/workspace and insufficient-role access. |
| T19.2 | Invitations and ownership lifecycle | Implement expiring invitation, accept/revoke, duplicate handling, member removal, ownership transfer, last-owner protection, and historical audit preservation. | Removed member loses future access; organization never becomes ownerless accidentally. |
| T19.3 | Shared-resource authorization | Apply explicit sharing/ownership rules to providers, Tool connections, KnowledgeBases, Agents, Flows, Work Packs, Deployments, Artifacts, budgets, approvals, and audit visibility. | Every shared durable collection/action has tenant/role tests and no implicit sharing. |
| T19.4 | Subscription and entitlement enforcement | Implement subscription/entitlement records, seats, plan limits/features, status transitions, grace/cancel behavior, server-side guards, and replay-safe billing event processing according to v4. | UI cannot bypass plan limits; duplicate/out-of-order billing events converge safely. |
| T19.5 | Cost split, reservations, and abuse controls | Separate BYOK versus A.L.F.R.E.D.-managed provider cost, disclose call multiplicity/user responsibility, enforce reservations/limits/margin/abuse controls, and reconcile invoices/usage. | Team invoice/usage reconciles to immutable price/usage evidence within declared accuracy. |
| T19.6 | Account and machine identity security | Implement MFA, recovery, step-up privileged actions, session/device list/revoke, API keys, and Service Accounts with bounded role, expiry, rotation, revoke, and audit. | Compromised credential can be revoked; privileged actions require declared stronger assurance. |
| T19.7 | Privacy, retention, export, and deletion | Implement visible retention/provider-data-use modes, export, deletion, memory controls, consent/opt-in training, and redacted support access across MongoDB, object storage, vector indexes, caches, and derived references. | Export/deletion/retention drills pass without claiming GDPR readiness. |
| T19.8 | Team integration and privacy gate | Run full role/resource matrix, invitation/removal, billing replay, entitlement bypass, MFA/session/API-key, export/deletion, support-access, and audit tests. | Paid-team gate green; no critical/high tenant/auth/privacy/billing enforcement defect. |

**Phase 19 exit:** team resources, identity, entitlements, cost, and privacy are server-enforced.  
**Rollback boundary:** membership/entitlement changes preserve historical ownership/audit.  
**Not included:** enterprise SSO/SCIM, advanced DLP, residency, on-prem, or multi-region.

## Phase 20 — Scale Evidence, Accessibility, Browser/PWA, DR, Truth Audit, and Team GA

**Outcome:** measured, recoverable, honestly documented R5 candidate with explicit GA decision.  
**Primary requirements:** all applicable FR families and all NFR families.  
**Prerequisite:** Phases 1–19 green.

| ID | Technical sub-phase | Engineering work and deliverable | Required evidence / hard gate |
|---|---|---|---|
| T20.1 | Stateless multi-instance API | Remove in-process correctness assumptions; run two or more API instances with shared durable events/cache/session state and consistent authorization/configuration. | Cross-instance requests, realtime resume, logout/revoke, cache invalidation, and deployment state are consistent. |
| T20.2 | Worker and queue scale | Configure per-queue concurrency, fair tenant limits, backpressure, priority, rate, autoscaling signals, drain/shutdown, lease/reconciler behavior, and poison-job isolation. | Load/worker-kill tests meet declared queue lag and never duplicate confirmed Effect. |
| T20.3 | Data/object/vector scale | Measure indexes/query plans, connection pools, event retention, object transfer, vector retrieval, cleanup/retention, and hot-tenant behavior; optimize only evidenced bottlenecks. | Representative workload has measured limits and no unbounded critical query/path. |
| T20.4 | Performance, load, soak, and chaos | Measure v4 p75/p95 paths, provider latency, first useful artifact, cancellation, cost attribution, queue throughput, memory/leaks, 24h soak, dependency outage, and recovery. Set targets only from evidence. | Published results, bottlenecks, capacity assumptions, and accepted limits; no invented scalability claim. |
| T20.5 | Observability, SLOs, and incident readiness | Finalize metrics/logs/traces/dashboards, service/Run/Effect/cost SLOs, alert thresholds, ownership, escalation, support bundle, incident/runbook, and post-incident evidence flow. | Alert reaches accountable owner and runbook resolves representative incidents. |
| T20.6 | WCAG 2.2 AA verification | Complete automated/manual keyboard, focus, screen-reader, contrast, non-color cue, motion, zoom/reflow, forms, overlays, graph, table, chart, error, and live-region checks. | No release-blocking accessibility defect; waivers are explicit, owned, and time-bounded. |
| T20.7 | Browser, responsive PWA, and localization | Test supported browser matrix, responsive status/approval/input/artifact-review boundary, offline/degraded behavior, timezone/DST, locale formatting, text expansion, and declared language limits. | Published matrix reflects tested support; unsupported behavior is blocked or clearly disclosed. |
| T20.8 | DR, security, and privacy final gate | Execute backup/restore with RPO/RTO evidence, release rollback, provider/Redis/Mongo/object/vector outage, tenant/auth/secret/worker/Grant/Effect/prompt-injection/exfiltration/duplicate-action, and privacy drills. | No critical/high defect; restore/rollback/outage/privacy evidence and owners exist. |
| T20.9 | Final truth audit and GA decision | Reconcile code/tests/evaluations with all 181 IDs, UI labels, docs, pricing/sales claims, mocks, beta/partial/planned status, migrations, §24 metrics, §27 confidence, and §22 gates. Issue GO, LIMITED GA, or NO-GO. | Every shipped claim has evidence; R5/Team GA is an explicit decision, not an automatic phase-completion label. |

**R5 exit:** measured reliability/security/privacy/accessibility/performance plus honest product evidence.  
**Rollback boundary:** GA activation is reversible; historical audit/artifact/effect evidence remains intact.  
**Still deferred:** SSO/SCIM, advanced DLP/retention, data residency, on-prem/multi-region, marketplace monetization, native mobile, live collaboration, SIP carrier infrastructure, proprietary media models, and office-suite replacement.

---

## 6. Technical-sub-phase conservation check

| Development phase | Technical IDs | Count | Release checkpoint |
|---:|---|---:|---|
| 1 | T01.1–T01.7 | 7 | Pre-build |
| 2 | T02.1–T02.7 | 7 | R0 |
| 3 | T03.1–T03.8 | 8 | R0 |
| 4 | T04.1–T04.7 | 7 | R0 |
| 5 | T05.1–T05.8 | 8 | R0 |
| 6 | T06.1–T06.8 | 8 | R0 |
| 7 | T07.1–T07.7 | 7 | R0 |
| 8 | T08.1–T08.7 | 7 | R1 |
| 9 | T09.1–T09.8 | 8 | R1 |
| 10 | T10.1–T10.8 | 8 | R1 |
| 11 | T11.1–T11.7 | 7 | R2 |
| 12 | T12.1–T12.7 | 7 | R2 |
| 13 | T13.1–T13.7 | 7 | R2 |
| 14 | T14.1–T14.8 | 8 | R2 |
| 15 | T15.1–T15.7 | 7 | R3 |
| 16 | T16.1–T16.7 | 7 | R3 |
| 17 | T17.1–T17.7 | 7 | R4 |
| 18 | T18.1–T18.8 | 8 | R5 |
| 19 | T19.1–T19.8 | 8 | R5 |
| 20 | T20.1–T20.9 | 9 | R5 |
| **Total** | **T01.1–T20.9** | **150** | |

Working:

7 + 7 + 8 + 7 + 8 + 8 + 7 + 7 + 8 + 8 + 7 + 7 + 7 + 8 + 7 + 7 + 7 + 8 + 8 + 9 = **150**

Every approved Phase 1–20 build-work item is represented. The approved plan's 81 earlier slices remain conserved through their parent phases; this document decomposes them technically and does not remove them.

### 6.1 Requirement-family coverage

Annex A8 remains the literal 181-ID source. This table is a family-level conservation control; it does not replace the ID-by-ID matrix.

| Requirement family | Primary technical sub-phases |
|---|---|
| FR-MIS | T08.1–T08.7, T09.1–T09.8, T10.1–T10.8 |
| FR-PLN | T09.3–T09.5, T10.7–T10.8 |
| FR-RUN | T06.4–T07.7, T08.5–T08.7, T09.5, T10.2–T11.7, T18.1–T18.8 |
| FR-MOD | T05.3, T05.7, T09.3–T09.4, T12.4–T12.7, T17.2 |
| FR-AGT | T12.4–T12.7, T15.1–T15.7, T16.1–T16.7 |
| FR-FLW | T08.6–T08.7, T11.1–T12.7, T15.5 |
| FR-KNW | T13.1–T13.7, T14.8 |
| FR-TOL | T06.3–T07.7, T11.2–T11.7, T14.1–T14.8, T18.1–T18.8 |
| FR-GOV | T05.1–T10.8, T12.5–T12.7, T13.6–T20.9 |
| FR-EVL | T10.6–T10.8, T12.6–T12.7, T13.7, T15.1–T17.7, T20.9 |
| FR-AST | T06.4–T06.8, T08.2–T08.5, T10.5–T10.7, T13.1–T13.7, T17.1–T17.7 |
| FR-AUT | T18.1–T18.8, T20.1–T20.5 |
| FR-SAA | T19.1–T19.8, T20.1–T20.9 |
| FR-CMP | T15.5–T15.7, T16.1–T16.7 |
| NFR-PERF | T01.2–T04.7, T07.3–T07.6, T11.1–T14.8, T18.1–T20.9 |
| NFR-REL | T02.5–T03.8, T06.4–T07.7, T08.4–T11.7, T13.1–T14.8, T17.2–T20.9 |
| NFR-SEC | T01.5–T07.7, T08.2–T08.7, T13.1–T14.8, T17.1–T20.9 |
| NFR-PRV | T05.2–T05.8, T13.1–T14.8, T17.1–T17.7, T19.1–T20.9 |
| NFR-AIQ | T09.1–T17.7, T20.4, T20.9 |
| NFR-CST | T05.7–T07.7, T09.3–T20.9 |
| NFR-UX | T04.1–T04.7, T07.4–T07.6, T09.1–T09.8, T12.1–T12.7, T16.6, T17.4–T20.9 |
| NFR-OBS | T05.8–T07.7, T09.8–T20.9 |

## 7. Per-sub-phase Definition of Ready

A technical sub-phase may start only when:

- parent phase and predecessor gate are green;
- applicable existing FR/NFR IDs and Annex A8 rows are linked;
- in-scope/out-of-scope behavior and user journey are explicit;
- schema/API/event/error/security/cost implications are understood or marked BLOCKED;
- migration and rollback/forward-fix approach is written;
- test data does not require production secrets or uncontrolled personal data;
- owner/reviewer are assigned when §28 supplies real capacity;
- no conflicting production-code workstream is active.

## 8. Per-sub-phase Definition of Done

A technical sub-phase closes only when:

- code is merged through protected checks;
- safe migration/backfill/verification is complete where applicable;
- typed errors and all relevant UI states are implemented;
- unit/integration/API/browser/isolation/adversarial/recovery/evaluation tests pass according to risk;
- telemetry, correlation, alert/runbook, and operator recovery are present;
- accessibility/performance/privacy/cost checks pass where applicable;
- security review covers tenant, secret, authority, Effect, egress, and prompt/data injection as applicable;
- production/demo/mock/beta/partial labels are correct;
- docs, API contracts, ADRs, migration, rollback, and support evidence are updated;
- exact Annex A8 requirement rows link to evidence;
- independent reviewer signs the gate.

“Backend done,” “UI done,” “tests passed,” or “page created” is not completion evidence.

## 9. Issue and PR template

Each technical-sub-phase milestone should contain issues with:

- technical ID and parent Phase 01–20;
- existing requirement IDs only;
- release R0–R5;
- applicable UJ-01–UJ-09;
- exact predecessor and blocker;
- schema/index/migration impact;
- API/event/error impact;
- UI state/accessibility impact;
- tenant/auth/Grant/Effect/secret/privacy impact;
- cost/budget/usage impact;
- test and evaluation evidence;
- telemetry/runbook/support evidence;
- rollout, feature flag, rollback/forward-fix;
- explicit exclusions and kill condition.

PR rules:

- one reviewable concern per PR;
- do not mix dependency major, schema redesign, and feature behavior;
- do not contract/delete old fields until dual-read/write/backfill verification passes;
- tenant-owned resource requires isolation tests;
- external action requires Grant/Effect/reconciliation threat review;
- incomplete breadth remains default-off and truthfully labelled;
- release tag only after parent phase/release gate.

## 10. What can and cannot run in parallel

**Allowed after contract freeze**

- backend repository/service and frontend presentation using stable mocked contract fixtures;
- QA/security writing independent failure tests while implementation proceeds;
- documentation/runbook/observability instrumentation after event/error contracts are stable;
- different read-only architecture/security reviews.

**Not allowed**

- two agents or teams editing the same production subsystem without an explicit ownership split;
- runtime/framework major upgrade beside kernel schema work;
- schema contract and consumer implementation racing without a frozen version;
- Creator/AI Company/connector breadth during R0 repair;
- production external-action work before Phase 6;
- API finalization before Phase 10;
- Team GA preparation before load/security/privacy/DR evidence.

## 11. Release-level kill gates

1. **R0:** stop if tenant, auth, secret, arbitrary-code, cost-truth, duplicate-action, recovery, or realtime correctness is red.
2. **R1:** stop breadth if governed Mission cannot produce a human-accepted outcome inside approved scope/authority/budget.
3. **R2:** stop beta if Builder/Knowledge/Tool path is vulnerable to injection, exfiltration, SSRF, worker escape, tenant leak, or governance bypass.
4. **R3:** stop AI Company if it does not outperform one capable Agent after cost/time/rework.
5. **R4:** stop Creator breadth without paid demand, rights/consent policy, and safe publish/reconciliation.
6. **R5:** issue NO-GO or LIMITED GA if load/soak/chaos, DR, security, privacy, accessibility, browser, cost, or truth audit is incomplete.

## 12. Brutal critique of this technical plan

1. **150 technical sub-phases are not proof of feasibility.** They improve control and expose dependencies; they do not supply engineers, time, cash, expertise, or product demand.
2. **The scope is still several companies disguised as one roadmap.** Governed runtime, workflow Builder, RAG/tools, evaluation platform, AI Company, Creator system, automation platform, and Team SaaS can each consume a serious team.
3. **R0 may consume most of the real runway.** Auth migration, full tenant isolation, cost truth, Authority Grants, durable Effects, worker recovery, and realtime correctness are platform-engineering work, not quick cleanup.
4. **The modernization phases can become an endless excuse.** Upgrades must preserve behavior and stop when supported/stable. They cannot be used to postpone the Phase 10 customer-value test.
5. **Phase 10 remains the existential checkpoint.** If the kernel cannot reliably deliver a human-accepted Mission better than a simpler provider-native workflow, Phases 11–20 are mostly expensive theatre.
6. **AI Company is guilty until proven useful.** More roles and Agents usually increase latency, token cost, failure surfaces, and coordination loss. Phase 16 must beat one Agent or be cut.
7. **Creator is the highest distraction risk.** Provider adapters and deterministic pipelines are defensible only after paid demand. Building broad media UI without that evidence will burn runway.
8. **Team billing cannot rescue weak product value.** RBAC, entitlements, MFA, privacy, and billing make a product sellable; they do not make the core worth buying.
9. **The plan still lacks the one fact that controls everything: capacity.** Until §28 is completed, no honest completion date, staffing model, or budget exists.
10. **The correct success definition is not “all 150 complete.”** Success is reaching the earliest gated, paid, human-accepted governed outcome and deleting unjustified breadth.

### Final decision

Execute **T01.1 only**, then complete Phase 1 in order. Do not open implementation work for later phases merely because this document makes it look organized.

If Phase 10 succeeds and Phase 15–16 produce buyer and outcome evidence, continue. If not, reduce the product to the smallest governed kernel that users will pay for.

A.L.F.R.E.D. v4 and the approved 20-phase development plan were not modified by this technical decomposition.
