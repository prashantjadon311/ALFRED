---
name: execute-chatgpt-task
description: Execute feature, bug-fix, refactor, test, and coding prompts pasted from ChatGPT. Use when implementation, risk-based validation, diff review, and a concise handoff are required.
---

# Execute a ChatGPT Task

1. Read the incoming prompt.
2. Inspect `git status --short` and the current diff; preserve unrelated work.
3. Extract objective, scope, non-goals, constraints, acceptance criteria, and verification. Verify suggested code.
4. Ask only about a blocker that materially changes behavior or safety.
5. Classify with `docs/codex/REVIEW.md`: mechanical, standard, or hard.
6. Choose the lowest-cost reliable route. Work directly by default; use `mechanical` for substantial repetition, `explorer` for noisy discovery, `hard-worker` for one necessary handoff, and `reviewer` only for hard/explicit review. Keep standard work primary; never overlap edits or switch models repeatedly.
7. Inspect the smallest surface with `rg` and bounded reads. Verify `docs/codex/REPO_MAP.md`; load nothing unrelated.
8. Create a working plan from `PLANS.md` only for hard or genuinely multi-step work.
9. Implement the minimum complete diff without unrelated refactoring.
10. Add or update tests when behavior changes.
11. Run the smallest useful verification first; bound output and save full logs only when needed.
12. Expand verification according to risk and the task.
13. Inspect results and the final diff for correctness and unrelated changes.
14. Run isolated review when policy requires it, then verify findings.
15. Do not commit, push, upload, create a branch, open a PR, or bypass checks.
16. Return only: outcome; files changed; verification commands/results; blockers/risks; manual checks.

Keep related work in this subsystem session; use a fresh one for unrelated work. Save durable guidance only for recurring rules. Never trade quality/security for tokens or minify source. Do not paste complete files.
