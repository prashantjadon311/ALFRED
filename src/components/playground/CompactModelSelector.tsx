"use client";

import { BrainCircuit, Cpu } from "lucide-react";
import { useMemo } from "react";
import { useModelStore } from "@/store/model-store";

export function CompactModelSelector({ provider, onProviderChange }: { provider: string; onProviderChange: (provider: string) => void }) {
  const providers = useModelStore((state) => state.providers);
  const models = useModelStore((state) => state.models);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);
  const enabledProviders = providers.filter((item) => item.enabled);
  const visibleModels = useMemo(() => models.filter((model) => !provider || model.provider === provider), [models, provider]);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <label className="relative">
        <Cpu className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <select
          value={provider}
          onChange={(event) => onProviderChange(event.target.value)}
          aria-label="Select provider"
          className="h-8 max-w-[9rem] rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 pl-7 pr-7 text-xs text-slate-100"
        >
          {enabledProviders.map((item) => (
            <option key={item.id} value={item.name}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="relative">
        <BrainCircuit className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <select
          value={selectedModel}
          onChange={(event) => setSelectedModel(event.target.value)}
          aria-label="Select model"
          className="h-8 max-w-[10rem] rounded-button border border-surface-darkBorder bg-surface-darkElevated/70 pl-7 pr-7 text-xs text-slate-100"
        >
          {(visibleModels.length ? visibleModels : models).map((model) => (
            <option key={model.id} value={model.name}>{model.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
