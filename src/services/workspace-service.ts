import { workspaces as mockWorkspaces } from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import type { Workspace } from "@/lib/types";
import {
  createWorkspaceRecord,
  getVisibleWorkspaces,
  selectActiveWorkspace,
  updateWorkspaceRecord,
  type WorkspaceCreateInput,
  type WorkspaceUpdateInput
} from "@/lib/workspace-utils";

const STORAGE_KEY = "alfred_workspaces_state";
const wait = () => new Promise((resolve) => setTimeout(resolve, 80));

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

function fallbackState(): WorkspaceState {
  return {
    workspaces: mockWorkspaces,
    activeWorkspaceId: mockWorkspaces.find((workspace) => workspace.active)?.id ?? mockWorkspaces[0]?.id ?? ""
  };
}

function readState(): WorkspaceState {
  if (typeof window === "undefined") return fallbackState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackState();
    const parsed = JSON.parse(raw) as WorkspaceState;
    return Array.isArray(parsed.workspaces) ? parsed : fallbackState();
  } catch {
    return fallbackState();
  }
}

function writeState(state: WorkspaceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeWorkspace(item: any): Workspace {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    active: Boolean(item.active),
    archived: Boolean(item.archived),
    defaultProvider: item.defaultProvider,
    defaultModel: item.defaultModel,
    monthlyTokenLimit: item.monthlyTokenLimit,
    monthlyCostLimit: item.monthlyCostLimit,
    themePreference: item.themePreference,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    stats: item.stats ?? { projects: 0, chats: 0, workflowRuns: 0, tokenUsage: 0, cost: 0, activeAgents: 0 }
  };
}

export const workspaceService = {
  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isApiMode()) return (await api.get<any[]>("/workspaces")).map(normalizeWorkspace);
    await wait();
    return readState().workspaces;
  },

  getWorkspaceById: async (id: string): Promise<Workspace | undefined> => {
    if (isApiMode()) return normalizeWorkspace(await api.get<any>(`/workspaces/${id}`));
    await wait();
    return readState().workspaces.find((workspace) => workspace.id === id);
  },

  getActiveWorkspace: async (): Promise<Workspace | undefined> => {
    if (isApiMode()) return (await workspaceService.getWorkspaces()).find((workspace) => workspace.active);
    await wait();
    const state = readState();
    return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0];
  },

  createWorkspace: async (input: WorkspaceCreateInput): Promise<Workspace> => {
    if (isApiMode()) return normalizeWorkspace(await api.post<any>("/workspaces", input));
    await wait();
    const state = readState();
    const workspace = createWorkspaceRecord(input);
    const workspaces = [workspace, ...state.workspaces];
    writeState({ workspaces, activeWorkspaceId: state.activeWorkspaceId });
    return workspace;
  },

  updateWorkspace: async (id: string, patch: WorkspaceUpdateInput): Promise<Workspace | undefined> => {
    if (isApiMode()) return normalizeWorkspace(await api.patch<any>(`/workspaces/${id}`, patch));
    await wait();
    const state = readState();
    let updated: Workspace | undefined;
    const workspaces = state.workspaces.map((workspace) => {
      if (workspace.id !== id) return workspace;
      updated = updateWorkspaceRecord(workspace, patch);
      return updated;
    });
    writeState({ workspaces, activeWorkspaceId: state.activeWorkspaceId });
    return updated;
  },

  switchWorkspace: async (id: string): Promise<Workspace | undefined> => {
    if (isApiMode()) return normalizeWorkspace(await api.post<any>(`/workspaces/${id}/switch`));
    await wait();
    const state = readState();
    const workspaces = selectActiveWorkspace(state.workspaces, id);
    writeState({ workspaces, activeWorkspaceId: id });
    return workspaces.find((workspace) => workspace.id === id);
  },

  archiveWorkspace: async (id: string): Promise<void> => {
    if (isApiMode()) {
      await api.delete(`/workspaces/${id}`);
      return;
    }
    await wait();
    const state = readState();
    const archived = state.workspaces.map((workspace) =>
      workspace.id === id ? { ...workspace, archived: true, active: false, updatedAt: new Date().toISOString() } : workspace
    );
    const visible = getVisibleWorkspaces(archived);
    const activeWorkspaceId = state.activeWorkspaceId === id ? visible[0]?.id ?? "" : state.activeWorkspaceId;
    writeState({ workspaces: selectActiveWorkspace(archived, activeWorkspaceId), activeWorkspaceId });
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    if (isApiMode()) {
      await api.delete(`/workspaces/${id}`);
      return;
    }
    await wait();
    const state = readState();
    const remaining = state.workspaces.filter((workspace) => workspace.id !== id);
    const visible = getVisibleWorkspaces(remaining);
    const activeWorkspaceId = state.activeWorkspaceId === id ? visible[0]?.id ?? "" : state.activeWorkspaceId;
    writeState({ workspaces: selectActiveWorkspace(remaining, activeWorkspaceId), activeWorkspaceId });
  }
};
