"use client";

import { CheckCircle2, Pause, Play, Square, UserCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BudgetMeter } from "@/components/workflow/BudgetMeter";
import { TokenCostMeter } from "@/components/workflow/TokenCostMeter";
import { isApiMode } from "@/lib/api-client";
import { critiqueIssues } from "@/lib/mock-data";
import type { WorkflowRun } from "@/lib/types";
import { formatCurrency, formatTokens } from "@/lib/utils";
import { subscribeToWorkflowRunEvents } from "@/services/workflow-events-service";
import { workflowService, type WorkflowArtifactRecord, type WorkflowEventRecord, type WorkflowGraphState, type WorkflowIssueRecord } from "@/services/workflow-service";
import { useWorkflowStore } from "@/store/workflow-store";

const WorkflowGraph = dynamic(() => import("@/components/workflow/WorkflowGraph").then((mod) => mod.WorkflowGraph), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-panel border border-surface-darkBorder bg-surface-darkElevated/50" />
});

const mockLogs = [
  "14:18:02 requirement-lock completed: contract hash mock-8ad2",
  "14:21:40 chatgpt-designer emitted UI architecture proposal",
  "14:28:11 gemini-architect started bounded-context review",
  "14:31:56 budget-manager checkpoint: workflow spend at 51%",
  "14:36:03 claude-critic queued for drift and severity audit"
];

const mockMessages = [
  ["Requirement Lock", "Original motive locked. Non-negotiables and out-of-scope items have been extracted."],
  ["ChatGPT Designer", "Recommended a workflow-first command center with chat and compare as capture surfaces."],
  ["Gemini Architect", "Validating route structure, store slices, and service abstractions for future Nest.js handoff."],
  ["Claude Critic", "Pending strict audit for drift, missing states, and acceptance coverage."]
];

function labelFromKey(value?: string | null) {
  return (value ?? "workflow").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEventLog(event: WorkflowEventRecord) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const actor = event.nodeKey ? `${event.nodeKey} ` : "";
  return `${time} ${actor}${event.eventType}${event.message ? `: ${event.message}` : ""}`;
}

function eventKey(event: WorkflowEventRecord) {
  return event.id ?? `${event.timestamp}:${event.eventType}:${event.nodeKey ?? ""}:${event.edgeKey ?? ""}`;
}

