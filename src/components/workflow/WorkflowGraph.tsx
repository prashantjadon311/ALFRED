"use client";

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import { useMemo } from "react";
import type { AgentNode } from "@/lib/types";
import { getWorkflowNodePosition } from "@/lib/workflow-editor";
import { cn } from "@/lib/utils";
import type { WorkflowGraphEdge } from "@/services/workflow-service";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowNode } from "@/types/workflow-dsl";
import { AgentNodeCard } from "./AgentNodeCard";
import { WorkflowCanvasToolbar, type WorkflowToolbarActions } from "./WorkflowCanvasToolbar";

const nodeTypes = { agentNode: AgentNodeCard };

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

function dslNodeToAgent(node: WorkflowNode): AgentNode {
  return {
    id: node.key,
    title: node.title,
    provider: node.providerPreference ?? "A.L.F.R.E.D.",
    model: node.modelPreference ?? node.promptTemplateKey ?? node.type,
    role: node.agentRole ?? node.type.replace(/_/g, " "),
    status: "Pending",
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    latency: 0,
    systemPrompt: String(node.config?.inlineSystemPrompt ?? node.promptTemplateKey ?? "")
  };
}

function fallbackPosition(index: number) {
  return { x: (index % 4) * 330, y: Math.floor(index / 4) * 230 };
}

export function WorkflowGraph({
  compact = false,
  fill = false,
  editable = false,
  showFullScreenToggle = false,
  workflowNodes,
  workflowEdges,
  activeNodeId,
  toolbarActions
}: {
  compact?: boolean;
  fill?: boolean;
  editable?: boolean;
  showFullScreenToggle?: boolean;
  workflowNodes?: AgentNode[];
  workflowEdges?: WorkflowGraphEdge[];
  activeNodeId?: string;
  toolbarActions?: WorkflowToolbarActions;
}) {
  const workflowDsl = useWorkflowStore((state) => state.workflowDsl);
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const selectedEdgeId = useWorkflowStore((state) => state.selectedEdgeId);
  const pendingEdgeSourceId = useWorkflowStore((state) => state.pendingEdgeSourceId);
  const setSelectedNodeId = useWorkflowStore((state) => state.setSelectedNodeId);
  const setSelectedEdgeId = useWorkflowStore((state) => state.setSelectedEdgeId);
  const connectNodes = useWorkflowStore((state) => state.connectNodes);
  const setNodePosition = useWorkflowStore((state) => state.setNodePosition);

  const sourceNodes = workflowNodes ?? workflowDsl.nodes.map(dslNodeToAgent);
  const nodes: Node[] = useMemo(
    () =>
      sourceNodes.map((agent, index) => {
        const dslNode = workflowDsl.nodes.find((node) => node.key === agent.id);
        return {
          id: agent.id,
          type: "agentNode",
          position: dslNode ? getWorkflowNodePosition(dslNode, index) : fallbackPosition(index),
          data: { agent, selected: editable && selectedNodeId === agent.id }
        };
      }),
    [editable, selectedNodeId, sourceNodes, workflowDsl.nodes]
  );

  const sourceEdges = workflowEdges ?? workflowDsl.edges.map((edge) => ({
    id: edge.key,
    source: edge.from,
    target: edge.to,
    label: edge.condition?.type
  }));
  const edges: Edge[] = useMemo(
    () =>
      sourceEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        selected: editable && selectedEdgeId === edge.id,
        ...(edge.source === activeNodeId || edge.target === activeNodeId ? activeEdge : edgeBase)
      })),
    [activeNodeId, editable, selectedEdgeId, sourceEdges]
  );

  const handleConnect = (connection: Connection) => {
    if (editable && connection.source && connection.target) connectNodes(connection.source, connection.target);
  };

  return (
    <div
      className={cn(
        "relative min-w-[1120px] overflow-hidden rounded-panel border border-surface-darkBorder",
        fill ? "h-full min-h-[30rem]" : compact ? "h-[32rem]" : "h-[42rem]"
      )}
      style={{ background: "var(--workflow-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_18%,rgba(89,85,209,.16),transparent_24rem),radial-gradient(circle_at_82%_12%,rgba(34,197,94,.08),transparent_20rem)]" />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.25}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable
        deleteKeyCode={null}
        onConnect={handleConnect}
        onNodeClick={(_, node) => {
          if (!editable) return;
          if (pendingEdgeSourceId && pendingEdgeSourceId !== node.id) {
            connectNodes(pendingEdgeSourceId, node.id);
            return;
          }
          setSelectedNodeId(node.id);
        }}
        onEdgeClick={(_, edge) => {
          if (editable) setSelectedEdgeId(edge.id);
        }}
        onPaneClick={() => {
          if (editable) {
            setSelectedNodeId("");
            setSelectedEdgeId("");
          }
        }}
        onNodeDragStop={(_, node) => {
          if (editable) setNodePosition(node.id, node.position);
        }}
      >
        <WorkflowCanvasToolbar showFullScreenToggle={showFullScreenToggle} actions={editable ? toolbarActions : undefined} />
        <Background color="rgba(139,144,161,.24)" gap={22} />
        <MiniMap pannable zoomable nodeStrokeColor="var(--chart-primary)" nodeColor="var(--workflow-minimap-node)" maskColor="var(--workflow-minimap-mask)" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
