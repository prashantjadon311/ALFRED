import { api, isApiMode } from "@/lib/api-client";
import { projects as mockProjects } from "@/lib/mocks/projects";
import type { ProjectDetailData, ProjectTimelineEvent, ProjectUsageRow, ProjectUsageSummary } from "@/lib/mocks/project-detail";
import type { Artifact, Chat, CritiqueIssue, Project, ProjectType, RequirementContract, WorkflowRun } from "@/lib/types";
import { demoWait } from "./mock-latency";

const wait = () => demoWait(120);
const DEFAULT_PROJECT_LIST_LIMIT = 20;

export type ProjectListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: Project["status"] | string;
  type?: ProjectType | string;
};

const fallbackRequirementContract: RequirementContract = {
  id: "req-fallback",
  originalRequirement: "",
  lockedGoal: "",
  nonNegotiables: [],
  successCriteria: [],
  outOfScope: [],
  driftStatus: "Stable",
  locked: false
};

const title = (value?: string) => (value ? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");
const projectTypeToApi = (value?: string) => (value ?? "software").toLowerCase();
const loadProjectDetailMocks = () => import("@/lib/mocks/project-detail");

function projectStatusToApi(value?: string) {
  if (!value) return "";
  if (value === "Active") return "running";
  return value.toLowerCase().replace(/\s+/g, "_");
}

function buildProjectListPath(params: ProjectListParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.status && params.status !== "All") query.set("status", projectStatusToApi(params.status));
  if (params.type) query.set("type", projectTypeToApi(params.type));
  const value = query.toString();
  return value ? `/projects?${value}` : "/projects";
}

function filterMockProjects(projects: Project[], params: ProjectListParams = {}) {
  const normalizedSearch = params.search?.trim().toLowerCase() ?? "";
  const status = params.status && params.status !== "All" ? params.status : "";
  const type = params.type ? title(projectTypeToApi(params.type)) : "";
  const filtered = projects.filter((project) => {
    const matchesSearch =
      !normalizedSearch || `${project.name} ${project.description}`.toLowerCase().includes(normalizedSearch);
    const matchesStatus = !status || project.status === status;
    const matchesType = !type || project.type === type;
    return matchesSearch && matchesStatus && matchesType;
  });
  if (!params.page && !params.limit) return filtered;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(100, params.limit ?? DEFAULT_PROJECT_LIST_LIMIT));
  return filtered.slice((page - 1) * limit, page * limit);
}

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
    id: contract?.id ?? fallbackRequirementContract.id,
    originalRequirement: contract?.originalRequirement ?? fallbackRequirementContract.originalRequirement,
    lockedGoal: contract?.lockedGoal ?? fallbackRequirementContract.lockedGoal,
    nonNegotiables: contract?.nonNegotiables ?? [],
    successCriteria: contract?.successCriteria ?? [],
    outOfScope: contract?.outOfScope ?? [],
    driftStatus: contract?.driftStatus === "drift_detected" ? "Drift Detected" : contract?.driftStatus === "watch" ? "Watch" : "Stable",
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

function normalizeWorkflowRun(run: any): WorkflowRun {
  return {
    id: run.id,
    projectId: run.projectId,
    workflowId: run.workflowId,
    name: run.name ?? run.workflowDslSnapshot?.name ?? "Workflow run",
    status: run.status === "running" || run.status === "queued" ? "Running" : run.status === "completed" ? "Completed" : run.status === "paused" ? "Paused" : run.status === "failed" ? "Failed" : run.status === "needs_human_review" ? "Waiting Approval" : "Stopped",
    currentNodeId: run.currentNodeKey ?? run.currentNodeId ?? "requirement-lock",
    iteration: run.iteration ?? 0,
    maxIterations: run.maxIterations ?? run.workflowDslSnapshot?.stopConditions?.maxIterations ?? 3,
    totalTokens: (run.totalInputTokens ?? 0) + (run.totalOutputTokens ?? 0) || run.totalTokens || 0,
    totalCost: run.totalCostUsd ?? run.totalCost ?? 0,
    startedAt: run.startedAt ?? run.createdAt ?? "",
    duration: run.completedAt ? "completed" : run.duration ?? "running",
    claudeVerdict: run.claudeVerdict ?? ""
  };
}

