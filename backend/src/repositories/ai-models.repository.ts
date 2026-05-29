import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface AiModelDoc extends OwnedDoc {
  providerId: ObjectId; providerType: string; name: string; displayName: string; contextWindow: number; inputCostPer1k: number; outputCostPer1k: number; latencyClass: string; qualityClass: string; enabled: boolean; defaultRole: string; metadata?: Record<string, unknown>;
}
@Injectable()
export class AiModelsRepository extends BaseRepository<AiModelDoc> {
  constructor(db: DatabaseService) { super(db, "ai_models"); }
}
