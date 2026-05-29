"use client";

import { KeyboardEvent, useState } from "react";
import { ChatComposerControls, type PlaygroundMode } from "@/components/playground/ChatComposerControls";
import { useChatStore } from "@/store/chat-store";
import { useModelStore } from "@/store/model-store";
import { useSettingsStore } from "@/store/settings-store";
import { FileAttachmentPreview } from "./FileAttachmentPreview";
import { SuggestionChips } from "./SuggestionChips";

export function ChatComposer({ chatId }: { chatId: string }) {
  const [value, setValue] = useState("");
  const [attached, setAttached] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [provider, setProvider] = useState("OpenAI");
  const [mode, setMode] = useState<PlaygroundMode>("Chat");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const settings = useSettingsStore();

  const send = () => {
    if (!value.trim()) return;
    const prompt = value;
    setValue("");
    setStreaming(true);
    appendMessage(chatId, { role: "user", content: prompt, model: selectedModel, tokens: 820, cost: 0.02, latency: 0 });
    window.setTimeout(() => {
      appendMessage(chatId, {
        role: "assistant",
        model: selectedModel,
        tokens: 2440,
        cost: 0.09,
        latency: 2.8,
        content:
          "Mock response generated locally. I would route this through the requirement lock first, then choose between single-model drafting, compare mode, or a governed agent workflow depending on risk and budget."
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
    <div className="sticky bottom-0 border-t border-surface-darkBorder bg-surface-dark/90 p-3 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        <SuggestionChips onSelect={(text) => setValue((current) => current + text)} />
        {attached ? (
          <div className="mt-3">
            <FileAttachmentPreview />
          </div>
        ) : null}
        <div className="relative mt-3 rounded-panel border border-surface-darkBorder bg-surface-darkElevated/85 p-3 shadow-card transition focus-within:border-primary/45 focus-within:shadow-glow">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            placeholder="Ask A.L.F.R.E.D. to design, compare, critique, or execute an agent workflow..."
            className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 text-slate-100 placeholder:text-muted"
            aria-label="Chat prompt"
          />
          {streaming ? <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-dark"><div className="skeleton-shimmer h-full w-full" /></div> : null}
          {settingsOpen ? (
            <div className="absolute bottom-16 right-3 z-20 w-72 rounded-card border border-surface-darkBorder bg-surface-darkElevated p-3 shadow-glow">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Session Settings</p>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-300">Temperature {settings.globalTemperature}</span>
                  <input className="w-full accent-primary" type="range" min="0" max="1" step="0.1" value={settings.globalTemperature} onChange={(event) => settings.setGlobalTemperature(Number(event.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-300">Mode</span>
                  <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" value={`${provider} · ${mode}`} readOnly />
                </label>
              </div>
            </div>
          ) : null}
          <ChatComposerControls
            provider={provider}
            onProviderChange={setProvider}
            mode={mode}
            onModeChange={setMode}
            attached={attached}
            onToggleAttach={() => setAttached((current) => !current)}
            onToggleSettings={() => setSettingsOpen((current) => !current)}
            streaming={streaming}
            canSend={Boolean(value.trim())}
            valueLength={value.length}
            onSend={send}
            onStop={() => setStreaming(false)}
          />
        </div>
      </div>
    </div>
  );
}
