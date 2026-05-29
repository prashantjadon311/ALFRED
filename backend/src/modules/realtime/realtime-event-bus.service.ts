import { Injectable } from "@nestjs/common";
import { Subject } from "rxjs";
import { filter } from "rxjs/operators";
import { WorkflowEventPayload } from "../../contracts/workflow-event.types";

@Injectable()
export class RealtimeEventBus {
  private readonly subject = new Subject<WorkflowEventPayload>();
  publish(event: WorkflowEventPayload) { this.subject.next(event); }
  stream(workflowRunId: string) { return this.subject.asObservable().pipe(filter((event) => event.workflowRunId === workflowRunId)); }
}
