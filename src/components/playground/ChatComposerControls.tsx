"use client";

import { Library, Paperclip, Send, Settings, Square, WandSparkles } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { ModelPicker } from "@/components/chat/ModelPicker";

export type PlaygroundMode = "Chat" | "Compare" | "Agent Assisted";

const modes: PlaygroundMode[] = ["Chat", "Compare", "Agent Assisted"];

export function ChatComposerControls({
  provider,
  onProviderChange,
  mode,
  onModeChange,
  attached,
  onToggleAttach,
  onToggleSettings,
  streaming,
  canSend,
  valueLength,
  onSend,
  onStop
}: {
  provider: string;
  onProviderChange: (provider: string) => void;
  mode: PlaygroundMode;
  onModeChange: (mode: PlaygroundMode) => void;
  attached: boolean;
  onToggleAttach: () => void;
  onToggleSettings: () => void;
  streaming: boolean;
  canSend: boolean;
  valueLength: number;
  onSend: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-surface-darkBorder pt-3">
      <Button size="icon" variant={attached ? "primary" : "ghost"} aria-label="Attach file" title="Attach" onClick={onToggleAttach}>
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Open prompt library" title="Prompt library">
        <Library className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Slash commands" title="Slash commands">
        <WandSparkles className="h-4 w-4" />
      </Button>

      <select
        value={provider}
        onChange={(event) => onProviderChange(event.target.value)}
        aria-label="Select provider"
        className="h-8 rounded-button border border-surface-darkBorder bg-surface-darkElevated px-2 text-xs text-slate-100"
      >
        <option>OpenAI</option>
        <option>Anthropic Claude</option>
        <option>Google Gemini</option>
        <option>Local/Ollama</option>
        <option>Mock Provider</option>
      </select>

      <ModelPicker compact />

      <div className="inline-flex h-8 rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 p-0.5">
        {modes.map((item) => (
          <button
            key={item}
            className={cn(
              "rounded-[6px] px-2.5 text-xs font-medium text-muted transition hover:text-white",
              mode === item && "bg-primary text-white shadow-glow"
            )}
            onClick={() => onModeChange(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <Button size="icon" variant="ghost" aria-label="Open settings" title="Settings" onClick={onToggleSettings}>
        <Settings className="h-4 w-4" />
      </Button>

      <span className="text-xs text-muted">{valueLength}/8,000</span>

      <div className="ml-auto flex items-center gap-2">
        {streaming ? (
          <Button variant="danger" icon={<Square className="h-4 w-4" />} onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button variant="primary" icon={<Send className="h-4 w-4" />} onClick={onSend} disabled={!canSend}>
            Send
          </Button>
        )}
      </div>
    </div>
  );
}
