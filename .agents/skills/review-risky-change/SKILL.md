---
name: review-risky-change
description: Review hard or high-risk repository changes and explicit review requests, especially authentication, authorization, tenant isolation, migrations, concurrency, workflow execution, billing, destructive operations, distributed state, or public compatibility changes.
---

# Review a Risky Change

1. Read `docs/codex/REVIEW.md` and confirm that hard or explicitly requested independent review applies.
2. Preserve isolation. In the primary session, use the read-only `reviewer` when available and provide only task requirements, acceptance criteria, relevant verified constraints, a sanitized diff with necessary context, and test results. If already an isolated reviewer/subagent, review directly and do not spawn or delegate.
3. Do not provide the implementer's hidden reasoning, chain-of-thought, narration, or conclusions.
4. Examine correctness, regressions, security, concurrency, data integrity, tenant/workspace isolation, API/data compatibility, error paths, observability, and failure recovery.
5. Check whether tests exercise acceptance criteria and failure modes. Formatting/style belongs to deterministic tools.
6. Report actionable findings first, ordered by severity, with file/symbol evidence and a reproduction or verification route. Verify a finding before proposing edits.
7. If no finding remains, state residual risk and unrun checks. If an isolated reviewer is unavailable, perform a fresh read-only pass and disclose that limitation.

Do not edit during a review-only request. Do not expose secrets from the diff or logs.
