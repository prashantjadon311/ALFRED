# Complex Work Plan Template

Use this structure only for ambiguous, cross-cutting, architectural, migration, security, concurrency, multi-service, or otherwise high-risk work. Small and mechanical tasks do not need a written plan. Copy the headings into the task's working plan; keep this file as the durable template.

## Outcome

State the observable result and completion boundary.

## Verified current behavior

Record repository evidence with paths/symbols and commands. Separate:

- Confirmed facts
- Inferences that still need validation
- Unresolved blockers

## Affected surfaces

List only code, tests, data, configuration, operations, and documentation that may change. Identify ownership boundaries and unrelated dirty files to preserve.

## Dependencies

Record internal/external dependencies, runtime services, ordering constraints, and availability assumptions. Do not add a dependency unless justified.

## Implementation steps

Use ordered, independently verifiable steps. Name intended outcomes, not speculative file inventories. Identify any one-way operation or implementation handoff.

## Data or API compatibility impact

Cover schemas, migrations, existing records, public contracts, serialization, callers, versioning, and backward/forward compatibility. State "none" only after verification.

## Test strategy

Start with the smallest discriminating check. Map unit, integration, e2e, browser, security/isolation, migration, and manual checks to risks. State unavailable checks and substitutes.

## Rollback or recovery concerns

Describe safe rollback, partial-failure recovery, idempotency, observability, and operator actions. Do not assume a code revert reverses data changes.

## Unresolved blockers

List decisions or missing facts that materially affect safety/behavior. Ask the user only for blockers that repository inspection cannot resolve.
