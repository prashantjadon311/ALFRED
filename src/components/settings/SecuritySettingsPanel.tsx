import { ToggleSetting } from "./ToggleSetting";

export function SecuritySettingsPanel() {
  return (
    <>
      <ToggleSetting label="Mask API keys" description="Always display provider credentials as masked placeholders." />
      <ToggleSetting label="Require approval before external tool execution" description="Human confirmation before any future backend tool call." />
      <ToggleSetting label="Enable audit logs" description="Record workflow decisions and mocked state transitions." />
      <ToggleSetting label="Prevent agents from seeing raw secrets" description="Secret values are never injected into prompts." />
      <ToggleSetting label="Require approval before final output" description="Pause before export artifacts are finalized." />
      <ToggleSetting label="Enable requirement drift detection" description="Compare each agent output against the locked motive." />
    </>
  );
}
