"use client";

import { CircleDollarSign, Download, LockKeyhole, MessageSquareWarning, Pause, Play, Rocket, Square, WandSparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArtifactPanel } from "@/components/projects/ArtifactPanel";
import { CritiquePanel } from "@/components/projects/CritiquePanel";
import { ExecutionTimeline } from "@/components/projects/ExecutionTimeline";
import { ProjectMemoryPanel } from "@/components/projects/ProjectMemoryPanel";
import { RequirementContractCard } from "@/components/projects/RequirementContractCard";
import type { ProjectDetailData } from "@/lib/mocks/project-detail";
import type { Artifact } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { artifactService } from "@/services/artifact-service";
import { projectService } from "@/services/project-service";
import { workflowService } from "@/services/workflow-service";

const WorkflowGraph = dynamic(() => import("@/components/workflow/WorkflowGraph").then((mod) => mod.WorkflowGraph), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-panel border border-surface-darkBorder bg-surface-darkElevated/50" />
});

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const loadDetail = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setDetail(await projectService.getProjectDetail(params.id));
      setApiError("");
    } catch (error) {
      setDetail(null);
      setApiError(error instanceof Error ? error.message : "Unable to load project details.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadDetail(true);
  }, [loadDetail]);

  if (loading) {
    return <div className="h-[360px] animate-pulse rounded-panel border border-surface-darkBorder bg-surface-darkElevated/50" />;
  }

  if (!detail) {
    return <EmptyState title="Project detail unavailable" description={apiError || "The project could not be loaded."} />;
  }

  const project = detail.project;
  const projectChats = detail.linkedChats.slice(0, 3);
  const projectWorkflows = detail.workflowRuns;
  const activeWorkflowRun = detail.activeWorkflowRun;
  const activeRunCount = projectWorkflows.filter((workflow) => workflow.status === "Running" || workflow.status === "Paused").length;
  const workflowRows = activeWorkflowRun ? [activeWorkflowRun, ...projectWorkflows.filter((run) => run.id !== activeWorkflowRun.id)].slice(0, 4) : projectWorkflows.slice(0, 4);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };
  const runAction = async (name: string, operation: () => Promise<unknown>, success: string) => {
    setPendingAction(name);
    try {
      await operation();
      await loadDetail();
      showNotice(success);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPendingAction("");
    }
  };
  const resolveWorkflowId = async () => {
    const runWorkflowId = activeWorkflowRun?.workflowId ?? projectWorkflows.find((run) => run.workflowId)?.workflowId;
    if (runWorkflowId) return runWorkflowId;
    const workflows = await workflowService.listWorkflows({ projectId: project.id, limit: 20 });
    if (!workflows[0]) throw new Error("No configured workflow is available for this project.");
    return workflows[0].id;
  };
  const startWorkflow = (message: string) =>
    runAction("run", async () => workflowService.runWorkflow(await resolveWorkflowId(), project.id), message);
  const exportArtifact = async (artifact?: Artifact) => {
    const selected = artifact ?? detail.artifacts.find((item) => item.type === "Spec") ?? detail.artifacts[0];
    if (!selected) {
      setApiError("No artifact is available to export.");
      return;
    }
    setPendingAction("export");
    try {
      const exported = await artifactService.exportArtifact(selected.id);
      const url = URL.createObjectURL(new Blob([exported.content], { type: exported.mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = exported.filename;
      link.click();
      URL.revokeObjectURL(url);
      showNotice("Artifact export prepared.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setPendingAction("");
    }
  };
  const saveRequirement = async () => {
    setPendingAction("requirement");
    try {
      const requirementContract = await projectService.saveRequirementContract(project.id, detail.requirementContract, project);
      setDetail((current) => current ? { ...current, requirementContract } : current);
      showNotice("Requirement contract saved and locked.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Requirement contract save failed.");
    } finally {
      setPendingAction("");
    }
  };
  const saveMemory = async (memories: string[]) => {
    setPendingAction("memory");
    try {
      const projectMemory = await projectService.saveMemory(project.id, memories);
      setDetail((current) => current ? { ...current, projectMemory } : current);
      showNotice("Project memory saved.");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Project memory save failed.");
    } finally {
      setPendingAction("");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{project.name}</p>
          <p className="truncate text-xs text-muted">{project.type} · {project.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={project.status} />
          <Button size="sm" variant="primary" icon={<Rocket className="h-4 w-4" />} onClick={() => void startWorkflow("Agent workflow queued for this project.")} disabled={Boolean(pendingAction)}>
            Run Agent Workflow
          </Button>
          <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => activeWorkflowRun && void runAction("pause", () => workflowService.pauseWorkflowRun(activeWorkflowRun.id), "Project workflow paused.")} disabled={!activeWorkflowRun || activeWorkflowRun.status !== "Running" || Boolean(pendingAction)}>
            Pause
          </Button>
          <Button size="sm" variant="secondary" icon={<Play className="h-4 w-4" />} onClick={() => activeWorkflowRun && void runAction("resume", () => workflowService.resumeWorkflowRun(activeWorkflowRun.id), "Project workflow resumed.")} disabled={!activeWorkflowRun || activeWorkflowRun.status !== "Paused" || Boolean(pendingAction)}>
            Resume
          </Button>
          <Button size="sm" variant="secondary" icon={<Square className="h-4 w-4" />} onClick={() => activeWorkflowRun && void runAction("stop", () => workflowService.stopWorkflowRun(activeWorkflowRun.id), "Project workflow stopped.")} disabled={!activeWorkflowRun || !["Running", "Paused"].includes(activeWorkflowRun.status) || Boolean(pendingAction)}>
            Stop
          </Button>
          <Button size="sm" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => void exportArtifact()} disabled={!detail.artifacts.length || Boolean(pendingAction)}>
            Export
          </Button>
          <Button size="sm" variant="secondary" icon={<WandSparkles className="h-4 w-4" />} onClick={() => void startWorkflow("Workflow queued to generate Codex prompts.")} disabled={Boolean(pendingAction)}>
            Generate Codex Prompts
          </Button>
        </div>
      </div>

      {notice ? <p className="mb-4 rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{notice}</p> : null}
      {apiError ? <p className="mb-4 rounded-card border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">{apiError}</p> : null}

      <GlassCard className="mb-6 border-primary/25 bg-gradient-to-r from-primary/15 via-success/5 to-warning/10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-primary/15 text-primary-soft">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">Original motive locked</p>
              <p className="mt-1 text-sm text-muted">Requirement drift detection is active for every run.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-warning/15 text-warning">
              <MessageSquareWarning className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">Claude critic loop</p>
              <p className="mt-1 text-sm text-muted">Blockers and accepted risks are tracked below.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-success/15 text-success">
              <CircleDollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-white">Budget governed</p>
              <p className="mt-1 text-sm text-muted">Token and cost analytics stay tied to workflow runs.</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Progress" value={`${project.progress}%`} detail="Requirement-bound delivery" />
        <MetricCard label="Token usage" value={formatTokens(detail.usageSummary.totalTokens || project.tokenUsage)} detail="Project lifetime usage" />
        <MetricCard label="Cost" value={formatCurrency(detail.usageSummary.costUsd || project.cost)} detail="Project spend to date" />
        <MetricCard label="Active agents" value={String(activeRunCount)} detail="Active or paused workflow runs" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
        {detail.requirementContract ? (
          <RequirementContractCard contract={detail.requirementContract} onSave={() => void saveRequirement()} saving={pendingAction === "requirement"} />
        ) : (
          <EmptyState
            title="No requirement contract"
            description="Create and lock a requirement contract before running the project workflow."
            action={<Button variant="secondary" onClick={() => void saveRequirement()} disabled={pendingAction === "requirement"}>Create & lock</Button>}
          />
        )}
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Active Agents</h2>
            <div className="mt-4 space-y-3">
              {!workflowRows.length ? <p className="text-sm text-muted">Run the configured workflow to populate agent status.</p> : null}
              {workflowRows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between rounded-card bg-surface-darkElevated/60 p-3">
                  <span className="text-sm font-medium capitalize text-slate-200">{workflow.currentNodeId.replace(/[_-]/g, " ")}</span>
                  <StatusBadge status={workflow.status} />
                </div>
              ))}
            </div>
          </GlassCard>
          <ExecutionTimeline events={detail.timeline} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Workflow Graph</h2>
        <div className="overflow-x-auto"><WorkflowGraph compact /></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <CritiquePanel issues={detail.critiqueIssues} />
        <ArtifactPanel artifacts={detail.artifacts} onExport={(artifact) => void exportArtifact(artifact)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Linked Chats</h2>
          <div className="mt-4 space-y-3">
            {!projectChats.length ? <p className="text-sm text-muted">Project chats will appear here when created.</p> : null}
            {projectChats.map((chat) => (
              <div key={chat.id} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <p className="font-semibold text-white">{chat.title}</p>
                <p className="text-xs text-muted">{chat.model} · {chat.updatedAt.slice(0, 10)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <ProjectMemoryPanel memories={detail.projectMemory} onSave={saveMemory} saving={pendingAction === "memory"} />
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Token/Cost Analytics</h2>
          <div className="mt-4 space-y-3">
            {!detail.usageSummary.bySource.length && !projectWorkflows.length ? <p className="text-sm text-muted">No project usage has been recorded.</p> : null}
            {detail.usageSummary.bySource.length
              ? detail.usageSummary.bySource.map((row) => (
                  <div key={row.source} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                    <p className="font-semibold text-white">{row.source.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-muted">{formatTokens(row.inputTokens + row.outputTokens)} · {formatCurrency(row.costUsd)}</p>
                  </div>
                ))
              : projectWorkflows.map((workflow) => (
                  <div key={workflow.id} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                    <p className="font-semibold text-white">{workflow.name}</p>
                    <p className="mt-1 text-sm text-muted">{formatTokens(workflow.totalTokens)} · {formatCurrency(workflow.totalCost)}</p>
                  </div>
                ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
