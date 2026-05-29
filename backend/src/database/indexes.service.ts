import { Injectable } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { ensureMongoIndexes } from "./index-definitions";

/** Indexes are created by DatabaseService.onModuleInit() after connection.
 *  This class is kept for the standalone `npm run indexes` CLI script. */
@Injectable()
export class IndexesService {
  constructor(private readonly db: DatabaseService) {}

  async createIndexes() {
    await ensureMongoIndexes(this.db.db());
  }
}
