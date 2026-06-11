import { Injectable } from "@nestjs/common";
import { ObjectId, OptionalUnlessRequiredId } from "mongodb";
import { DatabaseService } from "../database/database.service";

export interface PricingSnapshotDoc {
  _id?: ObjectId;
  providerType: string;
  modelName: string;
  currency: "USD";
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
  cachedInputUsdPerMTok?: number;
  cacheWriteInputUsdPerMTok?: number;
  reasoningUsdPerMTok?: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  source: string;
  createdAt: Date;
}

@Injectable()
export class PricingSnapshotsRepository {
  constructor(private readonly db: DatabaseService) {}

  collection() {
    return this.db.collection<PricingSnapshotDoc>("pricing_snapshots");
  }

  async create(doc: OptionalUnlessRequiredId<PricingSnapshotDoc>) {
    const result = await this.collection().insertOne(doc);
    return this.collection().findOne({ _id: result.insertedId });
  }

  findEffective(providerType: string, modelNames: string[], requestedAt: Date) {
    return this.collection().find({
      providerType,
      modelName: { $in: modelNames },
      effectiveFrom: { $lte: requestedAt },
      $or: [
        { effectiveTo: { $exists: false } },
        { effectiveTo: null },
        { effectiveTo: { $gt: requestedAt } }
      ]
    } as any).sort({ effectiveFrom: -1, createdAt: -1 }).toArray();
  }
}
