export type WorkflowEventType =
  | "run.queued" | "run.started" | "run.running" | "run.paused" | "run.resumed" | "run.stopped" | "run.completed" | "run.failed"
  | "run.needs_human_review" | "workflow.drift_detected" | "workflow.loop.started" | "workflow.loop.completed"
  | "node.status.changed" | "edge.traversed" | "agent.execution.started" | "agent.execution.completed" | "agent.execution.failed"
  | "agent.message.created" | "agent.decision.created" | "critique.issue.created" | "critique.issues_found"
  | "revision.patch.created" | "budget.snapshot.updated" | "budget.warning" | "budget.exceeded"
  | "approval.required" | "approval.resolved" | "artifact.created" | "artifact.version.created";

export interface WorkflowEventPayload {
  eventType: WorkflowEventType;
  workflowRunId: string;
  projectId?: string;
  nodeKey?: string | null;
  edgeKey?: string | null;
  timestamp: string;
  message?: string;
  data: Record<string, unknown>;
}
