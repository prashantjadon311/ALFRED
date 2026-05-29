import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface ModelProviderDoc extends OwnedDoc {
  name: string; providerType: string; baseUrl?: string; encryptedApiKey?: string; maskedApiKey?: string; enabled: boolean; healthStatus: string; config?: Record<string, unknown>;
}
@Injectable()
export class ModelProvidersRepository extends BaseRepository<ModelProviderDoc> {
  constructor(db: DatabaseService) { super(db, "model_providers"); }
  safeProjection = { encryptedApiKey: 0 };
}
