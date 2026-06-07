export type ProjectType = "Software" | "Research" | "Planning" | "Mixed";
export type ProjectStatus = "Active" | "Planning" | "Waiting Approval" | "Paused" | "Completed" | "Failed";
export type AgentStatus = "Pending" | "Running" | "Success" | "Failed" | "Waiting" | "Paused" | "Needs Approval";
export type WorkflowStatus = "Running" | "Paused" | "Stopped" | "Completed" | "Failed" | "Waiting Approval";
export type Severity = "Blocker" | "High" | "Medium" | "Low";
export type IssueStatus = "Open" | "Fixed" | "Accepted Risk";
export type ProviderHealth = "Healthy" | "Degraded" | "Offline";
export type MessageRole = "user" | "assistant" | "system";
export type ProjectTaskType = "workflow" | "chat" | "artifact" | "approval" | "codex prompt";
export type ProjectTaskStatus = "Running" | "Completed" | "Failed" | "Waiting Approval" | "Paused";

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  tokenUsage: number;
  cost: number;
  activeWorkflowId?: string;
}

export interface RequirementContract {
  id: string;
  originalRequirement: string;
  lockedGoal: string;
  nonNegotiables: string[];
  successCriteria: string[];
  outOfScope: string[];
  driftStatus: "Stable" | "Watch" | "Drift Detected";
  locked: boolean;
}

export interface AgentNode {
  id: string;
  title: string;
  provider: string;
  model: string;
  role: string;
  status: AgentStatus;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  systemPrompt: string;
}

export interface WorkflowRun {
  id: string;
  projectId: string;
  workflowId?: string;
  name: string;
  status: WorkflowStatus;
  currentNodeId: string;
  iteration: number;
  maxIterations: number;
  totalTokens: number;
  totalCost: number;
  startedAt: string;
  duration: string;
  claudeVerdict: string;
}

export interface CritiqueIssue {
  id: string;
  title: string;
  severity: Severity;
  affectedArea: string;
  recommendation: string;
  status: IssueStatus;
}

export interface ModelProvider {
  id: string;
  name: string;
  enabled: boolean;
  maskedApiKey: string;
  baseUrl: string;
  defaultModel: string;
  health: ProviderHealth;
  inputCost: number;
  outputCost: number;
  rateLimit: string;
}

export interface ModelConfig {
  id: string;
  provider: string;
  name: string;
  contextWindow: number;
  inputCost: number;
  outputCost: number;
  defaultRole: string;
  enabled: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  model: string;
  tokens: number;
  cost: number;
  latency: number;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string;
  folderId?: string;
  model: string;
  messages: Message[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceStats {
  projects: number;
  chats: number;
  workflowRuns: number;
  tokenUsage: number;
  cost: number;
  activeAgents: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  active: boolean;
  archived?: boolean;
  defaultProvider?: string;
  defaultModel?: string;
  monthlyTokenLimit?: number;
  monthlyCostLimit?: number;
  themePreference?: "dark" | "light" | "system";
  warningThreshold?: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  requireApprovalBeforeFinalOutput?: boolean;
  enableAuditLogs?: boolean;
  preventAgentsFromSeeingSecrets?: boolean;
  createdAt: string;
  updatedAt: string;
  stats: WorkspaceStats;
}

export interface ProjectTask {
  id: string;
  title: string;
  projectId: string;
  type: ProjectTaskType;
  status: ProjectTaskStatus;
  owner: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
}

export interface Artifact {
  id: string;
  projectId: string;
  title: string;
  type: "Markdown" | "JSON" | "Code" | "Diagram" | "Spec";
  content: string;
  createdAt: string;
}

export interface PromptItem {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  favorite: boolean;
  updatedAt: string;
}

export interface UsagePoint {
  date: string;
  input: number;
  output: number;
  cost: number;
}

export interface BudgetRule {
  id: string;
  label: string;
  limit: number;
  used: number;
  scope: "Workspace" | "Project" | "Provider" | "Workflow";
}
