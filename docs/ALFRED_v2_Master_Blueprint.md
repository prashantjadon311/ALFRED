# A.L.F.R.E.D. v2 — Master Product & Architecture Blueprint
Date: 2026-06-10 | Basis: ALFRED-main.zip (verified code), Product Doc PDF, Gap Analysis docx.
NOTE: "Feature Catalogue PDF" was NOT in uploads — module list taken from upgrade brief = ASSUMPTION where marked.
Hard constraint: every page/tab interactive ≤800ms (warm). Plan enforces this (see §13.4).

# 1. Executive Verdict
- Current state: advanced MVP, ~21k LOC, real sequential orchestrator + DSL + multi-provider router + tenant tests. Foundation is reusable; do NOT rewrite.
- Vision delta: "debate, parallel agents, knowledge, tools, agents-as-product, voice, creative, teams, billing" are MISSING or MOCK. Cost, auth-refresh, distributed events, lock renewal are INCORRECT/RISKY.
- Strategy: Phase 0 fixes trust/security in existing system → productize Governance (flagship, true differentiator) → Agents → Knowledge/Tools → Evals → Voice/Deploy → Creative → SaaS/Billing → distributed runtime → enterprise.
- Keep: Next.js + NestJS/Fastify + Mongo + Redis/BullMQ modular monolith. Add: object storage, vector index, Redis Streams backplane, Stripe, OTel. No microservices until §13 triggers.
- Creative/Voice = provider-routed capability (ElevenLabs as ONE adapter), never core identity. Core identity = governed multi-model execution.

# 2. Verified Current State
Legend: V=VERIFIED IMPLEMENTED, P=PARTIAL, UI=UI ONLY, BE=BACKEND ONLY, M=MOCK ONLY, X=MISSING, R=INCORRECT/RISKY, D=DEPRECATED, A=ASSUMPTION.

