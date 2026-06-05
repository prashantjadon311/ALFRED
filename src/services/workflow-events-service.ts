import { isApiMode } from "@/lib/api-client";
import { workflowService, type WorkflowEventRecord } from "./workflow-service";

type WorkflowEventHandlers = {
  onEvent?: (event: WorkflowEventRecord) => void;
  onError?: (error: unknown) => void;
};

export function subscribeToWorkflowRunEvents(runId: string, handlers: WorkflowEventHandlers) {
  if (!isApiMode() || typeof window === "undefined") {
    return { unsubscribe: () => undefined };
  }

  let stopped = false;
  const seen = new Set<string>();

  const eventKey = (event: WorkflowEventRecord) =>
    event.id ?? `${event.timestamp}:${event.eventType}:${event.nodeKey ?? ""}:${event.edgeKey ?? ""}`;

  const poll = async () => {
    try {
      const events = await workflowService.getWorkflowRunEvents(runId);
      for (const event of events) {
        const key = eventKey(event);
        if (seen.has(key)) continue;
        seen.add(key);
        handlers.onEvent?.(event);
      }
    } catch (error) {
      handlers.onError?.(error);
    }
  };

  void poll();
  const timer = window.setInterval(() => {
    if (!stopped) void poll();
  }, 4000);

  return {
    unsubscribe: () => {
      stopped = true;
      window.clearInterval(timer);
    }
  };
}
