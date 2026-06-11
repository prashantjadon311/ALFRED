# A.L.F.R.E.D. Resource Scope Matrix

## Phase 0C Decisions

| Resource | Scope | Reason |
|---|---|---|
| User profile | user | Personal identity and preferences |
| Refresh/session auth | user | One active refresh session per user in current design |
| Settings | user + workspace | User defaults with workspace overrides |
| Approval requests | workspace | Approval decisions belong to active workspace/project/run |
| Audit logs | user/account or workspace | Auth/account events are user scoped; project/workflow/provider actions may be workspace scoped |
| Model providers | user | Provider keys remain personal until team/RBAC phase |
| AI models | user | Current catalogue is provisioned per user |
| Projects/chats/workflows/runs/artifacts/usage | workspace | Already core workspace resources |

## Inheritance Rule

Effective settings = user settings merged with workspace settings.  
Workspace value wins when both define the same key.

## Deferred

Workspace-shared model providers require:
- workspace memberships
- RBAC
- secret sharing policy
- provider key ownership
- audit and rotation policy
