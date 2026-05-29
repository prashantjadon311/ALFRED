import {
  artifacts as mockArtifacts,
  critiqueIssues as mockIssues,
  projectMemory as mockMemory,
  projects as mockProjects,
  requirementContract as mockContract
} from "@/lib/mock-data";
import type { Artifact, CritiqueIssue, Project, ProjectType, RequirementContract } from "@/lib/types";

const wait = () => new Promise((resolve) => setTimeout(resolve, 120));

export const projectService = {
  listProjects: async (): Promise<Project[]> => {
    await wait();
    return mockProjects;
  },

  getProjectById: async (id: string): Promise<Project> => {
    await wait();
    return mockProjects.find((project) => project.id === id) ?? mockProjects[0];
  },

  getProject: async (id: string): Promise<Project> => projectService.getProjectById(id),

  createProject: async (body: { name: string; description?: string; type?: string }): Promise<Project> => {
    await wait();
    const now = new Date().toISOString();
    return {
      id: `project-${Date.now()}`,
      name: body.name,
      description: body.description ?? "Mock project prepared for future backend integration.",
      type: (body.type as ProjectType) ?? "Software",
      status: "Planning",
      progress: 0,
      createdAt: now,
      updatedAt: now,
      tokenUsage: 0,
      cost: 0
    };
  },

  getRequirementContract: async (_projectId?: string): Promise<RequirementContract> => {
    await wait();
    return mockContract;
  },

  getMemory: async (_projectId?: string): Promise<string[]> => {
    await wait();
    return mockMemory;
  },

  getCritiqueIssues: async (_workflowRunId?: string): Promise<CritiqueIssue[]> => {
    await wait();
    return mockIssues;
  },

  getArtifacts: async (projectId?: string): Promise<Artifact[]> => {
    await wait();
    return projectId ? mockArtifacts.filter((artifact) => artifact.projectId === projectId) : mockArtifacts;
  }
};
