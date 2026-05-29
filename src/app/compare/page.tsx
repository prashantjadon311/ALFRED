"use client";

import { BrainCircuit, CirclePlus, GitMerge, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { CompareGrid } from "@/components/compare/CompareGrid";
import { compareResponses } from "@/lib/mock-data";

export default function ComparePage() {
  const [paneCount, setPaneCount] = useState(3);
  const [runId, setRunId] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const [notice, setNotice] = useState("");
  const visibleResponses = useMemo(
    () =>
      compareResponses.slice(0, paneCount).map((response, index) => ({
        ...response,
        latency: Number((response.latency + runId * 0.1 + index * 0.03).toFixed(2)),
        tokens: response.tokens + runId * 73
      })),
    [paneCount, runId]
  );

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" size="sm" icon={<CirclePlus className="h-4 w-4" />} onClick={() => setPaneCount((count) => Math.min(compareResponses.length, count + 1))} disabled={paneCount >= compareResponses.length}>
          Add pane
        </Button>
        <Button variant="secondary" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setPaneCount((count) => Math.max(2, count - 1))} disabled={paneCount <= 2}>
          Remove pane
        </Button>
      </div>

      <GlassCard className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
            <BrainCircuit className="h-4 w-4" /> Synced input composer
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<GitMerge className="h-4 w-4" />} onClick={() => showNotice("Merged artifact created locally from the selected model responses.")}>
              Create merged artifact
            </Button>
            <Button size="sm" variant="primary" icon={<Send className="h-4 w-4" />} onClick={() => { setRunId((id) => id + 1); showNotice("Mock compare run completed for visible panes."); }}>
              Run compare
            </Button>
          </div>
        </div>
        <textarea
          className="max-h-36 min-h-24 w-full resize-y rounded-card border border-surface-darkBorder bg-surface-darkElevated/70 p-3 text-sm leading-6 text-slate-100 placeholder:text-muted"
          defaultValue="Design the safest agentic AI workflow for converting a raw product request into validated Codex implementation prompts."
        />
      </GlassCard>

      {notice ? <p className="rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{notice}</p> : null}

      <CompareGrid
        responses={visibleResponses}
        selectedKey={selectedKey}
        onPick={(item) => {
          setSelectedKey(`${item.provider}-${item.model}`);
          showNotice(`${item.model} marked as best response.`);
        }}
        onRegenerate={(item) => showNotice(`${item.model} regenerated locally.`)}
      />
    </div>
  );
}
