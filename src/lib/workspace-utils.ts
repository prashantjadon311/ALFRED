import type { Workspace } from "@/lib/types";

export interface WorkspaceCreateInput {
  name: string;
  description?: string;
  defaultProvider?: string;
  defaultModel?: string;
  monthlyTokenLimit?: number;
  monthlyCostLimit?: number;
  themePreference?: "dark" | "light" | "system";
}

export type WorkspaceUpdateInput = Partial<Omit<Workspace, "id" | "createdAt" | "stats">> & {
  monthlyTokenLimit?: number;
  monthlyCostLimit?: number;
  warningThreshold?: number;
  defaultProvider?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  requireApprovalBeforeFinalOutput?: boolean;
  enableAuditLogs?: boolean;
  preventAgentsFromSeeingSecrets?: boolean;
};

export function createWorkspaceRecord(input: WorkspaceCreateInput, timestamp = new Date().toISOString()): Workspace {
  return {
    id: `workspace-${Date.now()}`,
    name: input.name.trim() || "Untitled workspace",
    description: input.description?.trim() || "Agentic workspace",
    active: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    defaultProvider: input.defaultProvider ?? "Mock",
    defaultModel: input.defaultModel ?? "Mock GPT-5",
    monthlyTokenLimit: input.monthlyTokenLimit ?? 1_000_000,
    monthlyCostLimit: input.monthlyCostLimit ?? 250,
    themePreference: input.themePreference ?? "dark",
    warningThreshold: 80,
    requireApprovalBeforeFinalOutput: true,
    enableAuditLogs: true,
    preventAgentsFromSeeingSecrets: true,
    stats: {
      projects: 0,
      chats: 0,
      workflowRuns: 0,
      tokenUsage: 0,
      cost: 0,
      activeAgents: 0
    }
  };
}

export function updateWorkspaceRecord(workspace: Workspace, patch: WorkspaceUpdateInput, timestamp = new Date().toISOString()): Workspace {
  return {
    ...workspace,
    ...patch,
    name: patch.name?.trim() || workspace.name,
    description: patch.description?.trim() ?? workspace.description,
    updatedAt: timestamp
  };
}

export function selectActiveWorkspace(workspaces: Workspace[], workspaceId: string): Workspace[] {
  return workspaces.map((workspace) => ({
    ...workspace,
    active: workspace.id === workspaceId
  }));
}

export function getVisibleWorkspaces(workspaces: Workspace[]) {
  return workspaces.filter((workspace) => !workspace.archived);
}
