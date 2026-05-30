"use client";

import { BrainCircuit, CirclePlus, GitMerge, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { CompareGrid } from "@/components/compare/CompareGrid";
import { compareResponses } from "@/lib/mocks/compare";
import { chatService } from "@/services/chat-service";
import { artifactService } from "@/services/artifact-service";

export default function ComparePage() {
  const [paneCount, setPaneCount] = useState(3);
  const [runId, setRunId] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const [notice, setNotice] = useState("");
  const [prompt, setPrompt] = useState("Design the safest agentic AI workflow for converting a raw product request into validated Codex implementation prompts.");
  const [apiResponses, setApiResponses] = useState<typeof compareResponses | null>(null);
  const visibleResponses = useMemo(
    () =>
      (apiResponses ?? compareResponses).slice(0, paneCount).map((response, index) => ({
        ...response,
        latency: Number((response.latency + runId * 0.1 + index * 0.03).toFixed(2)),
        tokens: response.tokens + runId * 73
      })),
    [apiResponses, paneCount, runId]
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
            <Button size="sm" variant="secondary" icon={<GitMerge className="h-4 w-4" />} onClick={async () => {
              await artifactService.createArtifact({ title: "Merged Compare Artifact", type: "markdown", content: visibleResponses.map((item) => `## ${item.model}\n${item.response}`).join("\n\n") });
              showNotice("Merged artifact created from selected model responses.");
            }}>
              Create merged artifact
            </Button>
            <Button size="sm" variant="primary" icon={<Send className="h-4 w-4" />} onClick={async () => {
              const models = visibleResponses.map((item) => ({ providerType: item.provider.toLowerCase().includes("gemini") ? "gemini" : item.provider.toLowerCase().includes("anthropic") ? "anthropic" : item.provider.toLowerCase().includes("ollama") ? "ollama" : "mock", modelName: item.model }));
              const results = await chatService.llmCompare(prompt, models) as any[];
              setApiResponses(results.map((item) => ({ model: item.model?.modelName ?? item.modelName ?? "Mock", provider: item.providerType ?? item.provider ?? item.model?.providerType ?? "mock", response: item.content ?? item.response, tokens: (item.inputTokens ?? 0) + (item.outputTokens ?? item.tokens ?? 0), cost: item.costUsd ?? item.cost ?? 0, latency: item.latencyMs ? item.latencyMs / 1000 : item.latency ?? 0 })) as typeof compareResponses);
              setRunId((id) => id + 1);
              showNotice("Compare run completed for visible panes.");
            }}>
              Run compare
            </Button>
          </div>
        </div>
        <textarea
          className="max-h-36 min-h-24 w-full resize-y rounded-card border border-surface-darkBorder bg-surface-darkElevated/70 p-3 text-sm leading-6 text-slate-100 placeholder:text-muted"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
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
