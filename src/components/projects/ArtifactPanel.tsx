import { FileArchive, FileCode2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Artifact } from "@/lib/types";

export function ArtifactPanel({ artifacts, onExport }: { artifacts: Artifact[]; onExport?: (artifact: Artifact) => void }) {
  return (
    <GlassCard>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <FileArchive className="h-5 w-5 text-primary-soft" /> Generated Artifacts
      </h2>
      <div className="mt-4 space-y-3">
        {!artifacts.length ? <EmptyState title="No artifacts yet" description="Generated specs, prompt bundles, and exports will appear here after a workflow run." /> : null}
        {artifacts.map((artifact) => (
          <div key={artifact.id} className="flex items-center justify-between gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 transition hover:-translate-y-0.5 hover:border-primary/35">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-button bg-primary/15 text-primary-soft">
                <FileCode2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{artifact.title}</p>
                <p className="text-xs text-muted">{artifact.type} · {artifact.createdAt.slice(0, 10)}</p>
              </div>
            </div>
            <button
              className="rounded-button px-2 py-1 text-sm font-medium text-primary-soft transition hover:bg-white/7 hover:text-white"
              onClick={() => onExport?.(artifact)}
              type="button"
            >
              Export
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
