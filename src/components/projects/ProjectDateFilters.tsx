"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

export type DatePreset = "All" | "Today" | "Yesterday" | "Last 7 days" | "Last 30 days" | "Custom";

export interface ProjectDateFilterState {
  preset: DatePreset;
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}

const presets: DatePreset[] = ["All", "Today", "Yesterday", "Last 7 days", "Last 30 days", "Custom"];

export const defaultProjectDateFilters: ProjectDateFilterState = {
  preset: "All",
  createdFrom: "",
  createdTo: "",
  updatedFrom: "",
  updatedTo: ""
};

export function ProjectDateFilters({
  value,
  onChange
}: {
  value: ProjectDateFilterState;
  onChange: (value: ProjectDateFilterState) => void;
}) {
  const set = (patch: Partial<ProjectDateFilterState>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition hover:-translate-y-px hover:border-primary/40 hover:bg-primary/10",
              value.preset === preset ? "border-primary bg-primary text-white shadow-glow" : "border-surface-darkBorder bg-surface-darkElevated/60 text-slate-300 hover:text-white"
            )}
            onClick={() => set({ preset })}
            type="button"
          >
            {preset}
          </button>
        ))}
        <Button className="ml-auto" size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => onChange(defaultProjectDateFilters)}>
          Reset
        </Button>
      </div>

      {value.preset === "Custom" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Created from</span>
            <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" type="date" value={value.createdFrom} onChange={(event) => set({ createdFrom: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Created to</span>
            <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" type="date" value={value.createdTo} onChange={(event) => set({ createdTo: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Updated from</span>
            <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" type="date" value={value.updatedFrom} onChange={(event) => set({ updatedFrom: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Updated to</span>
            <input className="h-9 w-full rounded-input border border-surface-darkBorder bg-surface-dark px-3 text-xs text-white" type="date" value={value.updatedTo} onChange={(event) => set({ updatedTo: event.target.value })} />
          </label>
        </div>
      ) : null}
    </div>
  );
}
