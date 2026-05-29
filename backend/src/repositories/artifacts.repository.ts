import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface ArtifactDoc extends OwnedDoc { userId: ObjectId; projectId: ObjectId; workflowRunId?: ObjectId; title: string; type: string; currentVersionId?: ObjectId; content: string; metadata?: Record<string, unknown>; }
@Injectable()
export class ArtifactsRepository extends BaseRepository<ArtifactDoc> { constructor(db: DatabaseService) { super(db, "artifacts"); } }
