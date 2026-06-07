"use client";

import { Power, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflow-store";
import {
  WORKFLOW_CONDITION_TYPES,
  WORKFLOW_NODE_TYPES,
  type WorkflowEdgeCondition,
  type WorkflowNodeConfig,
  type WorkflowNodeType,
  type WorkflowSeverity
} from "@/types/workflow-dsl";

const agentTypes: WorkflowNodeType[] = ["ai_agent", "consensus", "critic", "resolver", "codex_prompt_generator"];
const executableTypes: WorkflowNodeType[] = [...agentTypes, "budget_gate", "human_approval", "final_output", "export"];
const severities: WorkflowSeverity[] = ["BLOCKER", "HIGH", "MEDIUM", "LOW"];
const taskTypes = ["software", "research", "planning", "mixed"];

function clampNumber(value: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{children}</span>;
}

export function NodePropertiesPanel({ className }: { className?: string }) {
  const workflowDsl = useWorkflowStore((state) => state.workflowDsl);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const updateEdge = useWorkflowStore((state) => state.updateEdge);
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected);
  const node = workflowDsl.nodes.find((item) => item.key === selectedNodeId);
  const edge = workflowDsl.edges.find((item) => item.key === selectedEdgeId);

  if (edge) {
    const conditionType = edge.condition?.type ?? "";
    const setCondition = (condition?: WorkflowEdgeCondition) => updateEdge(edge.key, { condition });
    const toggleSeverity = (severity: WorkflowSeverity) => {
      const current = edge.condition?.severityIn ?? [];
      const severityIn = current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity];
      setCondition({ type: "has_issue_severity", severityIn });
    };
    const toggleTaskType = (taskType: string) => {
      const current = edge.condition?.values ?? [];
      const values = current.includes(taskType) ? current.filter((item) => item !== taskType) : [...current, taskType];
      setCondition({ type: "task_type_in", values });
    };

    return (
      <aside className={cn("glass-panel flex min-h-0 flex-col rounded-panel p-4", className)}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Edge Properties</h2>
            <p className="text-sm text-muted">{edge.from} to {edge.to}</p>
          </div>
          <StatusBadge status="Active" />
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <label className="block">
            <FieldLabel>Condition</FieldLabel>
            <select
              className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
              value={conditionType}
              onChange={(event) => {
                const type = event.target.value as WorkflowEdgeCondition["type"];
                if (!type) setCondition(undefined);
                else if (type === "has_issue_severity") setCondition({ type, severityIn: ["BLOCKER", "HIGH"] });
                else if (type === "task_type_in") setCondition({ type, values: ["software"] });
                else setCondition({ type });
              }}
            >
              <option value="">No condition</option>
              {WORKFLOW_CONDITION_TYPES.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
            </select>
          </label>

          {conditionType === "has_issue_severity" ? (
            <div>
              <FieldLabel>Issue severities</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {severities.map((severity) => (
                  <label key={severity} className="flex items-center gap-2 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-2 text-sm text-slate-200">
                    <input type="checkbox" checked={edge.condition?.severityIn?.includes(severity) ?? false} onChange={() => toggleSeverity(severity)} />
                    {severity}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {conditionType === "task_type_in" ? (
            <div>
              <FieldLabel>Task types</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {taskTypes.map((taskType) => (
                  <label key={taskType} className="flex items-center gap-2 rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-2 text-sm capitalize text-slate-200">
                    <input type="checkbox" checked={edge.condition?.values?.includes(taskType) ?? false} onChange={() => toggleTaskType(taskType)} />
                    {taskType}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <Button
            className="w-full"
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              if (window.confirm(`Delete edge ${edge.key}?`)) deleteSelected();
            }}
          >
            Delete edge
          </Button>
        </div>
      </aside>
    );
  }

  if (!node) {
    return (
      <aside className={cn("glass-panel flex min-h-0 items-center justify-center rounded-panel p-4 text-center", className)}>
        <div>
          <h2 className="font-semibold text-white">Properties</h2>
          <p className="mt-2 text-sm text-muted">Select a node or edge to edit it.</p>
        </div>
      </aside>
    );
  }

  const config = node.config ?? {};
  const updateConfig = (patch: Partial<WorkflowNodeConfig>) => updateNode(node.key, { config: { ...config, ...patch } });
  const usesAgentFields = agentTypes.includes(node.type);
  const usesExecutionFields = executableTypes.includes(node.type);
  const enabled = config.enabled !== false;

  return (
    <aside className={cn("glass-panel flex min-h-0 flex-col rounded-panel p-4", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Node Properties</h2>
          <p className="text-sm text-muted">{node.key}</p>
        </div>
        <StatusBadge status={enabled ? "Active" : "Paused"} />
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <label className="block">
          <FieldLabel>Title</FieldLabel>
          <input
            className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
            value={node.title}
            onChange={(event) => updateNode(node.key, { title: event.target.value })}
          />
        </label>
        <label className="block">
          <FieldLabel>Node type</FieldLabel>
          <select
            className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
            value={node.type}
            onChange={(event) => updateNode(node.key, { type: event.target.value as WorkflowNodeType })}
          >
            {WORKFLOW_NODE_TYPES.map((type) => <option key={type} value={type}>{type.replace(/_/g, " ")}</option>)}
          </select>
        </label>

        {usesAgentFields ? (
          <>
            <label className="block">
              <FieldLabel>Agent role</FieldLabel>
              <input
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={node.agentRole ?? ""}
                onChange={(event) => updateNode(node.key, { agentRole: event.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Provider</FieldLabel>
                <input
                  className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                  value={node.providerPreference ?? ""}
                  onChange={(event) => updateNode(node.key, { providerPreference: event.target.value })}
                />
              </label>
              <label className="block">
                <FieldLabel>Model</FieldLabel>
                <input
                  className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                  value={node.modelPreference ?? ""}
                  onChange={(event) => updateNode(node.key, { modelPreference: event.target.value })}
                />
              </label>
            </div>
            <label className="block">
              <FieldLabel>Prompt template key</FieldLabel>
              <input
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={node.promptTemplateKey ?? ""}
                onChange={(event) => updateNode(node.key, { promptTemplateKey: event.target.value })}
              />
            </label>
            <label className="block">
              <FieldLabel>Inline system prompt</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white"
                value={String(config.inlineSystemPrompt ?? "")}
                onChange={(event) => updateConfig({ inlineSystemPrompt: event.target.value })}
              />
            </label>
          </>
        ) : null}

        {usesExecutionFields ? (
          <div className="grid grid-cols-2 gap-3">
            {usesAgentFields ? (
              <label>
                <span className="mb-1 block text-xs text-muted">Temperature</span>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                  value={Number(config.temperature ?? 0.4)}
                  onChange={(event) => updateConfig({ temperature: clampNumber(event.target.value, 0, 2) })}
                />
              </label>
            ) : null}
            <label>
              <span className="mb-1 block text-xs text-muted">Max tokens</span>
              <input
                type="number"
                min={1}
                max={200000}
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={Number(config.maxTokens ?? node.budget?.maxTokens ?? 8000)}
                onChange={(event) => updateConfig({ maxTokens: clampNumber(event.target.value, 1, 200000) })}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-muted">Budget tokens</span>
              <input
                type="number"
                min={1}
                max={200000}
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={node.budget?.maxTokens ?? 8000}
                onChange={(event) => updateNode(node.key, { budget: { ...node.budget, maxTokens: clampNumber(event.target.value, 1, 200000) } })}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-muted">Budget USD</span>
              <input
                type="number"
                min={0.01}
                max={10000}
                step={0.01}
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={node.budget?.maxCostUsd ?? 1}
                onChange={(event) => updateNode(node.key, { budget: { ...node.budget, maxCostUsd: clampNumber(event.target.value, 0.01, 10000) } })}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-muted">Retry count</span>
              <input
                type="number"
                min={0}
                max={10}
                className="h-10 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated px-3 text-sm text-white"
                value={Number(config.retryCount ?? 2)}
                onChange={(event) => updateConfig({ retryCount: Math.round(clampNumber(event.target.value, 0, 10)) })}
              />
            </label>
          </div>
        ) : null}

        {node.type === "human_approval" ? (
          <>
            <label className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
              <span className="text-sm font-medium text-slate-200">Approval required</span>
              <input
                type="checkbox"
                checked={config.approvalRequired !== false}
                onChange={(event) => updateConfig({ approvalRequired: event.target.checked })}
              />
            </label>
            <label className="block">
              <FieldLabel>Approval message</FieldLabel>
              <textarea
                className="min-h-24 w-full rounded-input border border-surface-darkBorder bg-surface-darkElevated p-3 text-sm leading-6 text-white"
                value={String(config.approvalMessage ?? "")}
                onChange={(event) => updateConfig({ approvalMessage: event.target.value })}
              />
            </label>
          </>
        ) : null}

        <div className="flex items-center justify-between rounded-card border border-surface-darkBorder bg-surface-darkElevated/60 p-3">
          <span className="text-sm font-medium text-slate-200">Node enabled</span>
          <Button size="sm" variant={enabled ? "success" : "secondary"} icon={<Power className="h-4 w-4" />} onClick={() => updateConfig({ enabled: !enabled })}>
            {enabled ? "Enabled" : "Disabled"}
          </Button>
        </div>
        <Button
          className="w-full"
          variant="danger"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => {
            if (window.confirm(`Delete ${node.title} and its connected edges?`)) deleteSelected();
          }}
        >
          Delete node
        </Button>
      </div>
    </aside>
  );
}
