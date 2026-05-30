import {
  artifacts as mockArtifacts,
  critiqueIssues as mockIssues,
  projectMemory as mockMemory,
  projects as mockProjects,
  requirementContract as mockContract
} from "@/lib/mock-data";
import { api, isApiMode } from "@/lib/api-client";
import type { Artifact, CritiqueIssue, Project, ProjectType, RequirementContract } from "@/lib/types";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);

const title = (value?: string) => (value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");
const projectTypeToApi = (value?: string) => (value ?? "software").toLowerCase();

function normalizeProject(project: any): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    type: title(project.type) as ProjectType,
    status: (project.status === "running" ? "Active" : title(project.status)) as Project["status"],
    progress: project.progress ?? 0,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    tokenUsage: project.tokenUsage?.totalTokens ?? project.tokenUsage ?? 0,
    cost: project.cost?.totalUsd ?? project.cost ?? 0,
    activeWorkflowId: project.activeWorkflowId
  };
}

function normalizeRequirement(contract: any): RequirementContract {
  return {
    id: contract?.id ?? mockContract.id,
    originalRequirement: contract?.originalRequirement ?? mockContract.originalRequirement,
    lockedGoal: contract?.lockedGoal ?? mockContract.lockedGoal,
    nonNegotiables: contract?.nonNegotiables ?? [],
    successCriteria: contract?.successCriteria ?? [],
    outOfScope: contract?.outOfScope ?? [],
    driftStatus: contract?.driftStatus === "drift_detected" ? "Drift Detected" : "Stable",
    locked: Boolean(contract?.locked)
  };
}

function normalizeIssue(issue: any): CritiqueIssue {
  return {
    id: issue.id,
    title: issue.title,
    severity: title(issue.severity) as CritiqueIssue["severity"],
    affectedArea: issue.affectedArea ?? "",
    recommendation: issue.recommendation ?? "",
    status: issue.status === "fixed" ? "Fixed" : issue.status === "accepted_risk" ? "Accepted Risk" : "Open"
  };
}

function normalizeArtifact(artifact: any): Artifact {
  return {
    id: artifact.id,
    projectId: artifact.projectId,
    title: artifact.title,
    type: artifact.type === "json" ? "JSON" : artifact.type === "markdown" ? "Markdown" : "Spec",
    content: artifact.content ?? "",
    createdAt: artifact.createdAt
  };
}

export const projectService = {
  listProjects: async (): Promise<Project[]> => {
    if (isApiMode()) return (await api.get<any[]>("/projects")).map(normalizeProject);
    await wait();
    return mockProjects;
  },

  getProjectById: async (id: string): Promise<Project> => {
    if (isApiMode()) return normalizeProject(await api.get<any>(`/projects/${id}`));
    await wait();
    return mockProjects.find((project) => project.id === id) ?? mockProjects[0];
  },

  getProject: async (id: string): Promise<Project> => projectService.getProjectById(id),

  createProject: async (body: { name: string; description?: string; type?: string }): Promise<Project> => {
    if (isApiMode()) return normalizeProject(await api.post<any>("/projects", { ...body, type: projectTypeToApi(body.type) }));
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
    if (isApiMode() && _projectId) return normalizeRequirement(await api.get<any>(`/projects/${_projectId}/requirement-contracts/current`));
    await wait();
    return mockContract;
  },

  getMemory: async (_projectId?: string): Promise<string[]> => {
    if (isApiMode() && _projectId) {
      const memory = await api.get<any>(`/projects/${_projectId}/memory`);
      return memory?.bullets ?? [];
    }
    await wait();
    return mockMemory;
  },

  getCritiqueIssues: async (_workflowRunId?: string): Promise<CritiqueIssue[]> => {
    if (isApiMode() && _workflowRunId) return (await api.get<any[]>(`/workflow-runs/${_workflowRunId}/issues`)).map(normalizeIssue);
    await wait();
    return mockIssues;
  },

  getArtifacts: async (projectId?: string): Promise<Artifact[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/artifacts${projectId ? `?projectId=${projectId}` : ""}`)).map(normalizeArtifact);
    await wait();
    return projectId ? mockArtifacts.filter((artifact) => artifact.projectId === projectId) : mockArtifacts;
  }
};
