"use client";

import { LogOut, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ToggleSetting } from "@/components/settings/ToggleSetting";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setPageLoading = useUiStore((state) => state.setPageLoading);
  const [saved, setSaved] = useState(false);
  const [logoutError, setLogoutError] =
    useState<string | null>(null);

  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const signOut = async () => {
    setLogoutError(null);

    try {
      await logout();
      setPageLoading(true);
      router.replace("/login");
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Sign out failed. Please retry."
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Account Settings</h1>
          <p className="mt-1 text-sm text-muted">Mock account controls prepared for future backend identity APIs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={signOut}>Sign out</Button>
          <Button variant="primary" icon={<Save className="h-4 w-4" />} onClick={save}>Save preferences</Button>
        </div>
      </div>
      {saved ? <p className="rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Account preferences saved locally.</p> : null}
      {logoutError ? (
        <p className="rounded-card border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
          {logoutError}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection title="Personal Info" description="Profile details visible across the mocked A.L.F.R.E.D. workspace.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={user?.name ?? "Prashant"} />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="Workspace Owner" />
          <Button variant="secondary" icon={<Save className="h-4 w-4" />} onClick={save}>Update profile</Button>
        </SettingsSection>

        <SettingsSection title="Email" description="Primary account email for future notifications and approvals.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue={user?.email ?? "demo@alfred.local"} />
          <ToggleSetting label="Budget and workflow notifications" description="Receive mocked approval and budget notifications." />
        </SettingsSection>

        <SettingsSection title="Password" description="Placeholder for future secure password updates.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="password" placeholder="Current password" disabled />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" type="password" placeholder="New password" disabled />
          <Button variant="secondary" onClick={save}>Reset password placeholder</Button>
        </SettingsSection>

        <SettingsSection title="Connected Accounts" description="Future OAuth, GitHub, and local LLM account integrations.">
          {["GitHub", "Google", "OpenRouter", "Local Ollama"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
              <span className="text-sm font-medium text-white">{item}</span>
              <span className="text-xs text-muted">Not connected</span>
            </div>
          ))}
        </SettingsSection>

        <SettingsSection title="Sessions" description="Mock device sessions for future security review.">
          {["Current browser session", "CLI handoff session"].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/55 p-3">
              <div>
                <p className="text-sm font-medium text-white">{item}</p>
                <p className="text-xs text-muted">{index === 0 ? "Active now" : "Mock inactive session"}</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-success" />
            </div>
          ))}
        </SettingsSection>

        <SettingsSection title="Danger Zone" description="Visible placeholders only; no destructive backend action is performed.">
          <Button variant="danger">Deactivate account placeholder</Button>
          <Button variant="secondary">Export account data placeholder</Button>
        </SettingsSection>
      </div>
    </div>
  );
}
