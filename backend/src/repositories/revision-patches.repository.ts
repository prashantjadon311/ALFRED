import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface RevisionPatchDoc extends OwnedDoc { userId: ObjectId; workflowRunId: ObjectId; iteration: number; issueIds: ObjectId[]; patchSummary: string; beforeSnapshot?: unknown; afterSnapshot?: unknown; fixedByAgents: string[]; verificationStatus: string; createdAt: Date; }
@Injectable()
export class RevisionPatchesRepository extends BaseRepository<RevisionPatchDoc> { constructor(db: DatabaseService) { super(db, "revision_patches"); } }
