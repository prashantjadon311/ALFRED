import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { Test as NestTest } from "@nestjs/testing";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import request from "supertest";
import type { Test as SupertestRequest } from "supertest";
import IORedis from "ioredis";
import { AppModule } from "../src/app.module";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import { DatabaseService } from "../src/database/database.service";

const redisUrl = "redis://localhost:6379/15";
const testDbName = `alfred_workspace_${Date.now()}`;
const redisOptions = { maxRetriesPerRequest: null, connectTimeout: 1500, lazyConnect: true, retryStrategy: () => null };

async function createTestRedis() {
  const redis = new IORedis(redisUrl, redisOptions);
  await redis.connect();
  return redis;
}

describe("A.L.F.R.E.D. workspace isolation and provisioning", () => {
  let app: INestApplication;
  let db: DatabaseService;

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
      // Test infrastructure may already be down.
    }
  }, 30000);

  it("keeps same-user workspace-owned resources isolated", async () => {
    const token = await register(`workspace-owner-${Date.now()}@alfred.local`);
    const a = await authed(token).post("/workspaces").send({ name: "Workspace A", active: true }).expect(201);
    const b = await authed(token).post("/workspaces").send({ name: "Workspace B", active: true }).expect(201);
    const workspaceA = a.body.data.id as string;
    const workspaceB = b.body.data.id as string;

    const project = await authed(token, workspaceA).post("/projects").send({ name: "Workspace A Project", type: "software" }).expect(201);
    const projectId = project.body.data.id as string;
    const chat = await authed(token, workspaceA).post("/chats").send({ title: "Workspace A Chat", projectId }).expect(201);
    const artifact = await authed(token, workspaceA).post("/artifacts").send({ projectId, title: "Workspace A Artifact", type: "markdown", content: "# A" }).expect(201);
    const prompt = await authed(token, workspaceA).post("/prompts").send({ title: "Workspace A Prompt", category: "agent_role", content: "Only workspace A", tags: ["a"] }).expect(201);

    await expectListExcludes(authed(token, workspaceB).get("/projects"), projectId);
    await expectListExcludes(authed(token, workspaceB).get("/chats"), chat.body.data.id);
    await expectListExcludes(authed(token, workspaceB).get("/artifacts"), artifact.body.data.id);
    await expectListExcludes(authed(token, workspaceB).get("/prompts"), prompt.body.data.id);

    await expectBlocked(authed(token, workspaceB).get(`/projects/${projectId}`));
    await expectBlocked(authed(token, workspaceB).patch(`/projects/${projectId}`).send({ progress: 50 }));
    await expectBlocked(authed(token, workspaceB).delete(`/projects/${projectId}`));
    await expectBlocked(authed(token, workspaceB).get(`/chats/${chat.body.data.id}`));
    await expectBlocked(authed(token, workspaceB).patch(`/chats/${chat.body.data.id}`).send({ title: "Cross workspace" }));
    await expectBlocked(authed(token, workspaceB).delete(`/chats/${chat.body.data.id}`));
    await expectBlocked(authed(token, workspaceB).get(`/artifacts/${artifact.body.data.id}`));
    await expectBlocked(authed(token, workspaceB).patch(`/artifacts/${artifact.body.data.id}`).send({ title: "Cross workspace" }));
    await expectBlocked(authed(token, workspaceB).delete(`/artifacts/${artifact.body.data.id}`));
    await expectBlocked(authed(token, workspaceB).get(`/prompts/${prompt.body.data.id}`));
    await expectBlocked(authed(token, workspaceB).patch(`/prompts/${prompt.body.data.id}`).send({ title: "Cross workspace" }));
    await expectBlocked(authed(token, workspaceB).delete(`/prompts/${prompt.body.data.id}`));
  }, 30000);

  it("provisions defaults for a newly registered user", async () => {
    const email = `provisioned-${Date.now()}@alfred.local`;
    await register(email);
    const login = await request(app.getHttpServer()).post("/auth/login").send({ email, password: "password123" }).expect(201);
    const token = login.body.data.accessToken as string;

    await authed(token).get("/auth/me").expect(200).expect(({ body }) => {
      expect(body.data.email).toBe(email);
    });

    const workspaces = await authed(token).get("/workspaces").expect(200);
    expect(workspaces.body.data.some((workspace: { active: boolean; plan: string; name: string }) => workspace.active && workspace.plan === "free" && workspace.name === "My Workspace")).toBe(true);

    const providers = await authed(token).get("/model-providers").expect(200);
    expect(providers.body.data.some((provider: { providerType: string; enabled: boolean }) => provider.providerType === "mock" && provider.enabled)).toBe(true);

    const models = await authed(token).get("/models").expect(200);
    expect(models.body.data.some((model: { providerType: string; name: string }) => model.providerType === "mock" && model.name === "Mock GPT-5")).toBe(true);

    const prompts = await authed(token).get("/prompts").expect(200);
    expect(prompts.body.data.some((prompt: { category: string }) => prompt.category === "codex_prompt")).toBe(true);

    await authed(token).get("/settings").expect(200).expect(({ body }) => {
      expect(body.data.defaultProvider).toBe("mock");
      expect(body.data.mockMode).toBe(true);
    });
  }, 30000);

  async function register(email: string) {
    const response = await request(app.getHttpServer()).post("/auth/register").send({ name: "Workspace Tester", email, password: "password123" }).expect(201);
    return response.body.data.accessToken as string;
  }

  function authed(token: string, workspaceId?: string) {
    const withAuth = (testRequest: SupertestRequest) => {
      const req = testRequest.set("Authorization", `Bearer ${token}`);
      return workspaceId ? req.set("X-Workspace-Id", workspaceId) : req;
    };
    return {
      get: (path: string) => withAuth(request(app.getHttpServer()).get(path)),
      post: (path: string) => withAuth(request(app.getHttpServer()).post(path)),
      patch: (path: string) => withAuth(request(app.getHttpServer()).patch(path)),
      delete: (path: string) => withAuth(request(app.getHttpServer()).delete(path))
    };
  }
});

async function expectListExcludes(testRequest: SupertestRequest, id: string) {
  const response = await testRequest.expect(200);
  expect(response.body.data.map((item: { id: string }) => item.id)).not.toContain(id);
}

async function expectBlocked(testRequest: SupertestRequest) {
  const response = await testRequest;
  expect([403, 404]).toContain(response.status);
}
