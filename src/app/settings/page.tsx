"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { BudgetProgress } from "@/components/usage/BudgetProgress";
import { KeyboardShortcutsPanel } from "@/components/settings/KeyboardShortcutsPanel";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SliderSetting } from "@/components/settings/SliderSetting";
import { ToggleSetting } from "@/components/settings/ToggleSetting";
import { useSettingsStore } from "@/store/settings-store";
import { useUiStore } from "@/store/ui-store";
import { settingsService } from "@/services/settings-service";

export default function SettingsPage() {
  const settings = useSettingsStore();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await settingsService.saveSettings({
      globalTemperature: settings.globalTemperature,
      topP: settings.topP,
      maxTokens: settings.maxTokens,
      maxIterations: settings.maxIterations,
      theme
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="primary" onClick={save}>Save settings</Button>
      </div>
      {saved ? <p className="mb-4 rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">Settings saved locally.</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsSection title="Workspace Settings" description="Identity and execution defaults for this mocked workspace.">
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="Prashant / Pro Workspace" />
          <input className="h-11 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white" defaultValue="A.L.F.R.E.D. Command Center" />
        </SettingsSection>

        <SettingsSection title="Appearance" description="Dark mode uses Tailwind class strategy.">
          <ToggleSetting label="Dark mode first" description="Use command-center dark UI as default." enabled={theme === "dark"} onChange={(enabled) => setTheme(enabled ? "dark" : "light")} />
          <ToggleSetting label="Glassmorphism panels" description="Use translucent elevated panels and soft borders." />
          <ToggleSetting label="Reduce motion" description="Use simpler transitions for sensitive users." enabled={false} />
        </SettingsSection>

        <SettingsSection title="Global Agent Defaults" description="Fallback controls for new chats and workflow nodes.">
          <SliderSetting label="Default temperature" value={settings.globalTemperature} min={0} max={1} step={0.1} onChange={settings.setGlobalTemperature} />
          <SliderSetting label="Default top P" value={settings.topP} min={0} max={1} step={0.05} onChange={settings.setTopP} />
          <SliderSetting label="Default max tokens" value={settings.maxTokens} min={1000} max={50000} step={1000} onChange={settings.setMaxTokens} />
          <SliderSetting label="Max workflow iterations" value={settings.maxIterations} min={1} max={12} step={1} onChange={settings.setMaxIterations} />
          <ToggleSetting label="Stop on blocker" />
          <ToggleSetting label="Stop on high severity" />
          <ToggleSetting label="Auto-compress prompts after token threshold" />
        </SettingsSection>

        <SettingsSection title="Budget Rules" description="Mocked spend controls used by workflow meters and alerts.">
          {settings.budgetRules.map((rule) => (
            <BudgetProgress key={rule.id} rule={rule} />
          ))}
        </SettingsSection>

        <SettingsSection title="Security" description="Guardrails for secrets, approvals, audit logs, and drift detection.">
          <SecuritySettingsPanel />
        </SettingsSection>

        <SettingsSection title="Export Settings" description="Default artifact export preferences.">
          <ToggleSetting label="Export markdown summary" />
          <ToggleSetting label="Export workflow JSON" />
          <ToggleSetting label="Export Codex prompt bundle" />
          <ToggleSetting label="Include audit timeline" />
        </SettingsSection>

        <SettingsSection title="Notifications" description="Mock notification preferences for workflow and budget events.">
          <ToggleSetting label="Budget threshold alerts" />
          <ToggleSetting label="Human approval checkpoints" />
          <ToggleSetting label="Failed workflow notifications" />
          <ToggleSetting label="Provider health warnings" />
        </SettingsSection>

        <SettingsSection title="Keyboard Shortcuts" description="Visual support for command and chat shortcuts.">
          <KeyboardShortcutsPanel />
        </SettingsSection>
      </div>
    </div>
  );
}
