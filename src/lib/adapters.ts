import type { Artifact, Chat, CritiqueIssue, Message, ModelConfig, ModelProvider, Project, PromptItem, WorkflowRun } from "./types";

// ── helpers ────────────────────────────────────────────────────────────────
function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ── Project ────────────────────────────────────────────────────────────────
const PROJECT_STATUS: Record<string, Project["status"]> = {
  draft: "Planning", planning: "Planning", running: "Active", waiting_approval: "Waiting Approval",
  paused: "Paused", completed: "Completed", failed: "Failed", needs_review: "Active"
};
const PROJECT_TYPE: Record<string, Project["type"]> = {
  software: "Software", research: "Research", planning: "Planning", mixed: "Mixed"
};

export function adaptProject(d: any): Project {
  return {
    id: d.id ?? d._id,
    name: d.name,
    description: d.description ?? "",
    type: PROJECT_TYPE[d.type] ?? "Software",
    status: PROJECT_STATUS[d.status] ?? "Planning",
    progress: d.progress ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    tokenUsage: d.tokenUsage?.totalTokens ?? 0,
    cost: d.cost?.totalUsd ?? 0,
    activeWorkflowId: d.activeWorkflowId
  };
}

// ── WorkflowRun ────────────────────────────────────────────────────────────
const RUN_STATUS: Record<string, WorkflowRun["status"]> = {
  queued: "Running", running: "Running", paused: "Paused", stopped: "Stopped",
  completed: "Completed", failed: "Failed", needs_human_review: "Waiting Approval"
};

export function adaptWorkflowRun(d: any): WorkflowRun {
  const started = d.startedAt ? new Date(d.startedAt) : null;
  const ended = d.completedAt ? new Date(d.completedAt) : new Date();
  const ms = started ? ended.getTime() - started.getTime() : 0;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return {
    id: d.id ?? d._id,
    projectId: d.projectId,
    name: d.workflowDslSnapshot?.name ?? "Workflow Run",
    status: RUN_STATUS[d.status] ?? "Running",
    currentNodeId: d.currentNodeKey ?? "",
    iteration: d.iteration ?? 1,
    maxIterations: d.maxIterations ?? 3,
    totalTokens: (d.totalInputTokens ?? 0) + (d.totalOutputTokens ?? 0),
    totalCost: d.totalCostUsd ?? 0,
    startedAt: d.startedAt ?? d.createdAt,
    duration: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
    claudeVerdict: d.claudeVerdict ?? "—"
  };
}

// ── Provider ───────────────────────────────────────────────────────────────
const HEALTH: Record<string, ModelProvider["health"]> = {
  healthy: "Healthy", degraded: "Degraded", offline: "Offline", unknown: "Offline"
};

export function adaptProvider(d: any): ModelProvider {
  return {
    id: d.id ?? d._id,
    name: d.name,
    enabled: d.enabled ?? false,
    maskedApiKey: d.maskedApiKey ?? "••••••••",
    baseUrl: d.baseUrl ?? "",
    defaultModel: d.defaultModel ?? "—",
    health: HEALTH[d.healthStatus] ?? "Offline",
    inputCost: d.config?.inputCostPer1k ?? 0,
    outputCost: d.config?.outputCostPer1k ?? 0,
    rateLimit: d.config?.rateLimit ?? "—"
  };
}

// ── Model ──────────────────────────────────────────────────────────────────
export function adaptModel(d: any): ModelConfig {
  return {
    id: d.id ?? d._id,
    provider: cap(d.providerType ?? ""),
    name: d.displayName ?? d.name,
    contextWindow: d.contextWindow ?? 0,
    inputCost: d.inputCostPer1k ?? 0,
    outputCost: d.outputCostPer1k ?? 0,
    defaultRole: d.defaultRole ?? "—",
    enabled: d.enabled ?? false
  };
}

// ── Chat ───────────────────────────────────────────────────────────────────
export function adaptChat(d: any): Chat {
  return {
    id: d.id ?? d._id,
    title: d.title ?? "Chat",
    projectId: d.projectId ?? "",
    model: d.activeModelName ?? d.modelName ?? "Mock GPT-5",
    messages: [],
    parentId: d.parentChatId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
}

export function adaptMessage(d: any): Message {
  return {
    id: d.id ?? d._id,
    role: d.role as Message["role"],
    content: d.content,
    model: d.modelName ?? "Mock GPT-5",
    tokens: (d.inputTokens ?? 0) + (d.outputTokens ?? 0),
    cost: d.costUsd ?? 0,
    latency: d.latencyMs ? d.latencyMs / 1000 : 0,
    createdAt: d.createdAt
  };
}

// ── Prompt ─────────────────────────────────────────────────────────────────
export function adaptPrompt(d: any): PromptItem {
  return {
    id: d.id ?? d._id,
    title: d.title,
    category: cap(d.category?.replace(/_/g, " ") ?? ""),
    description: d.content?.slice(0, 120) ?? "",
    prompt: d.content,
    favorite: d.favorite ?? false,
    updatedAt: d.updatedAt
  };
}

// ── CritiqueIssue ──────────────────────────────────────────────────────────
const SEV: Record<string, CritiqueIssue["severity"]> = { BLOCKER: "Blocker", HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const ISSUE_STATUS: Record<string, CritiqueIssue["status"]> = { open: "Open", fixed: "Fixed", accepted_risk: "Accepted Risk", false_positive: "Accepted Risk" };

export function adaptIssue(d: any): CritiqueIssue {
  return {
    id: d.id ?? d._id,
    title: d.title,
    severity: SEV[d.severity] ?? "Medium",
    affectedArea: d.affectedArea,
    recommendation: d.recommendation,
    status: ISSUE_STATUS[d.status] ?? "Open"
  };
}

// ── Artifact ───────────────────────────────────────────────────────────────
const ART_TYPE: Record<string, Artifact["type"]> = {
  software_plan: "Spec", research_report: "Markdown", codex_prompt_bundle: "Markdown",
  architecture: "Spec", markdown: "Markdown", json: "JSON", chat_export: "Markdown"
};

export function adaptArtifact(d: any): Artifact {
  return {
    id: d.id ?? d._id,
    projectId: d.projectId ?? "",
    title: d.title,
    type: ART_TYPE[d.type] ?? "Markdown",
    content: d.content,
    createdAt: d.createdAt
  };
}
