import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const WORKFLOW_QUEUE = "workflow-execution";

@Injectable()
export class WorkflowQueue implements OnModuleDestroy {
  readonly queue: Queue;
  private readonly connection: IORedis;

  constructor(config: ConfigService) {
    this.connection = new IORedis(config.get<string>("url") ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
    this.queue = new Queue(WORKFLOW_QUEUE, { connection: this.connection });
  }

  addRun(workflowRunId: string, userId: string, jobId = workflowRunId) {
    return this.queue.add("run", { workflowRunId, userId }, { jobId, attempts: 1, removeOnComplete: 100, removeOnFail: 100 });
  }

  /** alias */
  enqueue(workflowRunId: string, userId: string) { return this.addRun(workflowRunId, userId); }

  enqueueResume(workflowRunId: string, userId: string) {
    return this.addRun(workflowRunId, userId, `${workflowRunId}:resume:${Date.now()}`);
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}

export { WorkflowQueue as WorkflowQueueService };
