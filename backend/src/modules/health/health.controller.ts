import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import IORedis from "ioredis";
import { ok } from "../../contracts/api-response.types";
import { DatabaseService } from "../../database/database.service";

@Controller("health")
export class HealthController {
  constructor(private readonly db: DatabaseService, private readonly config: ConfigService) {}

  @Get()
  async health() {
    const mongodb = await this.mongoStatus();
    const redis = await this.redisStatus();
    return ok({
      status: mongodb === "up" && redis === "up" ? "ok" : "degraded",
      services: { mongodb, redis, api: "up" },
      timestamp: new Date().toISOString()
    });
  }

  @Get("ready")
  async ready() {
    const mongodb = await this.mongoStatus();
    const redis = await this.redisStatus();
    return ok({ ready: mongodb === "up" && redis === "up", services: { mongodb, redis } });
  }

  @Get("live")
  live() {
    return ok({ live: true, timestamp: new Date().toISOString() });
  }

  private async mongoStatus() {
    try {
      await this.db.db().command({ ping: 1 });
      return "up";
    } catch {
      return "down";
    }
  }

  private async redisStatus() {
    const redis = new IORedis(this.config.get<string>("url") ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true
    });
    try {
      await redis.connect();
      return (await redis.ping()) === "PONG" ? "up" : "down";
    } catch {
      return "down";
    } finally {
      redis.disconnect();
    }
  }
}
