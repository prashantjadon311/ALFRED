import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowEventType } from "../contracts/workflow-event.types";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface WorkflowEventDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; eventType: WorkflowEventType; nodeKey?: string | null; edgeKey?: string | null; message?: string; data: Record<string, unknown>; createdAt: Date; }
@Injectable()
export class WorkflowEventsRepository extends BaseRepository<WorkflowEventDoc> {
  constructor(db: DatabaseService) { super(db, "workflow_events"); }
  recent(userId: ObjectId, workflowRunId: ObjectId, limit = 200) { return this.collection().find({ userId, workflowRunId }).sort({ createdAt: 1 }).limit(limit).toArray(); }
}
