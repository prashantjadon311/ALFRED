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
import cookie from "@fastify/cookie";

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
    await (app as NestFastifyApplication).register(cookie as never);
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

  it("uses an HttpOnly rotating refresh cookie and revokes it on logout", async () => {
    const email = `cookie-session-${Date.now()}@alfred.local`;
    const registered = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: "Cookie Session Tester", email, password: "password123" })
      .expect(201);

    expect(registered.body.data.accessToken).toBeTruthy();
    expect(registered.body.data.refreshToken).toBeUndefined();
    expect(JSON.stringify(registered.body)).not.toContain("refreshToken");
    expect(registered.headers["cache-control"]).toContain("no-store");
    const registerSetCookie = registered.headers["set-cookie"] as unknown as string[];
    expect(registerSetCookie?.[0]).toContain("HttpOnly");
    expect(registerSetCookie?.[0]).toContain("Path=/auth");

    const loggedIn = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "password123" })
      .expect(200);
    expect(loggedIn.headers["cache-control"]).toContain("no-store");
    const firstCookie = (
      loggedIn.headers["set-cookie"] as unknown as string[]
    )[0].split(";")[0];
    const firstRefreshToken = firstCookie.slice(firstCookie.indexOf("=") + 1);

    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${firstRefreshToken}`)
      .expect(401);

    const refreshed = await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", firstCookie)
      .expect(200);

    expect(refreshed.headers["cache-control"]).toContain("no-store");
    expect(refreshed.body.data.accessToken).toBeTruthy();
    expect(refreshed.body.data.accessToken).not.toBe(registered.body.data.accessToken);
    expect(refreshed.body.data.refreshToken).toBeUndefined();
    const refreshSetCookie = refreshed.headers["set-cookie"] as unknown as string[];
    const rotatedCookie = refreshSetCookie[0].split(";")[0];
    expect(rotatedCookie).not.toBe(firstCookie);

    await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", firstCookie)
      .expect(401)
      .expect(({ body }) => {
        expect(body.error.code).toBe(
          "REFRESH_TOKEN_STALE"
        );
      });

    const refreshedAgain = await request(
      app.getHttpServer()
    )
      .post("/auth/refresh")
      .set("Cookie", rotatedCookie)
      .expect(200);
    expect(refreshedAgain.headers["cache-control"]).toContain("no-store");

    const newestCookie = (
      refreshedAgain.headers["set-cookie"] as unknown as string[]
    )[0].split(";")[0];

    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${refreshedAgain.body.data.accessToken}`)
      .expect(200);

    const loggedOut = await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Cookie", newestCookie)
      .expect(200);
    expect(loggedOut.body.data).toEqual({ loggedOut: true });
    expect((loggedOut.headers["set-cookie"] as unknown as string[])[0]).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);

    await request(app.getHttpServer())
      .post("/auth/refresh")
      .set("Cookie", newestCookie)
      .expect(401);
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

    const memoryBullets = ["Keep requirement locking enabled.", "Generate a Codex prompt bundle."];
    await authed().patch(`/projects/${projectId}/memory`).send({ bullets: memoryBullets }).expect(200);

    const linkedChat = await authed()
      .post("/chats")
      .send({ title: "Project Detail Integration Chat", projectId })
      .expect(201);
    const chatMessage = await authed()
      .post(`/chats/${linkedChat.body.data.id}/messages`)
      .send({ content: "Summarize the locked goal.", providerType: "mock", modelName: "Mock GPT-5" })
      .expect(201);
    expect(chatMessage.body.data.assistantMessage).toEqual(expect.objectContaining({
      usageSource: "estimated",
      costSource: "estimated"
    }));
    expect(chatMessage.body.data.assistantMessage.pricingSnapshotId).toBeTruthy();

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
    expect(graph.body.data.nodes.length).toBeGreaterThan(0);
    expect(graph.body.data.edges.length).toBeGreaterThan(0);
    expect(graph.body.data.totalTokens).toBeGreaterThan(0);
    expect(graph.body.data.dsl.nodes.length).toBeGreaterThan(0);
    expect(graph.body.data.nodeStatuses.claude_critic).toBe("completed");

    const events = await authed().get(`/workflow-runs/${workflowRunId}/events?limit=500`).expect(200);
    expect(events.body.data.map((event: { eventType: string }) => event.eventType)).toEqual(expect.arrayContaining(["edge.traversed", "run.completed"]));

    const usage = await authed().get("/usage/summary").expect(200);
    expect(usage.body.data.totalTokens).toBeGreaterThan(0);
    expect(usage.body.data.costUsd).toBeGreaterThan(0);

    const detail = await authed().get(`/projects/${projectId}/detail`).expect(200);
    expect(detail.body.meta).toEqual({});
    expect(detail.body.data.project.id).toBe(projectId);
    expect(detail.body.data.requirementContract.id).toBe(contract.body.data.id);
    expect(detail.body.data.projectMemory.bullets).toEqual(memoryBullets);
    expect(detail.body.data.linkedChats.map((chat: { id: string }) => chat.id)).toContain(linkedChat.body.data.id);
    expect(detail.body.data.workflowRuns.map((workflowRun: { id: string }) => workflowRun.id)).toContain(workflowRunId);
    expect(detail.body.data.activeWorkflowRun).toBeNull();
    expect(detail.body.data.critiqueIssues.length).toBeGreaterThan(0);
    expect(detail.body.data.artifacts.length).toBeGreaterThan(0);
    expect(detail.body.data.timeline.length).toBeGreaterThan(0);
    expect(detail.body.data.usageSummary.totalTokens).toBeGreaterThan(0);
    expect(detail.body.data.usageSummary.costUsd).toBeGreaterThan(0);
    expect(detail.body.data.usageSummary.bySource.length).toBeGreaterThan(0);

    const otherAuth = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: "Project Detail Intruder", email: `project-detail-${Date.now()}@alfred.local`, password: "password123" })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/detail`)
      .set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`)
      .expect(404);

    const workflowRunObjectId = new ObjectId(workflowRunId);
    const ownerObjectId = new ObjectId(userId);
    await expectCollectionCount("agent_executions", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 8);
    await expectCollectionCount("agent_messages", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 8);
    await expectCollectionCount("revision_patches", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 1);
    await expectCollectionCount("usage_events", { userId: ownerObjectId, workflowRunId: workflowRunObjectId }, 7);
    const workflowUsage = await db.db().collection("usage_events").find({ userId: ownerObjectId, workflowRunId: workflowRunObjectId }).toArray();
    expect(workflowUsage.every((event) => event.usageSource && event.costSource && event.calculatedAt instanceof Date)).toBe(true);
    expect(
      workflowUsage.every(
        (event) =>
          event.costSource === "estimated" &&
          event.pricingSnapshotId
      )
    ).toBe(true);
    expect(workflowUsage.reduce((sum, event) => sum + Number(event.inputTokens), 0)).toBe(run.totalInputTokens);
    expect(workflowUsage.reduce((sum, event) => sum + Number(event.outputTokens), 0)).toBe(run.totalOutputTokens);
    expect(workflowUsage.reduce((sum, event) => sum + Number(event.costUsd), 0)).toBeCloseTo(Number(run.totalCostUsd), 12);
    const persistedChatUsage = await db.db().collection("usage_events").findOne({ userId: ownerObjectId, chatId: new ObjectId(linkedChat.body.data.id), source: "chat" });
    expect(persistedChatUsage).toEqual(expect.objectContaining({
      usageSource: "estimated",
      costSource: "estimated",
      pricingSnapshotId: chatMessage.body.data.assistantMessage.pricingSnapshotId
    }));
  }, 60000);

  it("pauses, resumes, stops, and scopes workflow run controls", async () => {
    const paused = await createRunnableWorkflow("Workflow Control Pause Resume");
    const pausedRunResponse = await authed().post(`/workflows/${paused.workflowId}/run`).send({ projectId: paused.projectId }).expect(201);
    const pausedRunId = pausedRunResponse.body.data.id;

    await authed().post(`/workflow-runs/${pausedRunId}/pause`).expect(201).expect(({ body }) => {
      expect(body.data.status).toBe("paused");
    });
    await delay(500);
    await authed().get(`/workflow-runs/${pausedRunId}`).expect(200).expect(({ body }) => {
      expect(body.data.status).toBe("paused");
    });

    let controlEvents = await authed().get(`/workflow-runs/${pausedRunId}/events?limit=200`).expect(200);
    expect(controlEvents.body.data.map((event: { eventType: string }) => event.eventType)).toContain("run.paused");
    const pausedArtifacts = await authed().get(`/workflow-runs/${pausedRunId}/artifacts`).expect(200);
    expect(pausedArtifacts.body.data.length).toBe(0);

    await authed().post(`/workflow-runs/${pausedRunId}/resume`).expect(201).expect(({ body }) => {
      expect(body.data.status).toBe("queued");
    });
    const resumedRun = await waitForRun(pausedRunId, "completed");
    expect(resumedRun.status).toBe("completed");
    controlEvents = await authed().get(`/workflow-runs/${pausedRunId}/events?limit=500`).expect(200);
    expect(controlEvents.body.data.map((event: { eventType: string }) => event.eventType)).toContain("run.resumed");

    const duplicateExecutions = await db.db().collection("agent_executions").aggregate([
      { $match: { workflowRunId: new ObjectId(pausedRunId) } },
      { $group: { _id: "$idempotencyKey", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    expect(duplicateExecutions).toHaveLength(0);

    const stopped = await createRunnableWorkflow("Workflow Control Stop");
    const stoppedRunResponse = await authed().post(`/workflows/${stopped.workflowId}/run`).send({ projectId: stopped.projectId }).expect(201);
    const stoppedRunId = stoppedRunResponse.body.data.id;
    await authed().post(`/workflow-runs/${stoppedRunId}/stop`).expect(201).expect(({ body }) => {
      expect(body.data.status).toBe("stopped");
    });
    const executionCountAfterStop = await db.db().collection("agent_executions").countDocuments({ workflowRunId: new ObjectId(stoppedRunId) });
    await delay(500);
    await authed().get(`/workflow-runs/${stoppedRunId}`).expect(200).expect(({ body }) => {
      expect(body.data.status).toBe("stopped");
    });
    expect(await db.db().collection("agent_executions").countDocuments({ workflowRunId: new ObjectId(stoppedRunId) })).toBe(executionCountAfterStop);
    controlEvents = await authed().get(`/workflow-runs/${stoppedRunId}/events?limit=200`).expect(200);
    expect(controlEvents.body.data.map((event: { eventType: string }) => event.eventType)).toContain("run.stopped");

    const otherAuth = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: "Workflow Control Intruder", email: `control-${Date.now()}@alfred.local`, password: "password123" })
      .expect(201);
    for (const action of ["pause", "resume", "stop"]) {
      await request(app.getHttpServer()).post(`/workflow-runs/${stoppedRunId}/${action}`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    }
  }, 60000);

  it("validates and runs a custom workflow DSL with scoped run access", async () => {
    const project = await authed()
      .post("/projects")
      .send({ name: "Custom DSL Execution Project", description: "Agent Studio custom workflow DSL run.", type: "software" })
      .expect(201);
    const projectId = project.body.data.id;

    await authed()
      .post(`/projects/${projectId}/requirement-contracts`)
      .send({
        originalRequirement: "Create a concise software plan and critique it before final output.",
        lockedGoal: "Validate custom DSL execution through the backend workflow runner.",
        taskType: "software",
        nonNegotiables: ["Use workflow DSL edges", "Persist traversal events"],
        successCriteria: ["Run completes", "Edge events are present"],
        forbiddenChanges: ["Skip critic review"]
      })
      .expect(201);

    const workflowDsl = {
      version: "1.0",
      name: "Custom Critic Loop DSL",
      nodes: [
        { key: "requirement_lock", type: "requirement_lock", title: "Requirement Lock", config: {} },
        { key: "claude_critic", type: "critic", title: "Claude Critic", promptTemplateKey: "claude_critic_v1" },
        { key: "issue_resolver", type: "resolver", title: "Issue Resolver", promptTemplateKey: "issue_resolver_v1" },
        { key: "final_output", type: "final_output", title: "Final Output", promptTemplateKey: "final_output_v1" }
      ],
      edges: [
        { key: "custom_e1", from: "requirement_lock", to: "claude_critic" },
        { key: "custom_e2", from: "claude_critic", to: "issue_resolver", condition: { type: "has_issue_severity", severityIn: ["BLOCKER", "HIGH"] } },
        { key: "custom_e3", from: "issue_resolver", to: "claude_critic", condition: { type: "iteration_remaining" } },
        { key: "custom_e4", from: "claude_critic", to: "final_output", condition: { type: "critic_approved" } }
      ],
      stopConditions: { maxIterations: 2, stopOnBudgetExceeded: true, stopOnRequirementDrift: true, stopOnUserStop: true }
    };

    const workflow = await authed()
      .post("/workflows")
      .send({
        name: "Custom Critic Loop DSL",
        description: "Custom Agent Studio DSL template.",
        projectId,
        workflowDsl,
        maxIterations: 2,
        maxTokens: 100000,
        maxCostUsd: 5
      })
      .expect(201);
    const workflowId = workflow.body.data.id;

    await authed().post(`/workflows/${workflowId}/validate`).send({ workflowDsl }).expect(201).expect(({ body }) => {
      expect(body.data.valid).toBe(true);
      expect(body.data.dsl.nodes.map((node: { key: string }) => node.key)).toEqual(["requirement_lock", "claude_critic", "issue_resolver", "final_output"]);
    });

    const runResponse = await authed().post(`/workflows/${workflowId}/run`).send({ projectId }).expect(201);
    const workflowRunId = runResponse.body.data.id;
    const run = await waitForTerminalRun(workflowRunId);
    expect(["completed", "needs_human_review"]).toContain(run.status);

    const logs = await authed().get(`/workflow-runs/${workflowRunId}/logs?limit=500`).expect(200);
    const eventTypes = logs.body.data.map((event: { eventType: string }) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining(["node.status.changed", "edge.traversed"]));
    expect(eventTypes).toContain(run.status === "completed" ? "run.completed" : "run.needs_human_review");

    const graph = await authed().get(`/workflow-runs/${workflowRunId}/graph-state`).expect(200);
    expect(graph.body.data.status).toBe(run.status);
    expect(graph.body.data.dsl.nodes.map((node: { key: string }) => node.key)).toEqual(["requirement_lock", "claude_critic", "issue_resolver", "final_output"]);

    const otherAuth = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ name: "Workspace Isolation Auditor", email: `isolation-${Date.now()}@alfred.local`, password: "password123" })
      .expect(201);
    await request(app.getHttpServer()).get(`/workflows/${workflowId}`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}/graph-state`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}/logs`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}/events`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}/issues`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
    await request(app.getHttpServer()).get(`/workflow-runs/${workflowRunId}/artifacts`).set("Authorization", `Bearer ${otherAuth.body.data.accessToken}`).expect(404);
  }, 60000);

  async function createRunnableWorkflow(name: string) {
    const project = await authed()
      .post("/projects")
      .send({ name, description: "Workflow control e2e project.", type: "software" })
      .expect(201);
    const projectId = project.body.data.id;
    await authed()
      .post(`/projects/${projectId}/requirement-contracts`)
      .send({
        originalRequirement: "Build a controllable workflow run.",
        lockedGoal: "Exercise pause, resume, and stop controls without changing requirements.",
        taskType: "software",
        nonNegotiables: ["Persist control events", "Avoid duplicate node execution"],
        successCriteria: ["Controls are scoped", "Resume completes safely"],
        forbiddenChanges: ["Skip control checks"]
      })
      .expect(201);
    const workflow = await authed()
      .post("/workflows")
      .send({ name, description: "Workflow control e2e template.", projectId, maxIterations: 3, maxTokens: 100000, maxCostUsd: 5 })
      .expect(201);
    return { projectId, workflowId: workflow.body.data.id };
  }

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

  async function waitForTerminalRun(workflowRunId: string): Promise<Record<string, unknown>> {
    let latest: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const response = await authed().get(`/workflow-runs/${workflowRunId}`).expect(200);
      latest = response.body.data;
      if (latest && ["completed", "needs_human_review"].includes(String(latest.status))) return latest;
      if (latest?.status === "failed") break;
      await delay(250);
    }
    throw new Error(`Workflow run ${workflowRunId} did not reach a safe terminal status; last status was ${String(latest?.status)}`);
  }

  async function expectCollectionCount(collectionName: string, filter: Record<string, unknown>, minimum: number) {
    const count = await db.db().collection(collectionName).countDocuments(filter);
    expect(count).toBeGreaterThanOrEqual(minimum);
  }
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
