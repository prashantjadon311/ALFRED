"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Library, Paperclip, Send, Settings, Slash, Square } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { IconButton } from "@/components/shared/IconButton";
import { useChatStore } from "@/store/chat-store";
import { useModelStore } from "@/store/model-store";
import { useSettingsStore } from "@/store/settings-store";
import { AgentActionsDropdown } from "./AgentActionsDropdown";
import { CompactModelSelector } from "./CompactModelSelector";
import { ModeSelector, type PlaygroundMode } from "./ModeSelector";
import { FileAttachmentPreview } from "@/components/chat/FileAttachmentPreview";

export function ChatComposer({ chatId }: { chatId: string }) {
  const [value, setValue] = useState("");
  const [attached, setAttached] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [provider, setProvider] = useState("OpenAI");
  const [mode, setMode] = useState<PlaygroundMode>("Chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const settings = useSettingsStore();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [value]);

  const send = () => {
    if (!value.trim()) return;
    const prompt = value.trim();
    setValue("");
    setStreaming(true);
    appendMessage(chatId, { role: "user", content: prompt, model: selectedModel, tokens: 820, cost: 0.02, latency: 0 });
    window.setTimeout(() => {
      appendMessage(chatId, {
        role: "assistant",
        model: selectedModel,
        tokens: mode === "Compare" ? 3660 : 2440,
        cost: mode === "Agent" ? 0.11 : 0.09,
        latency: 2.8,
        content:
          mode === "Agent"
            ? "Mock A.L.F.R.E.D. agent response. I would lock the requirement, build structured context, run the collaboration loop, ask Claude to critique, and emit artifact-ready outputs."
            : mode === "Compare"
              ? "Mock compare response prepared for selected models. The strongest answer would merge product design clarity, architecture constraints, and Claude-style risk critique."
              : "Mock response generated locally. I would keep this as a focused chat turn unless risk, drift, or cost thresholds suggest an agentic workflow."
      });
      setStreaming(false);
    }, 700);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="sticky bottom-0 z-10 border-t border-surface-darkBorder/70 bg-surface-dark/86 px-3 py-2.5 backdrop-blur-xl">
      <div className="mx-auto max-w-[900px]">
        {attached ? (
          <div className="mb-2">
            <FileAttachmentPreview />
          </div>
        ) : null}
        <div className="relative rounded-[18px] border border-surface-darkBorder bg-surface-darkElevated/88 p-2.5 shadow-card transition focus-within:border-primary/45 focus-within:shadow-glow">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask A.L.F.R.E.D. anything..."
            className="max-h-[180px] min-h-11 w-full resize-none bg-transparent px-1 text-sm leading-6 text-slate-100 placeholder:text-muted"
            aria-label="Chat prompt"
          />
          {streaming ? (
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-surface-dark">
              <div className="skeleton-shimmer h-full w-full" />
            </div>
          ) : null}

          {settingsOpen ? (
            <div className="absolute bottom-14 right-2 z-30 w-72 rounded-card border border-surface-darkBorder bg-surface-darkElevated p-3 shadow-glow">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Session Settings</p>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-300">Temperature {settings.globalTemperature}</span>
                  <input className="w-full accent-primary" type="range" min="0" max="1" step="0.1" value={settings.globalTemperature} onChange={(event) => settings.setGlobalTemperature(Number(event.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-300">Top P {settings.topP}</span>
                  <input className="w-full accent-primary" type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={(event) => settings.setTopP(Number(event.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-300">Max tokens</span>
                  <input className="h-8 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" value={settings.maxTokens} onChange={(event) => settings.setMaxTokens(Number(event.target.value))} />
                </label>
              </div>
            </div>
          ) : null}

          <div className="flex min-h-8 flex-wrap items-center gap-1.5 border-t border-surface-darkBorder/80 pt-2 sm:flex-nowrap">
            <IconButton label="Attach file" variant={attached ? "primary" : "ghost"} onClick={() => setAttached((current) => !current)}>
              <Paperclip className="h-4 w-4" />
            </IconButton>
            <AgentActionsDropdown chatId={chatId} compact={mode !== "Agent"} />
            <IconButton label="Prompt library">
              <Library className="h-4 w-4" />
            </IconButton>
            <IconButton label="Slash commands">
              <Slash className="h-4 w-4" />
            </IconButton>

            <div className="flex min-w-0 items-center gap-1.5">
              <div className="hidden sm:block">
                <CompactModelSelector provider={provider} onProviderChange={setProvider} />
              </div>
              <ModeSelector value={mode} onChange={setMode} />
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-1.5">
              {mode === "Compare" ? <span className="hidden rounded-full border border-surface-darkBorder px-2 py-1 text-[11px] text-muted md:inline">3 models</span> : null}
              {mode === "Agent" ? <span className="hidden rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] text-primary-soft md:inline">Agent mode</span> : null}
              <IconButton label="Composer settings" onClick={() => setSettingsOpen((current) => !current)}>
                <Settings className="h-4 w-4" />
              </IconButton>
              <span className="hidden text-xs text-muted sm:inline">{value.length}/8k</span>
              {streaming ? (
                <Button size="sm" variant="danger" icon={<Square className="h-4 w-4" />} onClick={() => setStreaming(false)}>
                  Stop
                </Button>
              ) : (
                <Button size="sm" variant="primary" icon={<Send className="h-4 w-4" />} onClick={send} disabled={!value.trim()}>
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
