import { create } from "zustand";
import { workspaces as mockWorkspaces } from "@/lib/mock-data";
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
