# Risk-Based Review Guide

Classify from the verified change surface, not prompt length.

## Mechanical

Examples: deterministic edits, narrow documentation, simple renames, repetitive tests, formatting/config corrections, or a low-risk change with exact acceptance criteria.

Inspect the targeted diff for scope and mistakes. Run the smallest deterministic verification for the edited surface. Do not spawn an agent when handoff context costs more than direct review.

## Standard

Examples: bounded features, ordinary bug fixes, conventional UI/API work, or changes within one known module.

Use the primary agent at medium reasoning. Review correctness against acceptance criteria, regressions, validation and error handling, state transitions, compatibility, test quality, and the final diff. Run targeted tests, then the appropriate module check. Keep implementation and review in the primary session unless independent review is requested.

## Hard

Treat authentication/authorization, workspace isolation, secrets, migrations, concurrency, workflow execution, billing/money, destructive operations, distributed state, ambiguous cross-module design, and public compatibility as hard.

Use one isolated read-only reviewer when available. Give it only:

- task requirements and acceptance criteria;
- relevant verified repository constraints;
- a sanitized diff with enough surrounding context;
- verification commands and results.

Do not provide implementer hidden reasoning, chain-of-thought, or persuasive narration. Ask the reviewer to examine correctness, security, concurrency, data integrity, tenant/workspace isolation, compatibility, error paths, and failure recovery. Reproduce or verify findings before changing code. If isolation is unavailable, perform a fresh findings-first pass and disclose that limitation.

Formatting and style belong in deterministic lint/format tooling, not LLM review. Report findings by severity with file/symbol evidence; omit style-only commentary unless it masks a defect. If there are no findings, state residual risks and unrun checks.
