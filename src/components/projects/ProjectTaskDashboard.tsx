"use client";

import { ArrowRight, Bot, CheckCircle2, Clock3, PauseCircle, ShieldAlert, TimerReset } from "lucide-react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { projectTasks, projects } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

const summary = [
  { label: "Total tasks", value: projectTasks.length, icon: Bot },
  { label: "Running", value: projectTasks.filter((task) => task.status === "Running").length, icon: TimerReset },
  { label: "Completed", value: projectTasks.filter((task) => task.status === "Completed").length, icon: CheckCircle2 },
  { label: "Failed", value: projectTasks.filter((task) => task.status === "Failed").length, icon: ShieldAlert },
  { label: "Waiting approval", value: projectTasks.filter((task) => task.status === "Waiting Approval").length, icon: Clock3 },
  { label: "Paused", value: projectTasks.filter((task) => task.status === "Paused").length, icon: PauseCircle }
];

export function ProjectTaskDashboard() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Project Task Dashboard</h2>
        <Button size="sm" variant="ghost">View queue</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.label} className="p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-button bg-primary/12 text-primary-soft">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-panel border border-surface-darkBorder">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-surface-darkElevated/80 text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-3">Task</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Updated</th>
                <th className="px-3 py-3">Progress</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-darkBorder bg-surface-darkCard/70">
              {projectTasks.map((task) => {
                const project = projects.find((item) => item.id === task.projectId);
                return (
                  <tr key={task.id} className="hover:bg-white/5">
                    <td className="px-3 py-4 font-semibold text-white">{task.title}</td>
                    <td className="px-3 py-4 text-slate-300">{project?.name ?? task.projectId}</td>
                    <td className="px-3 py-4 capitalize text-slate-300">{task.type}</td>
                    <td className="px-3 py-4"><StatusBadge status={task.status} /></td>
                    <td className="px-3 py-4 text-slate-300">{task.owner}</td>
                    <td className="px-3 py-4 text-slate-300">{formatDate(task.createdAt)}</td>
                    <td className="px-3 py-4 text-slate-300">{formatDate(task.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-surface-darkElevated">
                          <div className="h-2 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-300">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <AppLink href={`/projects/${task.projectId}`}>
                        <Button size="sm" variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>Open</Button>
                      </AppLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
