"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function NewWorkspacePage() {
  const router = useRouter();
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultProvider, setDefaultProvider] = useState("Mock");
  const [defaultModel, setDefaultModel] = useState("Mock GPT-5");
  const [monthlyTokenLimit, setMonthlyTokenLimit] = useState(1_000_000);
  const [monthlyCostLimit, setMonthlyCostLimit] = useState(250);
  const [themePreference, setThemePreference] = useState<"dark" | "light" | "system">("dark");
  const [makeActive, setMakeActive] = useState(true);

  const create = () => {
    if (!name.trim()) return;
    const id = createWorkspace({ name, description, defaultProvider, defaultModel, monthlyTokenLimit, monthlyCostLimit, themePreference });
    if (makeActive) setActiveWorkspace(id);
    setPageLoading(true);
    router.push(`/workspaces/${id}/settings`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Create Workspace</h1>
          <p className="mt-1 text-sm text-muted">Create a local mock workspace for agentic projects, chats, models, and budgets.</p>
        </div>
        <AppLink href="/workspaces">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Cancel</Button>
        </AppLink>
      </div>

      <GlassCard>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Workspace name</span>
            <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={name} onChange={(event) => setName(event.target.value)} placeholder="A.L.F.R.E.D. Lab" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
            <textarea className="min-h-28 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Workspace for agentic workflow experiments." />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Default provider</span>
            <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={defaultProvider} onChange={(event) => setDefaultProvider(event.target.value)}>
              {["Mock", "OpenAI", "Anthropic Claude", "Gemini", "Ollama"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Default model</span>
            <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={defaultModel} onChange={(event) => setDefaultModel(event.target.value)}>
              {["Mock GPT-5", "Mock Claude Opus", "Mock Gemini", "Mock Local"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Monthly token limit</span>
            <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" value={monthlyTokenLimit} min={10000} step={10000} onChange={(event) => setMonthlyTokenLimit(Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Monthly cost limit</span>
            <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" value={monthlyCostLimit} min={1} step={5} onChange={(event) => setMonthlyCostLimit(Number(event.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">Theme preference</span>
            <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={themePreference} onChange={(event) => setThemePreference(event.target.value as "dark" | "light" | "system")}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
            <input type="checkbox" checked={makeActive} onChange={(event) => setMakeActive(event.target.checked)} className="h-4 w-4 accent-primary" />
            <span className="text-sm text-slate-200">Set as active workspace after creation</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <AppLink href="/workspaces">
            <Button variant="secondary">Cancel</Button>
          </AppLink>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={create} disabled={!name.trim()}>
            Create workspace
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
