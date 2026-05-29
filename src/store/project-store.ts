import { create } from "zustand";
import { projects as mockProjects, projectMemory as mockProjectMemory } from "@/lib/mock-data";
import { projectService } from "@/services/project-service";
import type { Project } from "@/lib/types";

interface ProjectStore {
  projects: Project[];
  activeProjectId: string;
  projectMemory: string[];
  loaded: boolean;
  setActiveProjectId: (projectId: string) => void;
  updateProjectMemory: (memory: string[]) => void;
  createProject: (body: { name: string; description?: string; type?: string }) => Promise<string>;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  loadFromApi: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: mockProjects,
  activeProjectId: mockProjects[0]?.id ?? "",
  projectMemory: mockProjectMemory,
  loaded: false,

  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
  updateProjectMemory: (memory) => set({ projectMemory: memory }),
  createProject: async (body) => {
    const project = await projectService.createProject(body);
    set((state) => ({ projects: [project, ...state.projects], activeProjectId: project.id }));
    return project.id;
  },
  updateProject: (projectId, patch) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project
      )
    })),

  loadFromApi: async () => {
    if (get().loaded) return;
    try {
      const projects = await projectService.listProjects();
      if (projects.length > 0) {
        set({ projects, activeProjectId: projects[0].id, loaded: true });
      }
    } catch { /* keep mock data */ }
  }
}));
