"use client";

import { Archive, Bot, CheckCircle2, CircleDollarSign, FolderKanban, MessageSquare, Pencil, Plus, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { AppLink } from "@/components/shared/AppLink";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, formatTokens } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

export function WorkspaceDashboard() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((state) => state.archiveWorkspace);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const visibleWorkspaces = useMemo(() => workspaces.filter((workspace) => !workspace.archived), [workspaces]);

  const create = () => {
    if (!name.trim()) return;
    const id = createWorkspace(name, description || "Agentic workspace");
    setActiveWorkspace(id);
    setName("");
    setDescription("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Projects" value={`${activeWorkspace?.stats.projects ?? 0}`} icon={<FolderKanban className="h-4 w-4" />} />
        <MetricCard label="Chats" value={`${activeWorkspace?.stats.chats ?? 0}`} icon={<MessageSquare className="h-4 w-4" />} />
        <MetricCard label="Workflow runs" value={`${activeWorkspace?.stats.workflowRuns ?? 0}`} icon={<Workflow className="h-4 w-4" />} />
        <MetricCard label="Token usage" value={formatTokens(activeWorkspace?.stats.tokenUsage ?? 0)} icon={<Bot className="h-4 w-4" />} />
        <MetricCard label="Cost" value={formatCurrency(activeWorkspace?.stats.cost ?? 0)} icon={<CircleDollarSign className="h-4 w-4" />} />
        <MetricCard label="Active agents" value={`${activeWorkspace?.stats.activeAgents ?? 0}`} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <GlassCard className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr_auto]">
          <input
            className="h-10 rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
            placeholder="Workspace name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="h-10 rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={create} disabled={!name.trim()}>
            Create
          </Button>
        </div>
        <div className="mt-3 flex justify-end">
          <AppLink href="/workspaces/new">
            <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />}>Open full workspace creator</Button>
          </AppLink>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-3">
        {visibleWorkspaces.map((workspace) => (
          <GlassCard key={workspace.id} className="flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-white">{workspace.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{workspace.description}</p>
              </div>
              {workspace.id === activeWorkspaceId ? <StatusBadge status="Active" /> : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-card bg-black/15 p-3">
                <p className="text-muted">Created</p>
                <p className="mt-1 font-semibold text-white">{formatDate(workspace.createdAt)}</p>
              </div>
              <div className="rounded-card bg-black/15 p-3">
                <p className="text-muted">Updated</p>
                <p className="mt-1 font-semibold text-white">{formatDate(workspace.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
                <p className="text-muted">Projects</p>
                <p className="font-semibold text-white">{workspace.stats.projects}</p>
              </div>
              <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
                <p className="text-muted">Runs</p>
                <p className="font-semibold text-white">{workspace.stats.workflowRuns}</p>
              </div>
              <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
                <p className="text-muted">Agents</p>
                <p className="font-semibold text-white">{workspace.stats.activeAgents}</p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button size="sm" variant={workspace.id === activeWorkspaceId ? "primary" : "secondary"} onClick={() => setActiveWorkspace(workspace.id)}>
                Set active
              </Button>
              <AppLink href={`/workspaces/${workspace.id}/settings`}>
                <Button size="sm" variant="secondary">
                  Settings
                </Button>
              </AppLink>
              <Button
                size="sm"
                variant="secondary"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  const nextName = window.prompt("Rename workspace", workspace.name);
                  if (nextName) renameWorkspace(workspace.id, nextName);
                }}
              >
                Rename
              </Button>
              <Button size="sm" variant="ghost" icon={<Archive className="h-4 w-4" />} onClick={() => archiveWorkspace(workspace.id)}>
                Archive
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
