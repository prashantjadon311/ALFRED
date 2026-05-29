"use client";

import { useModelStore } from "@/store/model-store";

export function ModelPicker({ compact = false }: { compact?: boolean }) {
  const models = useModelStore((state) => state.models);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);

  return (
    <select
      value={selectedModel}
      onChange={(event) => setSelectedModel(event.target.value)}
      aria-label="Select model"
      className={compact ? "h-8 rounded-button border border-surface-darkBorder bg-surface-darkElevated px-2 text-xs text-slate-100" : "h-10 rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-slate-100"}
    >
      {models.map((model) => (
        <option key={model.id} value={model.name}>
          {model.name}
        </option>
      ))}
    </select>
  );
}