| Claim | Status | Evidence (repo path) |
|---|---|---|
| Sequential DSL orchestrator, critic→resolver loop, iteration cap | V | backend/src/orchestrator/workflow-orchestrator.service.ts (while-loop, handleCriticNode/handleResolverNode) |
| Idempotent node exec + resume at checkpoint | V | same; idempotencyKey `runId:nodeKey:iteration`; reuses completed executions |
| DSL zod validation (1.0) | V | orchestrator/workflow-dsl.validator.ts — only 4 edge condition types; requires exactly 1 lock + 1 final_output + ≥1 critic |
| Default workflow = linear chain | V | orchestrator/default-workflow.dsl.ts (e1–e8) |
| True agent debate / rebuttal / consensus scoring | X | no parallelism; agent_messages only typed proposal/critique; no rebuttal rounds |
| Parallel fan-out/fan-in, general loops, sub-workflows | X | single-cursor traversal only |
| Provider routing (mock/openai/anthropic/gemini/ollama/custom) | V | llm/llm-router.service.ts |
| OpenRouter/Groq/Together | X | type union only in llm/interfaces/llm-provider.interface.ts; no impl |
| Real-provider cost | R | llm/providers/anthropic.provider.ts `costUsd: 0` (pattern repeated); budgets/billing show fiction |
| Token estimation | R | len/4 in providers/http-provider.utils.ts + mock.provider.ts |
| Streaming + in-flight cancel | X | `stream?` unimplemented; single fetch; pause/stop only at checkpoint |
| API-key encryption AES-256-GCM | V | security/encryption.service.ts |
| Encryption key fallback default | R | same file — silent fallback `change_this_32_byte_key_value` |
| JWT access+refresh, bcrypt12, refresh-hash rotation | V | modules/auth/auth.service.ts |
| Tokens in localStorage; no auto-refresh on 401 | R | src/lib/api-client.ts (setTokens/getToken; no retry) |
| MFA / email verify / lockout / reset | X | auth module |
| SSE run-events endpoint | BE | modules/workflow-runs controller `GET :id/events?stream=true` |
| Frontend live updates | P | src/services/workflow-events-service.ts — 4s polling (EventSource can't send Bearer/X-Workspace-Id) |
| Cross-instance event delivery | R | modules/realtime/realtime-event-bus.service.ts — in-process RxJS Subject |
| Worker lock renewal | X | queues/workflow.processor.ts — `SET EX 900 NX`, no heartbeat; concurrency hardcoded 2 |
| Retry/DLQ/stuck-run recovery | X | queues/workflow.queue.ts `attempts:1` |
| Core user+workspace isolation | V | repositories/* dual-scope; backend/test/{multi-user,workspace}-isolation.e2e.spec.ts |
| Settings/providers/approvals/audit/orchestrator-internal scoping | R | orchestrator queries issues/runs by userId only; modules user-scoped per gap doc |
| Legacy agent-nodes API beside DSL | D | backend/src/modules/agent-nodes |
| Files/RAG/tools | X | project_memory = bullets+file metadata only (repositories/project-memory.repository.ts) |
| Teams/RBAC/invitations | X | none |
| Billing | UI | /billing page; no backend module |
| Approvals/Audit pages | BE | modules/approvals, modules/audit-logs; no frontend routes |
| Requirement drift | M | orchestrator/requirement-drift.service.ts — regex keywords, constant scores 0.92/0.08 |
| Mock/prod boundary | P | LLM_MOCK_MODE globally overrides router; mock shown as peer mode |
| Tests | V | 14 backend specs + isolation e2e + Playwright mock/api (tests/browser*) |
| Perf work (lazy graphs, request dedupe, GET cache, batched detail) | V | src/lib/api-client.ts caches; lazy imports; caches process-local (R for multi-instance) |

# 3. Feature Catalogue Critique
(A = catalogue PDF absent; groups from brief. Verdicts final.)

| Feature group | Verdict | Reason |
|---|---|---|
| Dashboard | KEEP+MODIFY | Exists (/dashboard). Make role-aware, Redis-cached, real activity semantics. |
| Playground | KEEP+MODIFY | Strong MVP. Add streaming, attachments→Knowledge, server-side folders/search; kill localStorage chat state in API mode. |
| Governance | ADD (flagship) | Today = workflow template only. Productize as first-class area (§6). Core differentiation. |
| Agents (individual) | ADD | Missing entirely. Second pillar (§7). |
| Agent Studio | MODIFY | Editor exists; DSL v2 runtime (parallel/loops/sub-wf/tools) is the real work (§8). |
| Creative | DEFER→Phase 6/7 | Zero code today. Provider-routed; voice-first slice first; timeline editor later. |
| Projects | KEEP | Working spine; add lifecycle (soft-delete cascade), templates. |
| Knowledge | ADD | Mandatory for credible agents (§10). Phase 3. |
| Tools & Skills | ADD | Tools=runtime (§10). Skills=MERGE into Library as versioned bundles, not separate nav. |
| Evaluations | ADD | Phase 4; gates deployments. Differentiator with Governance. |
| Conversations | MERGE | Tab inside Agents (per-agent logs), not sidebar item. |
| Contacts | DEFER | Only when phone/WhatsApp channels ship (P5). REJECT standalone CRM ambition. |
| Deployments | MERGE | Tab inside Agents (envs/versions/canary). Global view later. |
| Assets | MERGE | Tab inside Creative + Knowledge file views. Not sidebar. |
| Models | KEEP+MODIFY | Complete provider CRUD, key rotation, capability metadata, health routing. |
| Usage & Cost | KEEP+MODIFY | Real cost first (P0), then forecasts, export, entitlement view. |
| Approvals | ADD UI | Backend exists; build Inbox (workspace-scoped, assignee, expiry). |
| Audit Logs | ADD UI | Backend exists; searchable/exportable; tab beside Approvals = "Inbox". |
| Templates | MERGE | Workflow templates + council templates + prompts + skills = one Library. |
| Settings | MODIFY | Scope split user/workspace/project with inheritance; backend-enforce toggles; Billing+Members live here. |

Duplicates/confusion to kill: agent-nodes API vs DSL (delete legacy); Templates vs Library vs Prompt Library (one Library); Workflows list vs Studio (Studio owns templates; Runs view stays under Projects/run cockpit); mock-mode as user-visible peer mode (demo badge only).

# 4. Final Product Definition
- **One-liner:** Governed AI operating platform: lock the requirement, let independent multi-model councils and agents do the work, ship only audited, costed, evaluated output.
- **Target users:** AI/platform engineers, technical founders, product+research teams in AI-forward SMBs; later: enterprise AI-governance owners.
- **Not initially:** consumers, non-technical marketers, day-1 SOC2/SSO enterprises, white-label agencies.
- **JTBD:** (1) high-stakes requirement → reviewed defensible plan/artifact; (2) build agents with knowledge+tools under guardrails; (3) operate agent fleets with cost/quality control; (4) produce consented voice/creative output.
- **Differentiators (defensible):** Requirement Lock + semantic drift; independent multi-model councils with evidence ledger + veto + quorum; replayable event-sourced runs; cost-governed runtime with pricing snapshots; eval-gated deployments; human approval as protocol not afterthought.
- **Paid use cases:** governance sessions/seats, agent runtime usage, knowledge storage GB, voice minutes, eval runs, enterprise controls.
- **Must NOT become:** ElevenLabs clone, video editor, generic GPT wrapper, unsupervised autonomous agent platform, consumer app.

## 4.1 FINAL FEATURE LIST (end-state, by pillar)
| # | Pillar | Features |
|---|---|---|
| 1 | Playground | Multi-model chat, streaming+cancel, projects link, attachments→KB, compare (budget-reserved, partial-failure UX, judge merge), server folders/search/export, artifacts drawer |
| 2 | Governance | Sessions, council templates, role/model assignment, requirement lock, task classification, parallel independent proposals, cross-critique, rebuttal, consensus+disagreement map, independent critic (provider-isolation enforced), red-team, issue assignment, resolver loop, re-eval, voting/quorum, critic veto, human approval, final judge, evidence ledger, confidence + adherence + security + cost scores, final artifacts, Codex bundle |
| 3 | Agents | Identity/system prompt/persona, primary model + fallback chain + routing policy, KBs, tools, memory policies, voice, guardrails, cost limits, human handoff, channels, eval suites, versions (immutable), environments dev/stage/prod, deploy/canary/rollback, conversations, analytics, improvement proposals |
| 4 | Agentic Systems (Studio) | DSL v2: sequential, parallel split/join (all/any/quorum), bounded loops, sub-workflows, routers, safe expression conditions, retrieval nodes, tool nodes, approval nodes, evaluator/judge nodes, budget gates, timeout/retry/fallback, output schemas, versioning, import/export, dry-run, debug trace, publish/rollback |
| 5 | Creative | Creative projects, asset library, voice library + consent registry, TTS, script gen, captions, translation/dubbing, storyboards, image gen, multi-speaker, later: timeline editor, music, video, brand kits, review agents, version compare, export — all provider-routed |
| 6 | Knowledge & Tools | KBs: uploads/websites/GitHub/Drive/Notion, transcription, parse→chunk→embed→hybrid retrieve→rerank→citations, permissions, refresh, versioning, retention; 7 memory types; tool registry (HTTP/webhook/MCP/search/GitHub/email/calendar/Slack/DB/internal-workflow/sandbox), schemas, secret broker, allowlists, approval policies, audit |
| 7 | Evaluation & Deployment | Suites, versioned datasets, judge models, regression+adversarial, Model Arena, human eval, history, release gates, Observation→Proposal→Tests→Governance→Approval→Version→Canary flow |
| 8 | SaaS Governance | Orgs, workspaces, memberships, invites, owner/admin/member/viewer, budgets, Stripe subscriptions/entitlements/invoices, approvals inbox, audit UI, export/deletion/retention, SSO/MFA/API keys/service accounts (enterprise phase) |
| 9 | Platform | Real cost+pricing snapshots, cookie auth+auto-refresh, semantic drift, Redis Streams events, SSE/WS gateway, lock leases, DLQ+reconciler, object storage, vector index, OTel observability, ≤800ms page budget |

# 5. Final Left Navigation and Page Map
Sidebar (12 items; everything else = tabs):
Dashboard · Playground · Governance · Agents · Studio · Projects · Knowledge · Evaluations · Creative(flagged) · Models · Usage · Inbox — plus Library and Settings in footer cluster. Workspace switcher + command-K in top bar.

| Route | Purpose | Phase |
|---|---|---|
| /dashboard | Ops overview (cached) | exists→P0 polish |
| /playground | Chat (streaming, KB attach) | exists→P0/P3 |
| /governance, /governance/new, /governance/[id] | Session home/wizard/cockpit (tabs: Debate, Issues, Evidence, Votes, Scores, Artifacts) | P1 |
| /agents, /agents/new, /agents/[id] | Tabs: Build·Test·Knowledge·Tools·Versions·Deployments·Conversations·Analytics·Improve | P2 |
| /studio, /studio/[id] | DSL v2 editor + versions + dry-run | exists→P1/P2 |
| /projects, /projects/[id] | Spine; runs cockpit lives here (/workflows/[id]/run kept) | exists |
| /knowledge, /knowledge/[id] | KB list/detail (docs, chunks, refresh, citations test) | P3 |
| /tools | Registry + executions log (Skills tab) | P3 |
| /evaluations, /evaluations/[suiteId] | Suites, runs, arena | P4 |
| /creative, /creative/[id] | Projects, assets, voices(+consent), jobs; timeline P7 | P6/P7 |
| /models | Providers CRUD, rotation, capabilities, health | exists→P0 |
| /usage | Real cost, forecasts, entitlements | exists→P0 |
| /inbox | Tabs: Approvals · Audit | P1 |
| /library | Tabs: Prompts · Workflow templates · Council templates · Skills | exists→merge P1 |
| /settings | Tabs: Workspace · Members(P8) · Defaults · Security · Budgets · Billing(P8) · Account | exists→P0 scoped |
Removed from nav: Workflows(→Projects/Studio), Compare(→Playground tab), Workspaces page(→switcher+settings), Profile/Account/Billing/Keyboard pages(→Settings tabs/modal), Conversations/Contacts/Deployments/Assets/Templates (→tabs).

# 6. Governance Mode Design
First-class product. A GovernanceSession is a projection + protocol layer over a workflow_run executed by the existing orchestrator with DSL v2 nodes.

## 6.1 Protocol phases (explicit semantics — not just node names)
| Phase | Semantics |
|---|---|
| Requirement Lock | Reuses requirement_contracts; snapshot frozen on session start (exists). Task classification node sets taskType → routes templates. |
| Independent Proposals | PARALLEL fan-out: N proposer members run concurrently, context EXCLUDES sibling outputs (independence flag on node) → real independent thought, not handoff. |
| Cross-Critique | Each member receives others' proposals (not own), emits Critique[] with severity per target. Matrix persisted. |
| Rebuttal | Proposal owners answer critiques: accept (revise) or contest (rationale). Bounded rounds (default 2). |
| Consensus | Merge node: produces ConsensusDecision + disagreement map (topic, positions[], resolved?) + consensusQuality score from judge. |
| Independent Critic | Validator ENFORCES critic.providerType ∉ proposer providers (configurable strictness); critic never sees resolver hints (context filter) → no approval bias. |
| Red-team | Optional adversarial member: security/abuse/prompt-injection probing of plan. |
| Issue→Resolver loop | Reuses critique_issues + revision patches; issues get assigneeMemberId; re-eval by critic; bounded by iterations+budget (exists, extended). |
| Voting & Quorum | Vote node: members vote approve/reject/abstain with weight; quorumPolicy {minVotes, passRatio}; criticVeto=true blocks regardless of votes. |
| Human Approval | waiting_human_approval state (exists) + Inbox; assignee, expiry, escalation. |
| Final Judge | Separate judge member scores: requirementAdherence, security, cost, confidence → EvaluationScore[]; gates final_output. |
| Evidence Ledger | Every claim in final artifact links EvidenceRecord(sourceType: member_output | retrieval | tool | human). |
| Output | Final artifacts + Codex bundle (existing artifact pipeline reused). |

Clear separation: sequential handoff = v1 chain (still available, cheaper); real debate = parallel-independent + cross-critique + rebuttal; consensus = merge+score; critic review = isolated audit; human approval = wait-state protocol.

## 6.2 Data objects (new collections; ids reference run/execution)
| Object | Key fields |
|---|---|
| GovernanceSession | workspaceId, projectId?, requirementContractId, runId, councilTemplateId, status, phase, rounds, scores{consensusQuality, adherence, security, cost, confidence}, quorumPolicy, vetoPolicy, budget |
| CouncilMember | sessionId, role(proposer|critic|red_team|judge|resolver), providerType, modelName, promptTemplateKey, weight, independenceGroup |
| Proposal | sessionId, memberId, round, executionId, content, structured, tokens, costUsd |
| Critique | sessionId, memberId, targetProposalId, round, issues[{title,severity,area,recommendation}], executionId |
| Rebuttal | sessionId, memberId, critiqueId, stance(accept|contest), content, revisionExecutionId? |
| ConsensusDecision | sessionId, round, mergedPlan, decisions[], disagreements[], qualityScore |
| GovernanceIssue | extends critique_issues + sessionId, assigneeMemberId, evidenceIds[] |
| EvidenceRecord | sessionId, claim, sourceType, sourceRef, confidence |
| Vote | sessionId, memberId, subjectType+subjectId, value, weight, rationale |
| EvaluationScore | sessionId, dimension, score, judgeMemberId, executionId |
| FinalDecision | sessionId, verdict, approvedByUserId, artifactIds[], codexArtifactId |

Reuse: orchestrator loop, idempotency, events, budget gate, artifacts, approvals — all existing (workflow-orchestrator.service.ts). New node types + parallel scheduler (§8) are the only engine work; governance UI reads new collections + workflow_events.

# 7. Individual Agents Design
Agent ≠ workflow ≠ council: **Agent** = persistent persona serving open-ended conversations on channels. **Agentic System** = DSL v2 graph for a task. **Workflow Template** = reusable graph definition. **Governance Council** = debate protocol instance. An Agent MAY invoke systems/councils as tools.

AgentDefinition fields: identity{name,purpose,avatar}, systemPrompt, persona{tone,style,language}, model{primary, fallbacks[], routing{maxCostPerMsgUsd, maxLatencyMs, requiredCapabilities[]}}, knowledgeBaseIds[], toolIds[], memoryPolicy per type(on/off, retention), voice{providerType, voiceProfileId, consentRecordId}, guardrails{blockedTopics[], inputFilters, outputFilters, piiRedaction}, limits{dailyCostUsd, perConversationTokens}, handoff{enabled, target(email|webhook|inbox)}, channels[], evalSuiteIds[], status.

Versioning: agent_versions immutable snapshots; agent_deployments {versionId, environment(dev|staging|prod), channelBindings[], trafficPercent (canary), status}; prod deploy REQUIRES eval-suite pass + human approval (§11). Runtime: conversation loop = retrieve memory → retrieve knowledge → guardrail-in → model (routing/fallback) → tool calls (approval policy) → guardrail-out → persist usage/cost → memory write. Pages per §5. Analytics: cost/msg, latency p95, containment, handoff rate, eval score trend. Improvement tab = ImprovementProposal queue (§11) — never silent prompt edits.

# 8. Agent Studio & Agentic Systems (DSL v2 + runtime)
DSL version "2.0" (validator extends workflow-dsl.validator.ts; v1 runs unchanged; migration = wrap).

New node types: parallel_group{joinPolicy: all|any|quorum:n, onBranchError: fail_run|continue|fallback:<node>}, loop_group{loopKey, maxIterations, breakCondition, maxCostUsd}, subworkflow{templateId, inputMap, outputMap, maxDepth 3}, router{expression}, retrieval{kbIds, topK, rerank}, tool{toolId, approvalPolicy}, evaluator{suiteId|judgeModel, threshold}, budget_gate, human_approval (productized), transform{schema}. Edge conditions: safe expression subset (JSONLogic-style over {state, scores, output}) — NO eval/Function.

## Runtime semantics (engine changes in orchestrator + scheduler)
| Concern | Design |
|---|---|
| Fan-out/fan-in | parallel_group children enqueued as branch jobs (BullMQ); run.branchStates{branchKey: pending|running|done|failed}; join job fires when joinPolicy satisfied; deterministic merge order by node key |
| Loop state | run.loopCounters{loopKey: n}; exit on break/max/budget; counters in idempotency key |
| Idempotency | key = runId:nodeKey:branchPath:iteration:loopHash (extends existing) |
| Branch failure | per-policy; join receives partials flagged; completeness ratio exposed to conditions |
| Retries | per-node retryPolicy{max, backoffMs, retryOn[timeout,5xx,parse]}; provider fallback chain attempted BEFORE counting a retry |
| Cancellation | AbortController threaded into provider fetch; stop/pause aborts in-flight; node marked cancelled; status re-checked between awaits (extends shouldExitProcessing) |
| Human wait | status waiting_human_approval; approval resolution → enqueueResume (exists in workflow.queue.ts) |
| Recovery | lock TTL 120s + heartbeat renew 45s (replaces 900s EX in workflow.processor.ts); reconciler repeatable job: running runs with stale heartbeat → requeue idempotently; BullMQ attempts:3 + DLQ queue + alert |
| Streaming | provider chunks → Redis Stream → SSE; final normalized output persisted as today |
| Dry-run/test | mock provider per node override + zero-cost flag; debug trace = event timeline (exists) + per-node context snapshot |
| Publish/rollback | workflow template versions; runs pin dslSnapshot (exists) |

# 9. Creative Platform Design
Identity rule: A.L.F.R.E.D. owns project state, consent, governance; providers own synthesis. ElevenLabs = first media adapter behind CreativeProviderGateway (tts, stt, voiceClone, sfx) — replaceable.

| Build internally | Via providers (pluggable) | Defer |
|---|---|---|
| CreativeProject/Timeline/Track/Clip state, Asset library (object storage), GenerationJob queue, VoiceProfile + consent registry, BrandKit, review/approval flow, version compare, export pipeline | TTS/STT, voice design+clone, image gen, video gen, music, dubbing, translation | Lip-sync, full timeline editor (P7), music/video (P7), live collab editing |

Objects: CreativeProject{workspaceId, type, status, brandKitId}, CreativeTimeline{projectId, duration}, Track{timelineId, kind(audio|voice|music|video|caption)}, Clip{trackId, assetId, in/out, transforms}, Asset{workspaceId, storageKey, mime, hash, rights{license, source, expiry}}, GenerationJob{projectId?, kind, providerType, params, status, costUsd, outputAssetId}, VoiceProfile{workspaceId, providerVoiceRef, consentRecordId REQUIRED for clones}, VoiceConsent{subjectName, proofAssetId, scope, grantedBy, expiresAt, revokedAt}, BrandKit, LocalizationVariant, ReviewComment, CreativeExport.
Rights controls: no clone job without valid consent record; watermark/deepfake policy flags; provider-output license stored on Asset; audit every generation; takedown = revoke consent → block dependent jobs.

# 10. Knowledge, Memory, Tools and Skills
## 10.1 Knowledge pipeline
Sources: upload, website crawl, GitHub repo, Drive/Notion connectors (P3: upload+website+GitHub; connectors P3.5), audio/video transcription (provider STT).
Flow: upload → object storage → ingestion_job → parse (per-mime) → chunk (semantic, overlap) → embed (provider-routed) → vector index → searchable. Retrieval: hybrid (BM25 + vector) → rerank → top-k with citations {docId, chunkId, span}. KB features: permissions (workspace/project/agent grants), refresh schedules, doc versioning, deletion cascade (chunks+vectors), retention policy. Vector store: Mongo Atlas Vector Search if Atlas-hosted ELSE Qdrant container — behind RetrievalPort (ASSUMPTION: hosting choice pending).

## 10.2 Memory types
| Type | Scope | Store | Retention | Notes |
|---|---|---|---|---|
| Conversation | chat/conversation | messages + rolling summary | per workspace policy | summarize > N tokens |
| User | user | user_memory doc | until user edits/forgets | user-visible, editable |
| Workspace | workspace | workspace_memory | policy | admin-curated facts |
| Project | project | project_memory (EXTEND existing repo +workspaceId) | project life | bullets + sourced facts |
| Agent | agent | agent_memory | version-scoped optional | learned prefs, gated writes |
| Execution | run | agent_executions context (exists) | run retention | provenance built-in |
| Scratchpad | node/turn | Redis TTL | minutes | never persisted |
All memory writes: provenance{source, executionId}, sensitive-data exclusion filter (PII/secret regex+classifier), user edit/forget endpoints.

## 10.3 Tool runtime
tools collection: {workspaceId, kind(http|webhook|mcp|search|github|email|calendar|slack|db|internal_workflow|sandbox), inputSchema(zod/JSONSchema), outputSchema, auth{type, secretRef}, allowedDomains[], timeoutMs, retryPolicy, rateLimit, costPerCallUsd?, permissions{roles}, approvalPolicy(auto|first_use|always), enabled}.
Execution: dedicated tool queue/worker; egress proxy enforcing domain allowlist + deny private CIDRs + DNS pinning (SSRF); secret broker injects creds at execution only — secrets NEVER in prompts/context; every call → tool_executions {input, output, latency, cost, approvalId?} + audit_log. MCP: client connecting allowlisted MCP servers; tools surfaced read-only into registry with same policy wrapper. Code sandbox: container w/ no-net default, CPU/mem/time caps — DEFERRED to P5+.
Security set: SSRF (above), prompt injection (trust-labeled context segments; retrieved/tool content wrapped as untrusted; instruction firewall; sensitive tool calls require approval), exfiltration (workspace provider allowlist + redaction rules), malicious files (type sniff, size caps, AV scan hook, parse sandbox), secret leakage (broker + output scanner).

## 10.4 Skills
Skill = versioned bundle {prompt, modelPreference, toolIds[], kbIds[], memoryPolicy, outputSchema, evalTestIds[], version} usable as agent capability or DSL node preset. Lives in Library; promotion requires eval pass.

# 11. Evaluations, Deployment, Continuous Improvement
Objects: eval_suites{targetType(agent|workflow|governance|prompt|model|retrieval|tool|voice|creative), metricConfig}, eval_datasets (versioned), eval_cases{input, expected?, judgeRubric}, eval_runs, eval_results{caseId, scores{}, pass}, improvement_proposals.
Metrics: task success, accuracy, groundedness (citation-supported claim ratio), requirement adherence, safety, tool correctness, cost, latency, user satisfaction, escalation rate, creative quality, voice quality (MOS-style judge). Judge models = configurable, provider-isolated from subject where possible. Includes regression suites, adversarial/prompt-injection sets, Model Arena (same case → N models → judge + human pick), human eval queue, history + diffs.
Release gates: agent/workflow version → prod requires latest suite pass ≥ threshold + human approval; canary trafficPercent → auto-rollback on metric regression.
Improvement flow (enforced, no silent edits): Observation(analytics/conversations) → ImprovementProposal(diff) → automated eval run → Governance review (council on the diff) → human approval → new immutable version → controlled deployment.

# 12. SaaS, Security and Enterprise Design
Tenancy: organizations → workspaces → projects. memberships at org and workspace; roles owner/admin/member/viewer + permission overrides; invitations (email token, expiry); ownership transfer.
Scoping matrix:
| Scope | Data |
|---|---|
| User | identity, personal prefs, personal API keys (optional), user memory |
| Workspace | projects, chats, agents, KBs, tools, runs, usage, budgets, providers (workspace-shared default; personal keys allowed flag), approvals, audit, settings(workspace tier) |
| Organization | billing, subscriptions, entitlements, SSO config, org audit rollup |
| Project | requirement contracts, project memory, project permissions |
| Agent | versions, deployments, conversations, agent memory |
Billing: Stripe subscriptions; entitlements{seats, tokenCap, storageGB, voiceMinutes, evalRuns, features[]} enforced in guards + budget service; invoices cached; overage policy. Migration P0/P8: settings→scoped docs; user-scoped providers/approvals/audit → workspace (script + dual-read window).
Security roadmap: P0 cookie refresh + key enforcement; P1 inbox/audit; P3 tool sandbox policies; P8 MFA, email verify, reset, session mgmt, API keys, service accounts; P10 SSO/SCIM, data residency, DPA/retention automation, pen test, threat model doc (prompt-injection, SSRF, exfiltration, tool abuse cases).

# 13. Target Technical Architecture
Modular monolith retained. Three deployables from one repo: web (Next.js), api (NestJS), worker (same NestJS build, WORKER_MODE flag isolating processors). Extract a service ONLY on measured trigger: tool-sandbox isolation (security boundary), creative job CPU/GPU profile, or realtime fan-out >5k concurrent.

| Subsystem | Responsibility | Main data | Sync | Scaling | Failure behavior | Security boundary |
|---|---|---|---|---|---|---|
| Web (Next.js) | SSR shells, client islands | none | HTTP/SSE | horizontal | stale-while-revalidate | session cookie |
| API (NestJS/Fastify) | REST, authz, validation | Mongo | req/resp | horizontal (stateless after P9) | 5xx + envelope | JWT+cookie, workspace guard |
| Worker | workflow/tool/ingest/creative/eval queues | Mongo writes | BullMQ | per-queue concurrency config | retry→DLQ→reconciler | no inbound; secret broker access |
| MongoDB | durable store | all collections | driver | replica set | backup/restore runbook | network policy |
| Redis | BullMQ, locks+leases, shared cache, Streams pub/sub | ephemeral | streams/pubsub | managed/cluster later | degrade: polling fallback | auth+TLS |
| Object storage (S3/MinIO) | files, assets, exports | binaries | presigned URLs | native | retry | signed, private buckets |
| Vector index (Atlas Vector or Qdrant) | embeddings | chunks | RetrievalPort | native | retrieval-degraded mode (BM25 only) | per-workspace namespace |
| Realtime gateway | SSE (fetch-stream w/ Authorization header — fixes EventSource limit) + WS for voice (P5) | none | Redis Streams replay by eventId | horizontal | client resume from last id | token-auth per stream |
| Provider gateway | LLM/media routing, capabilities, streaming, cancel, fallback, cost | pricing_snapshots, usage | HTTP | in-process lib | circuit breaker, health routing | key decrypt only here |
| Tool runtime | controlled actions | tool_executions | tool queue | worker pool | per-tool retry/timeout | egress proxy, secret broker |
| Creative runtime | generation jobs | generation_jobs, assets | creative queue | worker pool | job retry, partial assets kept | provider keys scoped |
| Eval runtime | suite execution | eval_runs | eval queue | worker pool | resumable | read-mostly |
| Billing | Stripe sync, entitlements | subscriptions | webhooks | n/a | replayable webhook log | signed webhooks |
| Observability | OTel traces, Prometheus metrics, Loki logs, queue+cost dashboards, alerts | telemetry | push/pull | managed | n/a | internal only |

## 13.4 Performance architecture — ≤800ms mandate (every page/tab, warm)
Budgets (CI-enforced):
| Metric | Budget |
|---|---|
| Route interactive (warm, p75) | ≤800ms; cold first-load ≤1.5s (stated assumption: broadband) |
| SSR TTFB | ≤200ms (cached) |
| JS per route | ≤180KB gz; heavy libs (xyflow, recharts, markdown) stay lazy (already lazy — keep) |
| API p95: dashboard ≤250ms · lists ≤300ms · project detail ≤500ms · run detail ≤300ms · chat first-token ≤1s (streaming) | per-endpoint k6 gates |
Tactics: RSC/SSR for list+detail shells; skeleton ≤100ms; Redis read-through cache for dashboard/usage/models aggregates (replaces process-local Maps in src/lib/api-client.ts — keep client SWR layer); covered Mongo indexes for every list query (extend backend/src/database/create-indexes.ts); batched detail endpoints kept (no client waterfalls); single SSE connection replaces 4s polling (perceived latency win); hover prefetch on nav; pagination ≤20; HTTP cache headers + ETag; route-level bundle budget in CI (size-limit) + Lighthouse CI thresholds + k6 smoke on PR. Per-phase acceptance includes these budgets.

# 14. Data Model and API Changes
New collections (≈45): governance_sessions, council_members, proposals, critiques, rebuttals, consensus_decisions, evidence_records, votes, evaluation_scores, final_decisions · agents, agent_versions, agent_deployments, agent_conversations, agent_conversation_messages, contacts(P5) · knowledge_bases, documents, document_chunks, ingestion_jobs · tools, tool_executions, skills · eval_suites, eval_datasets, eval_cases, eval_runs, eval_results, improvement_proposals · creative_projects, creative_timelines, tracks, clips, assets, generation_jobs, voice_profiles, voice_consents, brand_kits, localization_variants, review_comments, creative_exports · organizations, org_memberships, workspace_memberships, invitations, subscriptions, entitlements, api_keys, service_accounts · pricing_snapshots, scoped_settings.

Existing: REUSE users, workspaces, projects, requirement_contracts, chats/messages, workflows, workflow_runs, agent_executions, agent_messages, agent_decisions, critique_issues, revision_patches, workflow_events, artifacts(+versions), approval_requests, audit_logs, usage_events, prompt_templates, model_providers, ai_models. EXTEND workflow_events(+workspaceId, projectId), workflow_runs(+branchStates, loopCounters, leaseHeartbeatAt), usage_events(+pricingSnapshotId), approval_requests(+workspaceId, assignee, expiresAt), audit_logs(+workspaceId), project_memory(+workspaceId), ai_models(+capabilities{vision,tools,json,ctx}). MIGRATE settings→scoped_settings; user-scoped providers/approvals/audit→workspace. DEPRECATE/DELETE backend/src/modules/agent-nodes. 
API groups added: /governance, /agents, /knowledge, /tools, /skills, /evals, /creative, /orgs, /members, /invitations, /billing, /api-keys, /events(stream). Event families: governance.*, agent.deployment.*, knowledge.ingest.*, tool.call.*, eval.*, creative.job.*, billing.*. Background jobs: ingestion, tool, creative, eval queues; run-reconciler; usage-pricing reconciler; retention sweeper; webhook dispatcher; KB refresh scheduler.

# 15. Current Issues to Fix First (mandatory pre-upgrade repair)
| P | Issue | File evidence | Fix |
|---|---|---|---|
| P0 | Real cost = 0 | llm/providers/*.ts costUsd:0 | pricing_snapshots × provider-returned usage tokens; backfill flag on old rows |
| P0 | len/4 token estimate | http-provider.utils.ts | provider tokenizers / usage-based; estimates labeled |
| P0 | Mock/prod boundary | llm-router.service.ts LLM_MOCK_MODE global | mock = dev/demo flag + UI badge; never silently overrides prod |
| P0 | Settings not backend-enforced + scoping drift | modules/settings, orchestrator userId-only queries | scoped_settings + workspace filters in orchestrator/approvals/audit/providers |
| P1 | localStorage tokens, no auto-refresh | src/lib/api-client.ts | refresh→httpOnly SameSite cookie; access in memory; single-flight 401 refresh+retry |
| P1 | Silent weak encryption key | security/encryption.service.ts | hard-fail boot if ENCRYPTION_KEY unset/default in production; rotation runbook |
| P1 | Legacy agent-nodes API | modules/agent-nodes | remove (or 410) |
| P1 | Drift = regex | requirement-drift.service.ts | embedding similarity vs locked goal + cheap judge classifier; threshold + human override (override approval flow exists) |
| P2 | In-process event bus | realtime-event-bus.service.ts | Redis Streams publish; persist-first kept; SSE via fetch-stream w/ auth header; delete 4s polling (workflow-events-service.ts) |
| P2 | 900s lock no renewal | queues/workflow.processor.ts | 120s lease + 45s heartbeat + reconciler |
| P2 | attempts:1, no DLQ | queues/workflow.queue.ts | attempts:3 backoff, DLQ, stuck-run scanner, alerts |
| P2 | No streaming/cancel | providers single fetch | streaming + AbortController (also feature) |
| P2 | Process-local caches | api-client.ts Maps | Redis read-through for shared aggregates |
| P2 | Compare = ungoverned Promise.all | compare flow | budget pre-reserve, concurrency cap, per-model partial results |
Rule: no new product module starts before all P0+P1 merged with tests.

# 16. Phased Upgrade Roadmap (dependency-ordered; no calendar dates — solo/small-team assumption)
**P0 Correctness & Trust — Complexity M-H.** Obj: existing system tells the truth. Feat: §15 P0/P1 + provider CRUD/rotation UI + models capabilities + Inbox(approvals/audit) pages + nav consolidation. Reuse: all. New: pricing module, scoped-settings, inbox routes. Collections: pricing_snapshots, scoped_settings. Sec: cookie auth, key enforcement. Test: cost-accuracy unit, auth-refresh e2e, isolation regression. Perf: budgets live in CI (13.4). Accept: real-provider run shows nonzero accurate cost; session survives token expiry; zero user-scoped leaks in audit/approvals. Risk: migration of scoped data. Excluded: any new pillar.
**P1 Governance Productization — H.** Obj: flagship. Feat: §6 full; DSL v2 core (parallel_group/join, vote, judge nodes); council templates; cockpit UI; evidence ledger. Reuse: orchestrator, events, issues, approvals, artifacts. New BE: governance module, parallel scheduler. FE: /governance/*. Collections: governance set. Deps: P0, P2-lock/heartbeat pulled forward (parallel needs recovery). Test: debate-protocol e2e (independence, veto, quorum), branch recovery. Perf: cockpit ≤800ms via event pagination. Accept: 3-provider council with enforced critic isolation completes, replayable, human gate honored. Risk: token cost of debates → default budgets, compression. Excluded: red-team optional-on, voice.
**P2 Individual Agents — H.** Feat: §7 (text channels: web widget+REST first), versions, dev env, conversations, analytics. New: agents module, conversation runtime. Collections: agents set. Deps: P0; KB/tool hooks stubbed till P3. Accept: build→test→version→deploy(dev)→chat via API; cost/limits enforced. Excluded: voice, canary, prod-gating (needs P4 evals).
**P3 Knowledge, Memory, Tools — H.** Feat: §10 (upload+website+GitHub; HTTP/webhook/search/GitHub tools; MCP client; memory types; citations in Playground/agents/retrieval node). New: knowledge, tools modules; object storage; vector index; egress proxy; secret broker. Deps: P0. Sec: SSRF/injection/exfil controls mandatory. Accept: doc→cited answer; tool call w/ approval+audit; deletion cascades. Excluded: Drive/Notion (P3.5), sandbox.
**P4 Evaluations & Routing — M.** Feat: §11 suites/datasets/judges/arena; intelligent routing live (fallback chains, health/cost-aware); release gates wired to deployments. Accept: prod agent deploy blocked w/o passing suite; arena compares ≥3 models. 
**P5 Voice Agents & Deployments — H.** Feat: voice config, TTS/STT via gateway (ElevenLabs adapter), WS realtime channel, WhatsApp/Slack adapters, contacts, handoff, staging/prod + canary/rollback, consent enforcement. Deps: P2-4. Excluded: SIP/phone (demand-gated), Teams. 
**P6 Creative Foundation — M.** Feat: creative projects, assets, voice library+consents, TTS/voiceover, captions, translation/dubbing, generation jobs, review/approve. Deps: P3 storage, P5 gateway. 
**P7 Advanced Creative — EXTREME.** Timeline editor, multi-speaker, storyboards, image/video/music, brand kits, version compare, export pipeline, quality-review agents. Demand-gated.
**P8 Teams, RBAC, Billing — H.** Orgs, memberships, invites, roles, Stripe, entitlements enforcement, member settings UI, account security (MFA/verify/reset/sessions). Accept: paid multi-user workspace with role-restricted actions + enforced caps. (Membership DATA MODEL lands in P0 migrations to avoid re-migration.)
**P9 Distributed Production Runtime — H.** Multi-instance API/worker, Redis cluster posture, per-queue concurrency config, load/soak/chaos pass, observability dashboards+alerts+on-call, backups/DR drills, CI/CD envs. Accept: kill worker mid-run → run completes; 2×API instances consistent. 
**P10 Enterprise Hardening — H.** SSO/SCIM, service accounts/OAuth apps, retention/export/deletion automation, data residency option, threat model + pen test, SLOs published, compliance docs.

# 17. Test and Release Gates
| Test class | Tooling / target |
|---|---|
| Unit | Jest (exists) — cost calc, drift v2, DSL v2 validator, join/loop logic |
| API integration | supertest e2e (exists pattern) per module |
| Tenant isolation | extend multi-user/workspace e2e to EVERY new collection (gate: cannot merge module without it) |
| Workflow runtime | branch/loop/cancel/recovery sims; kill-worker chaos test |
| Provider contracts | recorded fixtures per adapter; capability matrix checks |
| Browser | Playwright mock+api (exists) + new pillar smokes |
| Load/soak | k6: API p95 budgets (13.4), queue wait ≤2s p95, 24h soak no leak |
| Security | authz matrix tests, SSRF proxy tests, secret-leak scanner, dependency audit |
| Prompt injection | adversarial dataset vs agents w/ tools+KB; block-rate threshold |
| RAG eval | retrieval precision/groundedness suite per KB release |
| Tool sandbox | egress denial, timeout, schema-violation cases |
| Voice/Creative quality | judge-model MOS + human sample queue |
| Recovery | DLQ replay, reconciler, backup-restore drill |
Release gates: **Alpha** = P0 done + isolation green. **Private beta** = P1-P3 + streaming + injection suite baseline. **Paid beta** = P4+P8 billing + accurate cost + monitoring/alerts + restore drill. **Production SaaS** = P9 + load/soak/chaos + SLOs + on-call + no mock-backed user-facing feature. **Enterprise** = P10 + pen test + SSO + retention automation.

# 18. Features Rejected or Deferred
REJECT: standalone Contacts CRM; white-label; mobile native apps; building own foundation/voice models; microservices split now; video editor as identity; autonomous unsupervised agents; marketplace monetization v1; copying ElevenLabs UI. 
DEFER: SIP/phone (P5+, demand-gated); Teams channel; lip-sync; music/video gen (P7); Drive/Notion connectors (P3.5); code-exec sandbox (P5+); workflow/template marketplace; multi-region residency (P10); on-prem (post-enterprise); live collaborative editing.

# 19. Top Product and Technical Risks
| Risk | Mitigation |
|---|---|
| Debate token cost explodes | default budgets, context compression, cheap-model rounds, cost preview before session |
| Parallel runtime bugs corrupt runs | branch-path idempotency, chaos tests, event-sourced replay (exists) |
| Scope = 10 products, small team | phase gates; nothing starts before P0/P1 done; Creative demand-gated |
| RAG quality disappoints | hybrid+rerank, groundedness evals as release gate |
| Tool runtime = breach vector | egress proxy, secret broker, approval policies, audit — ship together or not at all |
| Provider price/API churn | pricing_snapshots, adapter contract tests, capability metadata |
| Voice consent/deepfake liability | consent registry hard-required, audit, revocation cascade |
| Differentiator copied in 6-12mo | speed on Governance+Evals combo; evidence ledger + replay = hardest to clone |
| Migration breaks tenants | dual-read window, isolation regression suite, backups before each migration |
| 800ms budget regressions | CI perf gates (13.4) from P0, not retrofitted |

# 20. Final Build Recommendation
Keep the monolith and the engine. Execute P0 completely before any new pillar — cost truth, auth, scoping, mock boundary. Then ship Governance as the flagship (it reuses 80% of existing orchestrator and is the only uncloned position), Agents second, Knowledge/Tools third, Evals fourth — that stack is the moat (governed + grounded + evaluated). Voice/Creative ride on the provider gateway as adapters, demand-gated. Billing data model lands early (P0 migrations), billing product at P8. Enforce isolation tests + eval gates + 800ms CI budgets on every merge. Defer everything in §18 without guilt.
