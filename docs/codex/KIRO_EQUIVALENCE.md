# Kiro Equivalence Record

This control layer provides workflow analogues, not complete Kiro parity.

| Kiro capability | Codex equivalent |
| --- | --- |
| Steering | `AGENTS.md` |
| Specs | Incoming ChatGPT task plus `docs/codex/CHATGPT_TASK_TEMPLATE.md` |
| Design plan | Conditional `PLANS.md` |
| Reusable workflows | Repository skills under `.agents/skills/` |
| Specialized agents | Project custom agents under `.codex/agents/` |
| Hooks | Supported project command hooks |
| Guardrails | Sandbox, command rules, tests, and risk-based review |
| Task state | Ignored temporary Codex state, if later implemented |
| Autonomous Git workflow | Intentionally disabled |
| Native Kiro UI | Not equivalent |

No hook or task-state directory is configured. Although this Codex build supports `Stop`, its stable input does not reveal which task-specific verification was required or whether it passed. Enforcing that reliably would require maintained state or unstable transcript parsing, so completion gating remains an instruction/review obligation rather than fake hook enforcement.

Project rules forbid direct/common Git publishing, commit/branch mutation, PR/API publishing, and known secret-output prefixes, and gate destructive deletion/reset prefixes. Rules are experimental prefix controls with bypass limits, not complete Git enforcement or proof of application-level security.
