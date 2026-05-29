import { ArrowRight, GitBranch, Workflow } from "lucide-react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Project } from "@/lib/types";
import { formatCurrency, formatDate, formatTokens } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <GlassCard className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{project.name}</h3>
          <p className="mt-1 text-sm text-muted">{project.type}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{project.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
          <p className="text-muted">Created</p>
          <p className="mt-1 font-semibold text-white">{formatDate(project.createdAt)}</p>
        </div>
        <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
          <p className="text-muted">Updated</p>
          <p className="mt-1 font-semibold text-white">{formatDate(project.updatedAt)}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted">Progress</span>
          <span className="font-semibold text-white">{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-darkElevated">
          <div className="h-2 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${project.progress}%` }} />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-card bg-black/15 p-3">
          <p className="text-muted">Tokens</p>
          <p className="font-semibold text-white">{formatTokens(project.tokenUsage)}</p>
        </div>
        <div className="rounded-card bg-black/15 p-3">
          <p className="text-muted">Cost</p>
          <p className="font-semibold text-white">{formatCurrency(project.cost)}</p>
        </div>
        <div className="rounded-card bg-black/15 p-3">
          <p className="text-muted">Run</p>
          <p className="truncate font-semibold text-white">{project.activeWorkflowId ?? "none"}</p>
        </div>
      </div>
      <div className="mt-5 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <Workflow className="h-3.5 w-3.5" /> Workflow preview
        </p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((item) => (
            <span key={item} className="h-2 flex-1 rounded-full bg-primary/70" />
          ))}
          <GitBranch className="h-4 w-4 text-success" />
        </div>
      </div>
      <AppLink href={`/projects/${project.id}`} className="mt-5">
        <Button className="w-full" variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>
          Open
        </Button>
      </AppLink>
    </GlassCard>
  );
}
