"use client";

import { Save, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useProjectStore } from "@/store/project-store";
import { useWorkflowStore } from "@/store/workflow-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { formatCurrency, formatTokens } from "@/lib/utils";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const chats = useChatStore((state) => state.chats);
  const workflows = useWorkflowStore((state) => state.workflows);
  const activeWorkspace = useWorkspaceStore((state) => state.getActiveWorkspace());
  const [name, setName] = useState(user?.name ?? "Prashant");
  const [title, setTitle] = useState("Workspace Owner");
  const [saved, setSaved] = useState(false);

  const tokenUsage = activeWorkspace?.stats.tokenUsage ?? projects.reduce((sum, project) => sum + project.tokenUsage, 0);

  return (
    <div className="space-y-5">
      <GlassCard className="border-primary/25 bg-primary/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-2xl font-bold text-white shadow-glow">
              {(name || "P").slice(0, 1)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-white">{name}</h1>
                <StatusBadge status="Active" />
                <span className="rounded-full border border-success/25 bg-success/10 px-2 py-1 text-xs font-semibold text-success">Pro</span>
              </div>
              <p className="mt-1 text-sm text-muted">{user?.email ?? "demo@alfred.local"} · {title}</p>
              <p className="mt-1 text-xs text-muted">Current workspace: {activeWorkspace?.name ?? "Prashant / Pro Workspace"}</p>
            </div>
          </div>
          <Button
            variant="primary"
            icon={<Save className="h-4 w-4" />}
            onClick={() => {
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1800);
            }}
          >
            Save mock profile
          </Button>
        </div>
      </GlassCard>

      {saved ? <p className="rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Profile changes saved locally for this session.</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Projects" value={`${projects.length}`} detail="Mock workspace scope" />
        <MetricCard label="Chats" value={`${chats.length}`} detail="Playground sessions" />
        <MetricCard label="Workflow runs" value={`${workflows.length}`} detail="Agentic executions" />
        <MetricCard label="Tokens" value={formatTokens(tokenUsage)} detail="Workspace usage" />
        <MetricCard label="Cost" value={formatCurrency(activeWorkspace?.stats.cost ?? 0)} detail="Estimated spend" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <GlassCard>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <UserRound className="h-5 w-5 text-primary-soft" /> Profile Identity
          </h2>
          <p className="mt-1 text-sm text-muted">Frontend-only profile fields for handoff and future account APIs.</p>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Display name</span>
              <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Role</span>
              <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Email</span>
              <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={user?.email ?? "demo@alfred.local"} readOnly />
            </label>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Agentic Workspace Summary</h2>
          <p className="mt-1 text-sm text-muted">Profile context follows the active mocked workspace.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Workspace", activeWorkspace?.name ?? "Prashant / Pro Workspace"],
              ["Plan", "Pro Workspace"],
              ["Default provider", activeWorkspace?.defaultProvider ?? "Mock"],
              ["Default model", activeWorkspace?.defaultModel ?? "Mock GPT-5"],
              ["Monthly token limit", formatTokens(activeWorkspace?.monthlyTokenLimit ?? 1_000_000)],
              ["Monthly cost limit", formatCurrency(activeWorkspace?.monthlyCostLimit ?? 250)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 truncate font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
