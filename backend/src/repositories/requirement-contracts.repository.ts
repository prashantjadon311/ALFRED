import { ConflictException, Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface RequirementContractDoc extends OwnedDoc {
  userId: ObjectId;
  projectId: ObjectId;
  originalRequirement: string;
  lockedGoal: string;
  taskType: "software" | "research" | "planning" | "mixed";
  nonNegotiables: string[];
  successCriteria: string[];
  outOfScope: string[];
  allowedChanges: string[];
  forbiddenChanges: string[];
  driftStatus: "stable" | "watch" | "drift_detected";
  driftScore: number;
  locked: boolean;
  lockedAt?: Date;
  version: number;
}

@Injectable()
export class RequirementContractsRepository extends BaseRepository<RequirementContractDoc> {
  constructor(db: DatabaseService) { super(db, "requirement_contracts"); }
  findCurrent(userId: ObjectId, projectId: ObjectId) {
    return this.collection().findOne({ userId, projectId, locked: true }, { sort: { version: -1 } });
  }
  async patchContract(id: ObjectId, userId: ObjectId, patch: Partial<RequirementContractDoc>) {
    const current = await this.findById(id, userId);
    if (current?.locked && ("originalRequirement" in patch || "lockedGoal" in patch)) {
      throw new ConflictException("Locked requirement originalRequirement and lockedGoal are immutable");
    }
    return this.updateById(id, userId, patch);
  }
}
