"use client";

import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";

export function ProjectMemoryPanel({
  memories,
  onSave,
  saving = false
}: {
  memories: string[];
  onSave?: (memories: string[]) => void;
  saving?: boolean;
}) {
  const [value, setValue] = useState(memories.join("\n"));

  useEffect(() => {
    setValue(memories.join("\n"));
  }, [memories]);

  const nextMemories = value
    .split("\n")
    .map((memory) => memory.trim())
    .filter(Boolean);

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Brain className="h-5 w-5 text-primary-soft" /> Project Memory
        </h2>
        {onSave ? (
          <Button size="sm" variant="secondary" onClick={() => onSave(nextMemories)} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        ) : null}
      </div>
      <div className="mt-4 space-y-2">
        {onSave ? (
          <textarea
            className="min-h-40 w-full rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 text-sm leading-6 text-slate-300"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="One project memory item per line"
          />
        ) : (
          <>
            {!memories.length ? <EmptyState title="No memory saved" description="Important project constraints and decisions will be preserved here." /> : null}
            {memories.map((memory) => (
              <p key={memory} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 text-sm leading-6 text-slate-300 transition hover:border-primary/30">
                {memory}
              </p>
            ))}
          </>
        )}
      </div>
    </GlassCard>
  );
}
