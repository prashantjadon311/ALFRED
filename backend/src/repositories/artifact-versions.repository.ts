import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface ArtifactVersionDoc extends OwnedDoc { userId: ObjectId; artifactId: ObjectId; workflowRunId?: ObjectId; version: number; title: string; content: string; diffFromPrevious?: string; sourceExecutionId?: ObjectId; createdAt: Date; }
@Injectable()
export class ArtifactVersionsRepository extends BaseRepository<ArtifactVersionDoc> { constructor(db: DatabaseService) { super(db, "artifact_versions"); } }
