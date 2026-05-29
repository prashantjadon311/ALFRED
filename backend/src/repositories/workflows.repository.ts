import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { WorkflowDsl } from "../contracts/workflow-dsl.types";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface WorkflowDoc extends OwnedDoc { userId: ObjectId; projectId?: ObjectId; name: string; description?: string; workflowDsl: WorkflowDsl; maxIterations: number; maxTokens: number; maxCostUsd: number; status: string; version: number; }
@Injectable()
export class WorkflowsRepository extends BaseRepository<WorkflowDoc> { constructor(db: DatabaseService) { super(db, "workflows"); } }
