---
name: plan-complex-change
description: Plan ambiguous, cross-cutting, architectural, migration, security, concurrency, multi-service, or otherwise high-risk repository changes. Use only when repository facts and compatibility or recovery risks must be resolved before implementation.
---

# Plan a Complex Change

1. Read `PLANS.md` and use its headings for the working plan; do not replace the durable template.
2. Inspect the current diff and only relevant code, configuration, tests, and documentation. Use `rg` and bounded reads. Treat documentation as evidence and verify material claims in code.
3. Separate confirmed facts, inferences needing validation, and unresolved blockers. Cite paths or symbols for facts.
4. Define the outcome, affected ownership boundaries, dependencies, and the smallest coherent implementation sequence.
5. Analyze data/API compatibility, existing records, callers, tenant/workspace isolation, security, concurrency, partial failure, rollback, and recovery wherever applicable.
6. Map each risk and acceptance criterion to targeted and broader verification. Identify unavailable checks without pretending they passed.
7. Ask the user only when repository inspection cannot resolve a decision that materially changes behavior or safety.

Do not invent paths, commands, architecture, migrations, or future phases. Do not turn a one-off decision into durable guidance. Proceed to implementation only when the incoming task authorizes it.
