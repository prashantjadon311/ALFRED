import type { Artifact, Chat, CritiqueIssue, Project, RequirementContract, WorkflowRun } from "@/lib/types";
import { workflows } from "./workflows";

export type ProjectUsageRow = {
  source: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type ProjectUsageSummary = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  bySource: ProjectUsageRow[];
};

export type ProjectTimelineEvent = {
  id: string;
  eventType: string;
  nodeKey?: string | null;
  message?: string;
  createdAt: string;
};

export type ProjectDetailData = {
  project: Project;
  requirementContract: RequirementContract | null;
  linkedChats: Chat[];
  workflowRuns: WorkflowRun[];
  activeWorkflowRun: WorkflowRun | null;
  workflows: WorkflowRun[];
  artifacts: Artifact[];
  critiqueIssues: CritiqueIssue[];
  projectMemory: string[];
  usageSummary: ProjectUsageSummary;
  usage: ProjectUsageRow[];
  timeline: ProjectTimelineEvent[];
};

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

export const requirementContract: RequirementContract = {
  id: "req-alfred-001",
  originalRequirement: "Build a frontend-only prototype for A.L.F.R.E.D., an agentic AI platform that combines AI playgrounds, workflow orchestration, project execution, model configuration, and cost governance.",
  lockedGoal: "Deliver a premium dark-mode Next.js prototype that clearly communicates agentic AI workflow control, model comparison, project execution, and token/cost governance using mocked data only.",
  nonNegotiables: [
    "No real backend, auth, payment, database, API key execution, or LLM calls.",
    "Requirement lock and Claude critic loop must be visually prominent.",
    "Every provider key must be masked and fake."
  ],
  successCriteria: [
    "App builds without TypeScript errors.",
    "Agent Studio shows a full multi-agent workflow graph.",
    "Dashboard, playground, and project detail feel AI-native rather than generic."
  ],
  outOfScope: ["Live streaming", "real model calls", "billing execution"],
  driftStatus: "Stable",
  locked: true
};

export const critiqueIssues: CritiqueIssue[] = [
  {
    id: "issue-001",
    title: "Workflow graph density may collapse on tablet widths",
    severity: "High",
    affectedArea: "Agent Studio canvas",
    recommendation: "Keep the canvas horizontally scrollable and preserve node minimum width.",
    status: "Open"
  },
  {
    id: "issue-002",
    title: "Original motive lock needs stronger hierarchy",
    severity: "Blocker",
    affectedArea: "Project detail requirement contract",
    recommendation: "Use a dedicated lock banner above the contract body.",
    status: "Fixed"
  },
  {
    id: "issue-003",
    title: "Provider configuration must never imply live key validation",
    severity: "High",
    affectedArea: "Models page",
    recommendation: "Label test connection as mocked and keep keys masked.",
    status: "Accepted Risk"
  }
];

export const artifacts: Artifact[] = [
  {
    id: "artifact-001",
    projectId: "alfred-platform",
    title: "Agent Loop Contract",
    type: "Spec",
    createdAt: "2026-05-21T12:35:00Z",
    content: "Requirement lock, model routing, critique loop, approval policy, and export schema."
  },
  {
    id: "artifact-002",
    projectId: "alfred-platform",
    title: "Codex Implementation Prompt",
    type: "Markdown",
    createdAt: "2026-05-21T12:52:00Z",
    content: "Build a modular frontend-only Next.js prototype for A.L.F.R.E.D. with mocked data."
  }
];

export const chats: Chat[] = [
  {
    id: "chat-001",
    title: "Agentic workflow platform shell",
    projectId: "alfred-platform",
    folderId: "folder-alfred",
    model: "GPT-5",
    messages: [],
    createdAt: "2026-05-21T11:02:00Z",
    updatedAt: "2026-05-21T12:52:00Z"
  },
  {
    id: "chat-002",
    title: "Claude critic issue taxonomy",
    projectId: "alfred-platform",
    folderId: "folder-alfred",
    model: "Claude Opus",
    messages: [],
    createdAt: "2026-05-21T09:40:00Z",
    updatedAt: "2026-05-21T10:18:00Z"
  },
  {
    id: "chat-003",
    title: "Provider cost governance",
    projectId: "alfred-platform",
    folderId: "folder-governance",
    model: "Gemini 2.5 Pro",
    messages: [],
    createdAt: "2026-05-20T15:22:00Z",
    updatedAt: "2026-05-20T16:04:00Z"
  }
];

export const projectMemory = [
  "Original motive must stay visible before agent outputs are trusted.",
  "Claude critique issues should be treated as workflow blockers when severity is High or Blocker.",
  "Cost and token meters remain tied to project and workflow context."
];

export const projectUsage: ProjectUsageRow[] = [
  { source: "designer", inputTokens: 64_200, outputTokens: 18_500, costUsd: 8.42 },
  { source: "architect", inputTokens: 58_400, outputTokens: 15_700, costUsd: 6.91 },
  { source: "critic", inputTokens: 42_100, outputTokens: 9_200, costUsd: 12.88 }
];

export const projectTimeline: ProjectTimelineEvent[] = [
  { id: "evt-001", eventType: "requirement.locked", nodeKey: "requirement_lock", message: "Original motive locked", createdAt: "2026-05-21T14:18:02Z" },
  { id: "evt-002", eventType: "agent.completed", nodeKey: "chatgpt_designer", message: "UI architecture proposal emitted", createdAt: "2026-05-21T14:21:40Z" },
  { id: "evt-003", eventType: "agent.started", nodeKey: "gemini_architect", message: "Architecture review started", createdAt: "2026-05-21T14:28:11Z" }
];

export const projectDetailWorkflows = workflows;

export function getMockProjectDetail(projectId: string): ProjectDetailData | null {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;
  const workflowRuns = projectDetailWorkflows.filter((workflow) => workflow.projectId === project.id);
  const usageSummary = {
    inputTokens: projectUsage.reduce((sum, row) => sum + row.inputTokens, 0),
    outputTokens: projectUsage.reduce((sum, row) => sum + row.outputTokens, 0),
    totalTokens: projectUsage.reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0),
    costUsd: projectUsage.reduce((sum, row) => sum + row.costUsd, 0),
    bySource: projectUsage
  };
  return {
    project,
    requirementContract,
    linkedChats: chats.filter((chat) => chat.projectId === project.id),
    workflowRuns,
    activeWorkflowRun: workflowRuns.find((workflow) => workflow.status === "Running" || workflow.status === "Paused") ?? null,
    workflows: workflowRuns,
    artifacts: artifacts.filter((artifact) => artifact.projectId === project.id),
    critiqueIssues,
    projectMemory,
    usageSummary,
    usage: projectUsage,
    timeline: projectTimeline
  };
}