function mergeEvent(events: WorkflowEventRecord[], event: WorkflowEventRecord) {
  if (events.some((item) => eventKey(item) === eventKey(event))) return events;
  return [...events, event].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function canPause(status?: string) {
  return status === "Running";
}

function canResume(status?: string) {
  return status === "Paused";
}

function canStop(status?: string) {
  return status === "Running" || status === "Paused";
}

export default function WorkflowRunPage({ params }: { params: { id: string } }) {
  const workflows = useWorkflowStore((state) => state.workflows);
  const pauseWorkflow = useWorkflowStore((state) => state.pauseWorkflowMock);
  const resumeWorkflow = useWorkflowStore((state) => state.runWorkflowMock);
  const stopWorkflow = useWorkflowStore((state) => state.stopWorkflowMock);
  const localWorkflow = workflows.find((item) => item.id === params.id);
  const apiMode = isApiMode();
  const [apiRun, setApiRun] = useState<WorkflowRun | null>(null);
  const [graphState, setGraphState] = useState<WorkflowGraphState | null>(null);
  const [runLogs, setRunLogs] = useState<WorkflowEventRecord[]>([]);
  const [runIssues, setRunIssues] = useState<WorkflowIssueRecord[]>([]);
  const [runArtifacts, setRunArtifacts] = useState<WorkflowArtifactRecord[]>([]);
  const [apiError, setApiError] = useState("");
  const [busyAction, setBusyAction] = useState<"pause" | "resume" | "stop" | null>(null);
  const [apiChecked, setApiChecked] = useState(!apiMode);
  const workflow = apiMode ? apiRun : localWorkflow;

  const loadLiveState = useCallback(async () => {
    const [run, graph, logs, issues, artifacts] = await Promise.all([
      workflowService.getWorkflowRun(params.id),
      workflowService.getWorkflowRunGraphState(params.id),
      workflowService.getWorkflowRunLogs(params.id),
      workflowService.getWorkflowRunIssues(params.id),
      workflowService.getWorkflowRunArtifacts(params.id)
    ]);
    setApiRun(run);
    setGraphState(graph);
    setRunLogs(logs);
    setRunIssues(issues);
    setRunArtifacts(artifacts);
    setApiError("");
  }, [params.id]);

  useEffect(() => {
    if (!apiMode) return;
    let mounted = true;
    loadLiveState()
      .catch((error) => {
        if (mounted) setApiError(error instanceof Error ? error.message : "Unable to load workflow run.");
      })
      .finally(() => {
        if (mounted) setApiChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, [apiMode, loadLiveState]);

  useEffect(() => {
    if (!apiMode || !apiChecked || !apiRun || apiRun.status !== "Running") return;
    const subscription = subscribeToWorkflowRunEvents(params.id, {
      onEvent: (event) => {
        setRunLogs((current) => mergeEvent(current, event));
        if (event.eventType.startsWith("run.") || event.eventType === "node.status.changed" || event.eventType === "artifact.created" || event.eventType === "critique.issue.created") {
          void loadLiveState();
        }
      },
      onError: (error) => setApiError(error instanceof Error ? error.message : "Unable to refresh workflow events.")
    });
    return () => subscription.unsubscribe();
  }, [apiChecked, apiMode, apiRun, loadLiveState, params.id]);

  const displayedMessages = useMemo(
    () =>
      apiMode
        ? runLogs
            .filter((event) => event.eventType === "agent.message.created")
            .slice(-4)
            .map((event) => [labelFromKey(event.nodeKey), String(event.data.content ?? event.message ?? event.eventType)])
        : mockMessages,
    [apiMode, runLogs]
  );
  const displayedLogs = apiMode ? runLogs.map(formatEventLog) : mockLogs;
  const displayedIssues = apiMode ? runIssues : critiqueIssues;

  const handlePause = async () => {
    if (!workflow) return;
    if (!apiMode) return pauseWorkflow(workflow.id);
    setBusyAction("pause");
    try {
      setApiRun(await workflowService.pauseWorkflowRun(params.id));
      await loadLiveState();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to pause workflow run.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResume = async () => {
    if (!workflow) return;
    if (!apiMode) return resumeWorkflow(workflow.id);
    setBusyAction("resume");
    try {
      setApiRun(await workflowService.resumeWorkflowRun(params.id));
      await loadLiveState();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to resume workflow run.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleStop = async () => {
    if (!workflow) return;
    if (!apiMode) return stopWorkflow(workflow.id);
    setBusyAction("stop");
    try {
      setApiRun(await workflowService.stopWorkflowRun(params.id));
      await loadLiveState();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to stop workflow run.");
    } finally {
      setBusyAction(null);
    }
  };

  if (!workflow && !apiChecked) {
    return <div className="h-[360px] animate-pulse rounded-panel border border-surface-darkBorder bg-surface-darkElevated/50" />;
  }

  if (!workflow && apiMode) {
    return (
      <GlassCard>
        <h1 className="text-lg font-semibold text-white">Workflow run not found</h1>
        <p className="mt-2 text-sm text-muted">{apiError || "The run is unavailable or outside the active workspace."}</p>
      </GlassCard>
    );
  }

  if (!workflow) notFound();

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{workflow.name}</p>
          <p className="truncate text-xs text-muted">Iteration {workflow.iteration} of {workflow.maxIterations} · {workflow.currentNodeId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={workflow.status} />
          <Button size="sm" variant="secondary" icon={<Pause className="h-4 w-4" />} disabled={busyAction !== null || !canPause(workflow.status)} onClick={handlePause}>{busyAction === "pause" ? "Pausing" : "Pause"}</Button>
          <Button size="sm" variant="danger" icon={<Square className="h-4 w-4" />} disabled={busyAction !== null || !canStop(workflow.status)} onClick={handleStop}>{busyAction === "stop" ? "Stopping" : "Stop"}</Button>
          <Button size="sm" variant="primary" icon={<Play className="h-4 w-4" />} disabled={busyAction !== null || !canResume(workflow.status)} onClick={handleResume}>{busyAction === "resume" ? "Resuming" : "Resume"}</Button>
        </div>
      </div>

      {apiError ? <p className="mb-4 rounded-card border border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger">{apiError}</p> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard>
          <p className="text-sm text-muted">Iteration count</p>
          <p className="mt-2 text-2xl font-bold text-white">{workflow.iteration}/{workflow.maxIterations}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Token meter</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatTokens(workflow.totalTokens)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Cost meter</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(workflow.totalCost)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-muted">Current active node</p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{workflow.currentNodeId}</p>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 overflow-x-auto">
          <WorkflowGraph compact workflowNodes={graphState?.nodes} workflowEdges={graphState?.edges} activeNodeId={graphState?.activeNodeId} />
        </div>
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Claude Verdict</h2>
            <p className="mt-3 rounded-card border border-warning/25 bg-warning/10 p-3 text-sm leading-6 text-slate-200">{workflow.claudeVerdict}</p>
          </GlassCard>
          <GlassCard>
            <h2 className="text-lg font-semibold text-white">Meters</h2>
            <div className="mt-4 space-y-4">
              <BudgetMeter used={workflow.totalCost} limit={75} />
              <TokenCostMeter tokens={workflow.totalTokens} cost={workflow.totalCost} />
            </div>
          </GlassCard>
          <GlassCard>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserCheck className="h-5 w-5 text-warning" /> Human Approval
            </h2>
            <p className="mt-2 text-sm text-muted">Checkpoint requires approval before final artifact export.</p>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" variant="success" icon={<CheckCircle2 className="h-4 w-4" />}>Approve</Button>
              <Button className="flex-1" variant="secondary">Request changes</Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Agent Messages</h2>
          <div className="mt-4 space-y-3">
            {displayedMessages.map(([agent, text]) => (
              <div key={agent} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <p className="font-semibold text-white">{agent}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
              </div>
            ))}
            {displayedMessages.length === 0 ? <p className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 text-sm text-muted">No agent messages recorded yet.</p> : null}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Execution Logs</h2>
          <div className="mt-4 space-y-2 font-mono text-xs text-slate-300">
            {displayedLogs.map((log) => (
              <p key={log} className="rounded-button bg-black/20 px-3 py-2">{log}</p>
            ))}
            {displayedLogs.length === 0 ? <p className="rounded-button bg-black/20 px-3 py-2">No events recorded yet.</p> : null}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-semibold text-white">Issues by Severity</h2>
          <div className="mt-4 space-y-3">
            {displayedIssues.map((issue) => (
              <div key={issue.id} className="flex items-center justify-between gap-3 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                <span className="text-sm text-slate-300">{issue.title}</span>
                <StatusBadge status={issue.severity} />
              </div>
            ))}
            {displayedIssues.length === 0 ? <p className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3 text-sm text-muted">No critique issues recorded.</p> : null}
          </div>
          {apiMode ? (
            <div className="mt-5 border-t border-surface-darkBorder pt-4">
              <h3 className="text-sm font-semibold text-white">Artifacts</h3>
              <div className="mt-3 space-y-2">
                {runArtifacts.map((artifact) => (
                  <div key={artifact.id} className="rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
                    <p className="text-sm font-semibold text-white">{artifact.title}</p>
                    <p className="mt-1 text-xs text-muted">{artifact.type}</p>
                  </div>
                ))}
                {runArtifacts.length === 0 ? <p className="text-sm text-muted">No artifacts created yet.</p> : null}
              </div>
            </div>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
