"use client";

import { CircleDollarSign, Download, LockKeyhole, MessageSquareWarning, Pause, Play, Rocket, WandSparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ArtifactPanel } from "@/components/projects/ArtifactPanel";
import { CritiquePanel } from "@/components/projects/CritiquePanel";
import { ExecutionTimeline } from "@/components/projects/ExecutionTimeline";
import { ProjectMemoryPanel } from "@/components/projects/ProjectMemoryPanel";
import { RequirementContractCard } from "@/components/projects/RequirementContractCard";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { artifacts, chats, critiqueIssues, projectMemory, projects, requirementContract, workflows } from "@/lib/mock-data";
import { formatCurrency, formatTokens } from "@/lib/utils";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [notice, setNotice] = useState("");
  const project = projects.find((item) => item.id === params.id);
  if (!project) notFound();
  const projectChats = chats.filter((chat) => chat.projectId === project.id).slice(0, 3);
  const projectWorkflows = workflows.filter((workflow) => workflow.projectId === project.id);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
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
          <Button size="sm" variant="primary" icon={<Rocket className="h-4 w-4" />} onClick={() => showNotice("Mock agent workflow queued for this project.")}>
            Run Agent Workflow
          </Button>
          <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} onClick={() => showNotice("Project workflow paused locally.")}>
            Pause
          </Button>
          <Button size="sm" variant="secondary" icon={<Play className="h-4 w-4" />} onClick={() => showNotice("Project workflow resumed locally.")}>
            Resume
          </Button>
          <Button size="sm" variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => showNotice("Mock project export prepared.")}>
            Export
          </Button>
          <Button size="sm" variant="secondary" icon={<WandSparkles className="h-4 w-4" />} onClick={() => showNotice("Mock Codex prompt bundle generated.")}>
            Generate Codex Prompts
          </Button>
        </div>
      </div>

      {notice ? <p className="mb-4 rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{notice}</p> : null}

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
        <MetricCard label="Token usage" value={formatTokens(project.tokenUsage)} detail="Project lifetime estimate" />
        <MetricCard label="Cost" value={formatCurrency(project.cost)} detail="Mocked spend to date" />
        <MetricCard label="Active agents" value="7" detail="Designer, architect, critic, resolver" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <RequirementContractCard contract={requirementContract} />
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Active Agents</h2>
            <div className="mt-4 space-y-3">
              {["GPT-5 Designer", "Gemini Architect", "Claude Critic", "Budget Manager"].map((agent, index) => (
                <div key={agent} className="flex items-center justify-between rounded-card bg-surface-darkElevated/60 p-3">
                  <span className="text-sm font-medium text-slate-200">{agent}</span>
                  <StatusBadge status={index === 1 ? "Running" : "Success"} />
                </div>
              ))}
            </div>
          </GlassCard>
          <ExecutionTimeline />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Workflow Graph</h2>
        <div className="overflow-x-auto"><WorkflowGraph compact /></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <CritiquePanel issues={critiqueIssues} />
        <ArtifactPanel artifacts={artifacts.filter((artifact) => artifact.projectId === project.id)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Linked Chats</h2>
          <div className="mt-4 space-y-3">
            {projectChats.map((chat) => (
              <div key={chat.id} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <p className="font-semibold text-white">{chat.title}</p>
                <p className="text-xs text-muted">{chat.model} · {chat.updatedAt.slice(0, 10)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <ProjectMemoryPanel memories={projectMemory} />
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Token/Cost Analytics</h2>
          <div className="mt-4 space-y-3">
            {projectWorkflows.map((workflow) => (
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
