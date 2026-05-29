import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Db, Document, MongoClient } from "mongodb";
import { ensureMongoIndexes } from "./index-definitions";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client!: MongoClient;
  private database!: Db;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.client = new MongoClient(this.config.get<string>("uri") ?? "mongodb://localhost:27017/alfred");
    await this.client.connect();
    this.database = this.client.db(this.config.get<string>("dbName") ?? "alfred");
    this.logger.log("MongoDB connected");
    await this.ensureIndexes();
  }

  private async ensureIndexes() {
    try {
      await ensureMongoIndexes(this.database);
      this.logger.log("MongoDB indexes ensured");
    } catch (err) {
      this.logger.error("Index creation error (non-fatal):", err);
    }
  }

  db() {
    return this.database;
  }

  collection<T extends Document = any>(name: string) {
    return this.database.collection<T>(name);
  }

  async onModuleDestroy() {
    await this.client?.close();
  }
}
