import type { Project, ProjectTask } from "@/lib/types";

export const projects: Project[] = [
  {
    id: "alfred-platform",
    name: "A.L.F.R.E.D. Platform",
    description: "Agentic AI command center for orchestrating multi-model execution loops.",
    type: "Software",
    status: "Active",
    progress: 68,
    createdAt: "2026-04-12T10:20:00Z",
    updatedAt: "2026-05-21T13:15:00Z",
    tokenUsage: 1_482_900,
    cost: 312.42,
    activeWorkflowId: "wf-active-001"
  },
  {
    id: "vapt-flow-builder",
    name: "VAPT Action Flow Builder",
    description: "Workflow generator for audit findings, remediation routing, and approval checkpoints.",
    type: "Mixed",
    status: "Waiting Approval",
    progress: 46,
    createdAt: "2026-04-18T09:00:00Z",
    updatedAt: "2026-05-20T18:36:00Z",
    tokenUsage: 642_220,
    cost: 122.35,
    activeWorkflowId: "wf-003"
  },
  {
    id: "ai-research-assistant",
    name: "AI Research Assistant",
    description: "Structured literature triage, claim tracking, and synthesis memos.",
    type: "Research",
    status: "Planning",
    progress: 29,
    createdAt: "2026-05-02T07:30:00Z",
    updatedAt: "2026-05-19T12:00:00Z",
    tokenUsage: 391_800,
    cost: 74.08,
    activeWorkflowId: "wf-004"
  },
  {
    id: "legacy-migration-planner",
    name: "Legacy Migration Planner",
    description: "Agentic assessment plan for service decomposition, risk mapping, and code prompt packs.",
    type: "Planning",
    status: "Paused",
    progress: 57,
    createdAt: "2026-03-29T11:40:00Z",
    updatedAt: "2026-05-15T16:42:00Z",
    tokenUsage: 818_000,
    cost: 158.93,
    activeWorkflowId: "wf-005"
  },
  {
    id: "prompt-engineering-library",
    name: "Prompt Engineering Library",
    description: "Role-specific prompt templates for product, architecture, audit, and Codex execution.",
    type: "Software",
    status: "Completed",
    progress: 100,
    createdAt: "2026-02-10T08:25:00Z",
    updatedAt: "2026-05-08T15:11:00Z",
    tokenUsage: 524_430,
    cost: 81.77
  }
];

export const projectTasks: ProjectTask[] = [
  {
    id: "task-001",
    title: "Claude critic re-audit",
    projectId: "alfred-platform",
    type: "workflow",
    status: "Running",
    owner: "Claude Critic",
    createdAt: "2026-05-21T14:18:00Z",
    updatedAt: "2026-05-21T14:49:00Z",
    progress: 68
  },
  {
    id: "task-002",
    title: "Codex prompt bundle export",
    projectId: "alfred-platform",
    type: "codex prompt",
    status: "Waiting Approval",
    owner: "Prompt Generator",
    createdAt: "2026-05-21T12:35:00Z",
    updatedAt: "2026-05-21T13:05:00Z",
    progress: 82
  },
  {
    id: "task-003",
    title: "Finding ownership checkpoint",
    projectId: "vapt-flow-builder",
    type: "approval",
    status: "Waiting Approval",
    owner: "Human Approval",
    createdAt: "2026-05-20T16:05:00Z",
    updatedAt: "2026-05-20T17:02:00Z",
    progress: 46
  },
  {
    id: "task-004",
    title: "Research claim synthesis",
    projectId: "ai-research-assistant",
    type: "artifact",
    status: "Paused",
    owner: "Budget Manager",
    createdAt: "2026-05-18T10:40:00Z",
    updatedAt: "2026-05-18T11:12:00Z",
    progress: 29
  },
  {
    id: "task-005",
    title: "Provider policy chat review",
    projectId: "alfred-platform",
    type: "chat",
    status: "Completed",
    owner: "Gemini Architect",
    createdAt: "2026-05-20T15:22:00Z",
    updatedAt: "2026-05-20T16:04:00Z",
    progress: 100
  },
  {
    id: "task-006",
    title: "Migration blocker triage",
    projectId: "legacy-migration-planner",
    type: "workflow",
    status: "Failed",
    owner: "Issue Resolver",
    createdAt: "2026-05-15T09:25:00Z",
    updatedAt: "2026-05-15T11:41:00Z",
    progress: 57
  }
];