function normalizeChat(chat: any): Chat {
  return {
    id: chat.id,
    title: chat.title,
    projectId: chat.projectId,
    folderId: chat.folderId,
    model: chat.model ?? chat.defaultModel ?? "Workspace",
    messages: [],
    parentId: chat.parentId,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt ?? chat.createdAt
  };
}

function normalizeTimelineEvent(event: any): ProjectTimelineEvent {
  return {
    id: event.id,
    eventType: event.eventType,
    nodeKey: event.nodeKey ?? null,
    message: event.message,
    createdAt: event.createdAt ?? event.timestamp ?? new Date().toISOString()
  };
}

function normalizeUsageRow(row: any): ProjectUsageRow {
  return {
    source: String(row.source ?? row._id ?? "project"),
    inputTokens: Number(row.inputTokens ?? 0),
    outputTokens: Number(row.outputTokens ?? 0),
    costUsd: Number(row.costUsd ?? 0)
  };
}

function normalizeUsageSummary(summary: any): ProjectUsageSummary {
  const bySource = Array.isArray(summary?.bySource) ? summary.bySource.map(normalizeUsageRow) : [];
  return {
    inputTokens: Number(summary?.inputTokens ?? 0),
    outputTokens: Number(summary?.outputTokens ?? 0),
    totalTokens: Number(summary?.totalTokens ?? 0),
    costUsd: Number(summary?.costUsd ?? 0),
    bySource
  };
}

function normalizeProjectDetail(detail: any): ProjectDetailData {
  const workflowRuns = Array.isArray(detail?.workflowRuns) ? detail.workflowRuns.map(normalizeWorkflowRun) : [];
  const usageSummary = normalizeUsageSummary(detail?.usageSummary);
  return {
    project: normalizeProject(detail.project),
    requirementContract: detail.requirementContract ? normalizeRequirement(detail.requirementContract) : null,
    projectMemory: Array.isArray(detail.projectMemory?.bullets) ? detail.projectMemory.bullets : [],
    linkedChats: Array.isArray(detail.linkedChats) ? detail.linkedChats.map(normalizeChat) : [],
    workflowRuns,
    activeWorkflowRun: detail.activeWorkflowRun ? normalizeWorkflowRun(detail.activeWorkflowRun) : null,
    workflows: workflowRuns,
    critiqueIssues: Array.isArray(detail.critiqueIssues) ? detail.critiqueIssues.map(normalizeIssue) : [],
    artifacts: Array.isArray(detail.artifacts) ? detail.artifacts.map(normalizeArtifact) : [],
    timeline: Array.isArray(detail.timeline) ? detail.timeline.map(normalizeTimelineEvent) : [],
    usageSummary,
    usage: usageSummary.bySource
  };
}

type ProjectOverview = {
  project: Project;
  requirementContract: RequirementContract;
  recentRuns: WorkflowRun[];
  artifacts: Artifact[];
  linkedChats: Chat[];
  openIssueCount: number;
};

async function fallbackDetail(projectId: string): Promise<ProjectDetailData> {
  const { getMockProjectDetail } = await loadProjectDetailMocks();
  const detail = getMockProjectDetail(projectId);
  if (!detail) throw new Error("Project not found");
  return detail;
}

