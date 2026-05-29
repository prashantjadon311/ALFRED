import { Brain } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";

export function ProjectMemoryPanel({ memories }: { memories: string[] }) {
  return (
    <GlassCard>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Brain className="h-5 w-5 text-primary-soft" /> Project Memory
      </h2>
      <div className="mt-4 space-y-2">
        {!memories.length ? <EmptyState title="No memory saved" description="Important project constraints and decisions will be preserved here." /> : null}
        {memories.map((memory) => (
          <p key={memory} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 text-sm leading-6 text-slate-300 transition hover:border-primary/30">
            {memory}
          </p>
        ))}
      </div>
    </GlassCard>
  );
}
