"use client";

import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useMemo } from "react";
import { agentNodes } from "@/lib/mock-data";
import type { AgentNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { WorkflowGraphEdge } from "@/services/workflow-service";
import { useWorkflowStore } from "@/store/workflow-store";
import { AgentNodeCard } from "./AgentNodeCard";
import { WorkflowCanvasToolbar } from "./WorkflowCanvasToolbar";

const nodeTypes = { agentNode: AgentNodeCard };

const positions: Record<string, { x: number; y: number }> = {
  "user-requirement": { x: 0, y: 0 },
  "requirement-lock": { x: 330, y: 0 },
  "chatgpt-designer": { x: 660, y: -150 },
  "gemini-architect": { x: 660, y: 120 },
  "consensus-builder": { x: 990, y: 0 },
  "claude-critic": { x: 1320, y: 0 },
  "issue-resolver": { x: 1650, y: -150 },
  "budget-manager": { x: 1650, y: 120 },
  "human-approval": { x: 1980, y: 0 },
  "final-output": { x: 2310, y: 0 },
  "codex-prompt-generator": { x: 2640, y: -150 },
  "export-artifact": { x: 2640, y: 120 }
};

function nodePosition(id: string) {
  return positions[id] ?? positions[id.replace(/_/g, "-")] ?? { x: 0, y: 0 };
}

const edgeBase = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#8B90A1" },
  style: { strokeWidth: 2, stroke: "rgba(139,144,161,.78)" }
};

const activeEdge = {
  ...edgeBase,
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#5955D1" },
  style: { strokeWidth: 2.5, stroke: "#5955D1" }
};

const baseEdges: Edge[] = [
  { id: "e1", source: "user-requirement", target: "requirement-lock", ...activeEdge },
  { id: "e2", source: "requirement-lock", target: "chatgpt-designer", ...activeEdge },
  { id: "e3", source: "requirement-lock", target: "gemini-architect", ...activeEdge },
  { id: "e4", source: "chatgpt-designer", target: "consensus-builder", ...edgeBase },
  { id: "e5", source: "gemini-architect", target: "consensus-builder", ...edgeBase },
  { id: "e6", source: "consensus-builder", target: "claude-critic", ...edgeBase },
  { id: "e7", source: "claude-critic", target: "issue-resolver", label: "revise", ...edgeBase },
  { id: "e8", source: "issue-resolver", target: "claude-critic", label: "re-audit", ...edgeBase },
  { id: "e9", source: "claude-critic", target: "budget-manager", ...edgeBase },
  { id: "e10", source: "budget-manager", target: "human-approval", ...edgeBase },
  { id: "e11", source: "human-approval", target: "final-output", ...edgeBase },
  { id: "e12", source: "final-output", target: "codex-prompt-generator", ...edgeBase },
  { id: "e13", source: "final-output", target: "export-artifact", ...edgeBase }
];

export function WorkflowGraph({
  compact = false,
  fill = false,
  showFullScreenToggle = false,
  workflowNodes,
  workflowEdges,
  activeNodeId
}: {
  compact?: boolean;
  fill?: boolean;
  showFullScreenToggle?: boolean;
  workflowNodes?: AgentNode[];
  workflowEdges?: WorkflowGraphEdge[];
  activeNodeId?: string;
}) {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const sourceNodes = workflowNodes?.length ? workflowNodes : agentNodes;
  const nodes: Node[] = useMemo(
    () =>
      sourceNodes.map((agent) => ({
        id: agent.id,
        type: "agentNode",
        position: nodePosition(agent.id),
        data: { agent, selected: selectedNodeId === agent.id }
      })),
    [selectedNodeId, sourceNodes]
  );
  const edges: Edge[] = useMemo(
    () =>
      workflowEdges?.length
        ? workflowEdges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            ...(edge.source === activeNodeId || edge.target === activeNodeId ? activeEdge : edgeBase)
          }))
        : baseEdges,
    [activeNodeId, workflowEdges]
  );

  return (
    <div
      className={cn(
        "relative min-w-[1120px] overflow-hidden rounded-panel border border-surface-darkBorder",
        fill ? "h-full min-h-[30rem]" : compact ? "h-[32rem]" : "h-[42rem]"
      )}
      style={{ background: "var(--workflow-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_18%,rgba(89,85,209,.16),transparent_24rem),radial-gradient(circle_at_82%_12%,rgba(34,197,94,.08),transparent_20rem)]" />
      <WorkflowCanvasToolbar showFullScreenToggle={showFullScreenToggle} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.25}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
      >
        <Background color="rgba(139,144,161,.24)" gap={22} />
        <MiniMap pannable zoomable nodeStrokeColor="var(--chart-primary)" nodeColor="var(--workflow-minimap-node)" maskColor="var(--workflow-minimap-mask)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