export const projectService = {
  listProjects: async (params: ProjectListParams = {}): Promise<Project[]> => {
    if (isApiMode()) {
      const response = await api.get<any>(buildProjectListPath(params));
      const projects = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
      return projects.map(normalizeProject);
    }
    await wait();
    return filterMockProjects(mockProjects, params);
  },

  getProjectById: async (id: string): Promise<Project> => {
    if (isApiMode()) return normalizeProject(await api.get<any>(`/projects/${id}`));
    await wait();
    return mockProjects.find((project) => project.id === id) ?? mockProjects[0];
  },

  getProject: async (id: string): Promise<Project> => projectService.getProjectById(id),

  getProjectOverview: async (id: string): Promise<ProjectOverview> => {
    if (isApiMode()) {
      const overview = await api.get<any>(`/projects/${id}/overview`);
      const fallback = await fallbackDetail(id);
      return {
        project: normalizeProject(overview.project),
        requirementContract: normalizeRequirement(overview.requirementContract),
        recentRuns: Array.isArray(overview.recentRuns) ? overview.recentRuns.map(normalizeWorkflowRun) : fallback.workflows,
        artifacts: Array.isArray(overview.artifacts) ? overview.artifacts.map(normalizeArtifact) : fallback.artifacts,
        linkedChats: Array.isArray(overview.linkedChats) ? overview.linkedChats.map(normalizeChat) : fallback.linkedChats,
        openIssueCount: Number(overview.openIssueCount ?? fallback.critiqueIssues.length)
      };
    }
    await wait();
    const fallback = await fallbackDetail(id);
    return {
      project: fallback.project,
      requirementContract: fallback.requirementContract ?? fallbackRequirementContract,
      recentRuns: fallback.workflows,
      artifacts: fallback.artifacts,
      linkedChats: fallback.linkedChats,
      openIssueCount: fallback.critiqueIssues.length
    };
  },

  getProjectTimeline: async (id: string): Promise<ProjectTimelineEvent[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/projects/${id}/timeline`)).map(normalizeTimelineEvent);
    await wait();
    return (await fallbackDetail(id)).timeline;
  },

  getProjectUsage: async (id: string): Promise<ProjectUsageRow[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/projects/${id}/usage`)).map(normalizeUsageRow);
    await wait();
    return (await fallbackDetail(id)).usage;
  },

  getProjectDetail: async (id: string): Promise<ProjectDetailData> => {
    if (isApiMode()) return normalizeProjectDetail(await api.get<any>(`/projects/${id}/detail`));
    await wait();
    return fallbackDetail(id);
  },

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
    return (await loadProjectDetailMocks()).requirementContract;
  },

  saveRequirementContract: async (
    projectId: string,
    contract: RequirementContract | null,
    project: Pick<Project, "name" | "description" | "type">
  ): Promise<RequirementContract> => {
    if (!isApiMode()) {
      await wait();
      return contract ?? {
        ...fallbackRequirementContract,
        id: `requirement-${Date.now()}`,
        originalRequirement: project.description || project.name,
        lockedGoal: project.description || project.name,
        locked: true
      };
    }
    if (contract) {
      return normalizeRequirement(
        await api.patch<any>(`/requirement-contracts/${contract.id}`, {
          nonNegotiables: contract.nonNegotiables,
          successCriteria: contract.successCriteria,
          outOfScope: contract.outOfScope,
          locked: true
        })
      );
    }
    const summary = project.description.trim() || project.name.trim();
    const requirement = summary.length >= 10 ? summary : `Deliver the ${project.name.trim()} project requirements.`;
    return normalizeRequirement(
      await api.post<any>(`/projects/${projectId}/requirement-contracts`, {
        originalRequirement: requirement,
        lockedGoal: requirement,
        taskType: projectTypeToApi(project.type),
        nonNegotiables: [],
        successCriteria: [],
        outOfScope: [],
        locked: true
      })
    );
  },

  getMemory: async (_projectId?: string): Promise<string[]> => {
    if (isApiMode() && _projectId) {
      const memory = await api.get<any>(`/projects/${_projectId}/memory`);
      return memory?.bullets ?? [];
    }
    await wait();
    return (await loadProjectDetailMocks()).projectMemory;
  },

  saveMemory: async (projectId: string, bullets: string[]): Promise<string[]> => {
    if (!isApiMode()) {
      await wait();
      return bullets;
    }
    const memory = await api.patch<any>(`/projects/${projectId}/memory`, { bullets });
    return Array.isArray(memory?.bullets) ? memory.bullets : [];
  },

  getCritiqueIssues: async (_workflowRunId?: string): Promise<CritiqueIssue[]> => {
    if (isApiMode() && _workflowRunId) return (await api.get<any[]>(`/workflow-runs/${_workflowRunId}/issues`)).map(normalizeIssue);
    await wait();
    return (await loadProjectDetailMocks()).critiqueIssues;
  },

  getArtifacts: async (projectId?: string): Promise<Artifact[]> => {
    if (isApiMode()) return (await api.get<any[]>(`/artifacts${projectId ? `?projectId=${projectId}` : ""}`)).map(normalizeArtifact);
    await wait();
    const { artifacts } = await loadProjectDetailMocks();
    return projectId ? artifacts.filter((artifact) => artifact.projectId === projectId) : artifacts;
  }
};
