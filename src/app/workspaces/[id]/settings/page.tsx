"use client";

import { Archive, ArrowLeft, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppLink } from "@/components/shared/AppLink";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ToggleSetting } from "@/components/settings/ToggleSetting";
import { useUiStore } from "@/store/ui-store";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function WorkspaceSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const archiveWorkspace = useWorkspaceStore((state) => state.archiveWorkspace);
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const workspace = useMemo(() => workspaces.find((item) => item.id === params.id), [params.id, workspaces]);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: workspace?.name ?? "",
    description: workspace?.description ?? "",
    defaultProvider: workspace?.defaultProvider ?? "Mock",
    defaultModel: workspace?.defaultModel ?? "Mock GPT-5",
    defaultTemperature: workspace?.defaultTemperature ?? 0.4,
    defaultMaxTokens: workspace?.defaultMaxTokens ?? 12000,
    monthlyTokenLimit: workspace?.monthlyTokenLimit ?? 1_000_000,
    monthlyCostLimit: workspace?.monthlyCostLimit ?? 250,
    warningThreshold: workspace?.warningThreshold ?? 80,
    requireApprovalBeforeFinalOutput: workspace?.requireApprovalBeforeFinalOutput ?? true,
    enableAuditLogs: workspace?.enableAuditLogs ?? true,
    preventAgentsFromSeeingSecrets: workspace?.preventAgentsFromSeeingSecrets ?? true
  });

  useEffect(() => {
    if (!workspace) return;
    setForm({
      name: workspace.name,
      description: workspace.description,
      defaultProvider: workspace.defaultProvider ?? "Mock",
      defaultModel: workspace.defaultModel ?? "Mock GPT-5",
      defaultTemperature: workspace.defaultTemperature ?? 0.4,
      defaultMaxTokens: workspace.defaultMaxTokens ?? 12000,
      monthlyTokenLimit: workspace.monthlyTokenLimit ?? 1_000_000,
      monthlyCostLimit: workspace.monthlyCostLimit ?? 250,
      warningThreshold: workspace.warningThreshold ?? 80,
      requireApprovalBeforeFinalOutput: workspace.requireApprovalBeforeFinalOutput ?? true,
      enableAuditLogs: workspace.enableAuditLogs ?? true,
      preventAgentsFromSeeingSecrets: workspace.preventAgentsFromSeeingSecrets ?? true
    });
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <EmptyState
          title="Workspace not found"
          description="This mocked workspace ID does not exist in local state."
          action={
            <AppLink href="/workspaces">
              <Button variant="primary">Back to workspaces</Button>
            </AppLink>
          }
        />
      </div>
    );
  }

  const patch = (key: keyof typeof form, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    updateWorkspace(workspace.id, form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const archive = () => {
    archiveWorkspace(workspace.id);
    setPageLoading(true);
    router.push("/workspaces");
  };

  const remove = () => {
    deleteWorkspace(workspace.id);
    setPageLoading(true);
    router.push("/workspaces");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <AppLink href="/workspaces" className="mb-2 inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Workspaces
          </AppLink>
          <h1 className="text-xl font-semibold text-white">{workspace.name} Settings</h1>
          <p className="mt-1 text-sm text-muted">Mock workspace controls for defaults, budget, members, and security.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setActiveWorkspace(workspace.id)}>Set active</Button>
          <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={save}>Save settings</Button>
        </div>
      </div>

      {saved ? <p className="rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Workspace settings saved locally.</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection title="General" description="Core workspace identity shown in the sidebar and switcher.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={form.name} onChange={(event) => patch("name", event.target.value)} />
          <textarea className="min-h-28 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white" value={form.description} onChange={(event) => patch("description", event.target.value)} />
          <div className="flex items-center gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
            <span className="grid h-10 w-10 place-items-center rounded-button bg-primary/15 text-primary-soft">{workspace.name.slice(0, 1)}</span>
            <span className="text-sm text-slate-300">Icon/avatar placeholder</span>
          </div>
        </SettingsSection>

        <SettingsSection title="Members" description="Member controls are mocked until collaboration APIs exist.">
          {["Prashant · Owner", "Claude Critic · Future system member", "Gemini Architect · Future system member"].map((item) => (
            <div key={item} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3 text-sm text-slate-200">{item}</div>
          ))}
        </SettingsSection>

        <SettingsSection title="Defaults" description="Default provider, model, temperature, and output budget.">
          <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={form.defaultProvider} onChange={(event) => patch("defaultProvider", event.target.value)}>
            {["Mock", "OpenAI", "Anthropic Claude", "Gemini", "Ollama"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" value={form.defaultModel} onChange={(event) => patch("defaultModel", event.target.value)}>
            {["Mock GPT-5", "Mock Claude Opus", "Mock Gemini", "Mock Local"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" step="0.1" min="0" max="1" value={form.defaultTemperature} onChange={(event) => patch("defaultTemperature", Number(event.target.value))} />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" step="1000" value={form.defaultMaxTokens} onChange={(event) => patch("defaultMaxTokens", Number(event.target.value))} />
        </SettingsSection>

        <SettingsSection title="Budget" description="Mock guardrails mirrored by usage and billing surfaces.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" value={form.monthlyTokenLimit} onChange={(event) => patch("monthlyTokenLimit", Number(event.target.value))} />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" value={form.monthlyCostLimit} onChange={(event) => patch("monthlyCostLimit", Number(event.target.value))} />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="number" min="1" max="100" value={form.warningThreshold} onChange={(event) => patch("warningThreshold", Number(event.target.value))} />
        </SettingsSection>

        <SettingsSection title="Security" description="Controls describe future backend enforcement and agent context boundaries.">
          <ToggleSetting label="Require approval before final output" enabled={form.requireApprovalBeforeFinalOutput} onChange={(value) => patch("requireApprovalBeforeFinalOutput", value)} />
          <ToggleSetting label="Enable audit logs" enabled={form.enableAuditLogs} onChange={(value) => patch("enableAuditLogs", value)} />
          <ToggleSetting label="Prevent agents from seeing secrets" enabled={form.preventAgentsFromSeeingSecrets} onChange={(value) => patch("preventAgentsFromSeeingSecrets", value)} />
        </SettingsSection>

        <GlassCard className="border-danger/25 bg-danger/10">
          <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          <p className="mt-1 text-sm text-muted">Mock-only actions. No backend deletion is performed.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Archive className="h-4 w-4" />} onClick={archive}>Archive workspace</Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={remove}>Delete locally</Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
