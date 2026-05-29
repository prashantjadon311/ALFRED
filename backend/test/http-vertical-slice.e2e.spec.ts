import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test as NestTest } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import request from "supertest";
import type { Test as SupertestRequest } from "supertest";
import IORedis from "ioredis";
import { ObjectId } from "mongodb";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import { DatabaseService } from "../src/database/database.service";

const redisUrl = "redis://localhost:6379/15";
const testDbName = `alfred_e2e_${Date.now()}`;
const redisOptions = { maxRetriesPerRequest: null, connectTimeout: 1500, lazyConnect: true, retryStrategy: () => null };

async function createTestRedis() {
  const redis = new IORedis(redisUrl, redisOptions);
  await redis.connect();
  return redis;
}

describe("A.L.F.R.E.D. HTTP vertical slice", () => {
  let app: INestApplication;
  let db: DatabaseService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = "mongodb://localhost:27017/alfred";
    process.env.MONGODB_DB_NAME = testDbName;
    process.env.REDIS_URL = redisUrl;
    process.env.JWT_ACCESS_SECRET = "test_access_secret";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
    process.env.LLM_MOCK_MODE = "true";
    process.env.LOG_LEVEL = "silent";

    const redis = await createTestRedis();
    await redis.flushdb();
    await redis.quit();

    const moduleRef = await NestTest.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ logger: false }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(DatabaseService);
  }, 30000);

  afterAll(async () => {
    if (db) await db.db().dropDatabase();
    if (app) await app.close();

    try {
      const redis = await createTestRedis();
      await redis.flushdb();
      await redis.quit();
    } catch {
      // If infrastructure is already gone, teardown should not keep Jest alive.
    }
  }, 30000);

  it("protects private routes and masks/encrypts provider API keys", async () => {
    await request(app.getHttpServer()).get("/projects").expect(401).expect(({ body }) => {
      expect(body.error.requestId).toBeTruthy();
    });

    const email = `release-${Date.now()}@alfred.local`;
    const auth = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: "Release Auditor", email, password: "password123" })
      .expect(201);

    accessToken = auth.body.data.accessToken;
    userId = auth.body.data.user.id;
    expect(accessToken).toBeTruthy();
    expect(userId).toBeTruthy();
    expect(JSON.stringify(auth.body.data.user)).not.toContain("passwordHash");

    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.email).toBe(email);
        expect(JSON.stringify(body)).not.toContain("refreshTokenHash");
      });

    const rawApiKey = "sk-test-secret-1234567890";
    const provider = await request(app.getHttpServer())
      .post("/model-providers")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "OpenAI Release Test", providerType: "openai", apiKey: rawApiKey })
      .expect(201);

    expect(provider.body.data.maskedApiKey).toBeTruthy();
    expect(JSON.stringify(provider.body)).not.toContain(rawApiKey);
    expect(JSON.stringify(provider.body)).not.toContain("encryptedApiKey");

    const storedProvider = await db.db().collection("model_providers").findOne({ _id: new ObjectId(provider.body.data.id) });
    expect(storedProvider?.encryptedApiKey).toBeTruthy();
    expect(storedProvider?.encryptedApiKey).not.toBe(rawApiKey);
    expect(storedProvider?.maskedApiKey).toBe(provider.body.data.maskedApiKey);
  }, 30000);

  it("runs the real mock-mode workflow through BullMQ and persists graph, artifacts, issues, and usage", async () => {
    const project = await authed()
      .post("/projects")
      .send({ name: "A.L.F.R.E.D. Backend Release Slice", description: "End-to-end workflow execution audit.", type: "software" })
      .expect(201);
    const projectId = project.body.data.id;

    const contract = await authed()
      .post(`/projects/${projectId}/requirement-contracts`)
      .send({
        originalRequirement: "Build an agentic AI platform where ChatGPT and Gemini collaborate, Claude critiques, and final Codex prompts are generated.",
        lockedGoal: "Build the A.L.F.R.E.D. backend brain with requirement locking, multi-agent orchestration, Claude critique, artifacts, and Codex prompts.",
        taskType: "software",
        nonNegotiables: ["Use mock LLM mode by default", "Persist workflow events", "Do not expose API keys"],
        successCriteria: ["Workflow completes", "Claude issue is resolved", "Codex prompt bundle is produced"],
        forbiddenChanges: ["Change the product into a stock/trading platform"]
      })
      .expect(201);

    await authed()
      .patch(`/requirement-contracts/${contract.body.data.id}`)
      .send({ lockedGoal: "Replace the locked goal with a different product direction." })
      .expect(409);

    const workflow = await authed()
      .post("/workflows")
      .send({
        name: "Default Multi-Agent Product Design Loop",
        description: "Default A.L.F.R.E.D. workflow created without supplying DSL.",
        projectId,
        maxIterations: 3,
        maxTokens: 100000,
        maxCostUsd: 5
      })
      .expect(201);
    expect(workflow.body.data.workflowDsl.nodes.map((node: { key: string }) => node.key)).toEqual(
      expect.arrayContaining(["requirement_lock", "chatgpt_designer", "gemini_architect", "consensus_builder", "claude_critic", "issue_resolver", "final_output", "codex_prompt_generator"])
    );

    await authed().post(`/workflows/${workflow.body.data.id}/validate`).send({}).expect(201).expect(({ body }) => {
      expect(body.data.valid).toBe(true);
    });

    const runResponse = await authed().post(`/workflows/${workflow.body.data.id}/run`).send({ projectId }).expect(201);
    const workflowRunId = runResponse.body.data.id;
    expect(runResponse.body.data.status).toBe("queued");

    const run = await waitForRun(workflowRunId, "completed");
    expect(run.status).toBe("completed");
    expect(run.totalInputTokens).toBeGreaterThan(0);
    expect(run.totalOutputTokens).toBeGreaterThan(0);
    expect(run.totalCostUsd).toBeGreaterThan(0);

    const logs = await authed().get(`/workflow-runs/${workflowRunId}/logs?limit=500`).expect(200);
    const eventTypes = logs.body.data.map((event: { eventType: string }) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining([
      "run.queued",
      "run.running",
      "node.status.changed",
      "critique.issue.created",
      "revision.patch.created",
      "artifact.created",
      "artifact.version.created",
      "run.completed"
    ]));
    for (const nodeKey of ["chatgpt_designer", "gemini_architect", "consensus_builder", "claude_critic"]) {
      expect(logs.body.data.some((event: { eventType: string; nodeKey?: string }) => event.eventType === "node.status.changed" && event.nodeKey === nodeKey)).toBe(true);
    }

    const issues = await authed().get(`/workflow-runs/${workflowRunId}/issues`).expect(200);
    expect(issues.body.data.some((issue: { severity: string; sourceAgent: string }) => issue.severity === "HIGH" && issue.sourceAgent === "claude_critic")).toBe(true);

    const artifacts = await authed().get(`/workflow-runs/${workflowRunId}/artifacts`).expect(200);
    const artifactTypes = artifacts.body.data.map((artifact: { type: string }) => artifact.type);
    expect(artifactTypes).toEqual(expect.arrayContaining(["software_plan", "codex_prompt_bundle"]));

    const codexArtifact = artifacts.body.data.find((artifact: { type: string }) => artifact.type === "codex_prompt_bundle");
    await authed().get(`/artifacts/${codexArtifact.id}/export?format=markdown`).expect(200).expect(({ body }) => {
      expect(body.data.content).toContain("A.L.F.R.E.D.");
    });

    const graph = await authed().get(`/workflow-runs/${workflowRunId}/graph-state`).expect(200);
    expect(graph.body.data.status).toBe("completed");
    expect(graph.body.data.dsl.nodes.length).toBeGreaterThan(0);
    expect(graph.body.data.nodeStatuses.claude_critic).toBe("completed");

    const usage = await authed().get("/usage/summary").expect(200);
    expect(usage.body.data.totalTokens).toBeGreaterThan(0);
    expect(usage.body.data.costUsd).toBeGreaterThan(0);

    const workflowRunObjectId = new ObjectId(workflowRunId);
    const ownerObjectId = new ObjectId(userId);
    await expectCollectionCount("agent_executions", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 8);
    await expectCollectionCount("agent_messages", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 8);
    await expectCollectionCount("revision_patches", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 1);
    await expectCollectionCount("usage_events", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 8);
  }, 60000);

  function authed() {
    const withAuth = (testRequest: SupertestRequest) => testRequest.set("Authorization", `Bearer ${accessToken}`);
    return {
      get: (path: string) => withAuth(request(app.getHttpServer()).get(path)),
      post: (path: string) => withAuth(request(app.getHttpServer()).post(path)),
      patch: (path: string) => withAuth(request(app.getHttpServer()).patch(path)),
      delete: (path: string) => withAuth(request(app.getHttpServer()).delete(path))
    };
  }

  async function waitForRun(workflowRunId: string, expectedStatus: string) {
    let latest: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const response = await authed().get(`/workflow-runs/${workflowRunId}`).expect(200);
      latest = response.body.data;
      if (latest?.status === expectedStatus) return latest;
      if (["failed", "needs_human_review"].includes(String(latest?.status))) break;
      await delay(250);
    }
    throw new Error(`Workflow run ${workflowRunId} did not reach ${expectedStatus}; last status was ${String(latest?.status)}`);
  }

  async function expectCollectionCount(collectionName: string, filter: Record<string, unknown>, minimum: number) {
    const count = await db.db().collection(collectionName).countDocuments(filter);
    expect(count).toBeGreaterThanOrEqual(minimum);
  }
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
