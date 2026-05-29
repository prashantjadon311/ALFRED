import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { randomUUID } from "crypto";
import { WorkflowOrchestratorService } from "../orchestrator/workflow-orchestrator.service";
import { WORKFLOW_QUEUE } from "./workflow.queue";

@Injectable()
export class WorkflowProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker;
  private connection?: IORedis;
  constructor(private readonly config: ConfigService, private readonly orchestrator: WorkflowOrchestratorService) {}

  onModuleInit() {
    this.connection = new IORedis(this.config.get<string>("url") ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
    this.worker = new Worker(
      WORKFLOW_QUEUE,
      async (job) => {
        const workflowRunId = String(job.data.workflowRunId);
        const lockKey = `workflow-run-lock:${workflowRunId}`;
        const lockToken = randomUUID();
        const acquired = await this.connection!.set(lockKey, lockToken, "EX", 900, "NX");
        if (acquired !== "OK") return { skipped: true, reason: "workflow_run_locked" };

        try {
          return await this.orchestrator.processRun(workflowRunId, String(job.data.userId));
        } finally {
          await this.connection!.eval(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            1,
            lockKey,
            lockToken
          );
        }
      },
      { connection: this.connection, concurrency: 2 }
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }
}
