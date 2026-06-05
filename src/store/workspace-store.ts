import { create } from "zustand";
import type { Workspace } from "@/lib/types";
import { isApiMode } from "@/lib/api-client";
import { workspaceService } from "@/services/workspace-service";
import {
  createWorkspaceRecord,
  getVisibleWorkspaces,
  selectActiveWorkspace,
  updateWorkspaceRecord,
  type WorkspaceCreateInput,
  type WorkspaceUpdateInput
} from "@/lib/workspace-utils";

const now = () => new Date().toISOString();
const STORAGE_KEY = "alfred_workspaces_state";

const mockWorkspaces: Workspace[] = [
  {
    id: "workspace-core",
    name: "Prashant / Pro Workspace",
    description: "Primary A.L.F.R.E.D. command workspace for agentic product and implementation loops.",
    active: true,
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-05-21T14:00:00Z",
    stats: {
      projects: 5,
      chats: 10,
      workflowRuns: 5,
      tokenUsage: 3_859_350,
      cost: 749.55,
      activeAgents: 7
    }
  },
  {
    id: "workspace-research",
    name: "A.L.F.R.E.D. Lab",
    description: "Sandbox for literature synthesis, model comparisons, and evidence review.",
    active: false,
    createdAt: "2026-04-20T08:00:00Z",
    updatedAt: "2026-05-19T11:15:00Z",
    stats: {
      projects: 2,
      chats: 14,
      workflowRuns: 3,
      tokenUsage: 812_400,
      cost: 128.32,
      activeAgents: 3
    }
  },
  {
    id: "workspace-audit",
    name: "Personal Research",
    description: "Private research, planning, and Claude critic quality checks.",
    active: false,
    createdAt: "2026-05-03T08:00:00Z",
    updatedAt: "2026-05-20T17:20:00Z",
    stats: {
      projects: 3,
      chats: 9,
      workflowRuns: 4,
      tokenUsage: 1_114_800,
      cost: 218.05,
      activeAgents: 5
    }
  }
];

interface StoredWorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

function readStoredState(): StoredWorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWorkspaceState;
    if (!Array.isArray(parsed.workspaces)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredState(state: StoredWorkspaceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultState(): StoredWorkspaceState {
  const activeWorkspaceId = mockWorkspaces.find((workspace) => workspace.active)?.id ?? mockWorkspaces[0]?.id ?? "";
  return { workspaces: mockWorkspaces, activeWorkspaceId };
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  hydrated: boolean;
  hydrate: () => void;
  getActiveWorkspace: () => Workspace | undefined;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (input: string | WorkspaceCreateInput, description?: string) => Promise<string>;
  updateWorkspace: (workspaceId: string, patch: WorkspaceUpdateInput) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  setActiveWorkspace: (workspaceId: string) => void;
  archiveWorkspace: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  ...defaultState(),
  hydrated: false,

  hydrate: () => {
    const stored = readStoredState();
    if (stored) {
      set({ ...stored, hydrated: true });
    } else {
      const state = defaultState();
      writeStoredState(state);
      set({ ...state, hydrated: true });
    }
    if (!isApiMode()) return;
    void workspaceService.getWorkspaces().then((workspaces) => {
      const activeWorkspaceId = workspaces.find((workspace) => workspace.active)?.id ?? workspaces[0]?.id ?? "";
      writeStoredState({ workspaces, activeWorkspaceId });
      set({ workspaces, activeWorkspaceId, hydrated: true });
    }).catch(() => undefined);
  },

  getActiveWorkspace: () => {
    const state = get();
    return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0];
  },

  switchWorkspace: (workspaceId) => get().setActiveWorkspace(workspaceId),

  createWorkspace: async (input, description = "Agentic workspace") => {
    const timestamp = now();
    const createInput = typeof input === "string" ? { name: input, description } : input;
    const workspace = isApiMode() ? await workspaceService.createWorkspace(createInput) : createWorkspaceRecord(createInput, timestamp);
    set((state) => {
      const workspaces = [workspace, ...state.workspaces];
      writeStoredState({ workspaces, activeWorkspaceId: state.activeWorkspaceId });
      return { workspaces };
    });
    return workspace.id;
  },

  updateWorkspace: (workspaceId, patch) =>
    set((state) => {
      const workspaces = state.workspaces.map((workspace) =>
        workspace.id === workspaceId ? updateWorkspaceRecord(workspace, patch, now()) : workspace
      );
      writeStoredState({ workspaces, activeWorkspaceId: state.activeWorkspaceId });
      if (isApiMode()) void workspaceService.updateWorkspace(workspaceId, patch).catch(() => undefined);
      return { workspaces };
    }),

  renameWorkspace: (workspaceId, name) => get().updateWorkspace(workspaceId, { name }),

  setActiveWorkspace: (workspaceId) =>
    set((state) => {
      const visible = getVisibleWorkspaces(state.workspaces);
      if (!visible.some((workspace) => workspace.id === workspaceId)) return state;
      const workspaces = selectActiveWorkspace(state.workspaces, workspaceId).map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, updatedAt: now() } : workspace
      );
      writeStoredState({ workspaces, activeWorkspaceId: workspaceId });
      if (isApiMode()) void workspaceService.switchWorkspace(workspaceId).catch(() => undefined);
      return { activeWorkspaceId: workspaceId, workspaces };
    }),

  archiveWorkspace: (workspaceId) =>
    set((state) => {
      const archivedWorkspaces = state.workspaces.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, active: false, archived: true, updatedAt: now() } : workspace
      );
      const remaining = getVisibleWorkspaces(archivedWorkspaces);
      const activeWorkspaceId = state.activeWorkspaceId === workspaceId ? remaining[0]?.id ?? "" : state.activeWorkspaceId;
      const workspaces = selectActiveWorkspace(archivedWorkspaces, activeWorkspaceId);
      writeStoredState({ workspaces, activeWorkspaceId });
      if (isApiMode()) void workspaceService.archiveWorkspace(workspaceId).catch(() => undefined);
      return { activeWorkspaceId, workspaces };
    }),

  deleteWorkspace: (workspaceId) =>
    set((state) => {
      const nextWorkspaces = state.workspaces.filter((workspace) => workspace.id !== workspaceId);
      const visible = getVisibleWorkspaces(nextWorkspaces);
      const activeWorkspaceId = state.activeWorkspaceId === workspaceId ? visible[0]?.id ?? "" : state.activeWorkspaceId;
      const workspaces = selectActiveWorkspace(nextWorkspaces, activeWorkspaceId);
      writeStoredState({ workspaces, activeWorkspaceId });
      if (isApiMode()) void workspaceService.deleteWorkspace(workspaceId).catch(() => undefined);
      return { activeWorkspaceId, workspaces };
    })
}));

export function getActiveWorkspaceSnapshot() {
  const state = useWorkspaceStore.getState();
  return state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0];
}
