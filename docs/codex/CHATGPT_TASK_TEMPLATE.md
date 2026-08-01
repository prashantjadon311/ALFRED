# ChatGPT to Codex Task Contract

Ask ChatGPT to fill this compact template with evidence, not guessed repository facts. An imperfect prompt is still valid input.

```markdown
# Task title

## Objective
One observable outcome.

## Current behavior or evidence
Reproduction, error, test failure, screenshot, request/response, or known file/symbol. Mark assumptions.

## Required behavior
What must change from a user, API, data, or operator perspective.

## Scope
In-scope surfaces and allowed compatibility changes.

## Non-goals
Explicit exclusions and behavior that must remain unchanged.

## Architecture and security constraints
Authentication/authorization, tenant/workspace isolation, data integrity, API compatibility, concurrency, recovery, privacy, or dependency limits.

## Acceptance criteria
- Concrete pass/fail outcomes.
- Edge cases and error behavior.
- Required tests or compatibility guarantees.

## Verification expectations
Known commands, manual flows, environments, and checks that may be unavailable. Codex must verify commands against the repository.

## Risk flags
Mechanical / standard / potentially hard, with reasons such as auth, migration, concurrency, billing, destructive behavior, or public API change.

## Expected final report
Outcome; files changed; commands/results; blockers/risks; manual checks.
```

Codex must inspect the current diff and relevant implementation before editing. The repository controls paths, commands, conventions, and current behavior. Suggested code is a proposal, not a patch to copy blindly. Codex should verify and adapt it, preserve unrelated changes, and ask a question only when missing information materially changes behavior or makes implementation unsafe.
