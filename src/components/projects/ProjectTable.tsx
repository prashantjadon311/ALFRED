import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Project } from "@/lib/types";
import { formatCurrency, formatDate, formatTokens } from "@/lib/utils";

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {projects.map((project) => (
          <div key={project.id} className="rounded-card border border-surface-darkBorder bg-surface-darkCard/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{project.name}</p>
                <p className="mt-1 text-xs text-muted">{project.type}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
              <span>{project.progress}%</span>
              <span>{formatTokens(project.tokenUsage)}</span>
              <span>{formatCurrency(project.cost)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
              <span>Created {formatDate(project.createdAt)}</span>
              <span>Updated {formatDate(project.updatedAt)}</span>
            </div>
            <AppLink href={`/projects/${project.id}`} className="mt-4 block">
              <Button className="w-full" size="sm" variant="secondary">Open</Button>
            </AppLink>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-panel border border-surface-darkBorder md:block">
        <div className="custom-scrollbar overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="bg-surface-darkElevated/80 text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Tokens</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-darkBorder bg-surface-darkCard/70">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-white/5">
                <td className="px-4 py-4 font-semibold text-white">{project.name}</td>
                <td className="px-4 py-4 text-slate-300">{project.type}</td>
                <td className="px-4 py-4"><StatusBadge status={project.status} /></td>
                <td className="px-4 py-4 text-slate-300">{formatDate(project.createdAt)}</td>
                <td className="px-4 py-4 text-slate-300">{formatDate(project.updatedAt)}</td>
                <td className="px-4 py-4 text-slate-300">{project.progress}%</td>
                <td className="px-4 py-4 text-slate-300">{formatTokens(project.tokenUsage)}</td>
                <td className="px-4 py-4 text-slate-300">{formatCurrency(project.cost)}</td>
                <td className="px-4 py-4">
                  <AppLink href={`/projects/${project.id}`}>
                    <Button size="sm" variant="secondary">Open</Button>
                  </AppLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
