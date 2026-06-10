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
import cookie from "@fastify/cookie";

const redisUrl = "redis://localhost:6379/15";
const testDbName = `alfred_isolation_${Date.now()}`;
const redisOptions = { maxRetriesPerRequest: null, connectTimeout: 1500, lazyConnect: true, retryStrategy: () => null };

async function createTestRedis() {
  const redis = new IORedis(redisUrl, redisOptions);
  await redis.connect();
  return redis;
}

describe("A.L.F.R.E.D. SaaS tenant isolation", () => {
  let app: INestApplication;
  let db: DatabaseService;
  let userAToken: string;
  let userBToken: string;

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
      // Test infrastructure may already be down.
    }
  }, 30000);

  it("keeps workspaces, projects, chats, providers, and artifacts isolated by user", async () => {
    for (const path of ["/workspaces", "/projects", "/chats", "/model-providers", "/artifacts"]) {
      await request(app.getHttpServer()).get(path).expect(401);
    }

    userAToken = await register("Tenant A Owner", `tenant-a-${Date.now()}@alfred.local`);
    userBToken = await register("Tenant B Owner", `tenant-b-${Date.now()}@alfred.local`);

    const aWorkspace = await asUserA().post("/workspaces").send({ name: "Tenant A Workspace", active: true }).expect(201);
    const aWorkspaceId = aWorkspace.body.data.id;
    const aProject = await asUserA().post("/projects").send({ name: "Tenant A Project", description: "Private project", type: "software" }).expect(201);
    const aProjectId = aProject.body.data.id;
    const aChat = await asUserA().post("/chats").send({ title: "Tenant A Chat", projectId: aProjectId, mode: "single" }).expect(201);
    const aChatId = aChat.body.data.id;
    await asUserA().post(`/chats/${aChatId}/messages`).send({ content: "Private tenant A message", providerType: "mock" }).expect(201);
    const aProvider = await asUserA().post("/model-providers").send({ name: "Tenant A Provider", providerType: "mock", apiKey: "sk-tenant-a-secret" }).expect(201);
    const aProviderId = aProvider.body.data.id;
    const aArtifact = await asUserA().post("/artifacts").send({ projectId: aProjectId, title: "Tenant A Artifact", type: "markdown", content: "# Tenant A" }).expect(201);
    const aArtifactId = aArtifact.body.data.id;

    await expectListExcludes(asUserB().get("/workspaces"), aWorkspaceId);
    await expectListExcludes(asUserB().get("/projects"), aProjectId);
    await expectListExcludes(asUserB().get("/chats"), aChatId);
    await expectListExcludes(asUserB().get("/model-providers"), aProviderId);
    await expectListExcludes(asUserB().get("/artifacts"), aArtifactId);

    await expectBlocked(asUserB().get(`/workspaces/${aWorkspaceId}`));
    await expectBlocked(asUserB().patch(`/workspaces/${aWorkspaceId}`).send({ description: "cross-user patch" }));
    await expectBlocked(asUserB().delete(`/workspaces/${aWorkspaceId}`));
    await expectBlocked(asUserB().post(`/workspaces/${aWorkspaceId}/switch`).send({}));
    await expectBlocked(asUserB().get(`/projects/${aProjectId}`));
    await expectBlocked(asUserB().patch(`/projects/${aProjectId}`).send({ progress: 12 }));
    await expectBlocked(asUserB().delete(`/projects/${aProjectId}`));
    await expectBlocked(asUserB().get(`/chats/${aChatId}`));
    await expectBlocked(asUserB().get(`/chats/${aChatId}/messages`));
    await expectBlocked(asUserB().patch(`/chats/${aChatId}`).send({ title: "cross-user chat patch" }));
    await expectBlocked(asUserB().delete(`/chats/${aChatId}`));
    await expectBlocked(asUserB().get(`/model-providers/${aProviderId}`));
    await expectBlocked(asUserB().patch(`/model-providers/${aProviderId}`).send({ enabled: false }));
    await expectBlocked(asUserB().post(`/model-providers/${aProviderId}/test`).send({}));
    await expectBlocked(asUserB().delete(`/model-providers/${aProviderId}`));
    await expectBlocked(asUserB().get(`/artifacts/${aArtifactId}`));
    await expectBlocked(asUserB().patch(`/artifacts/${aArtifactId}`).send({ title: "cross-user artifact patch" }));
    await expectBlocked(asUserB().delete(`/artifacts/${aArtifactId}`));

    const bWorkspace = await asUserB().post("/workspaces").send({ name: "Tenant B Workspace", active: true }).expect(201);
    const bProject = await asUserB().post("/projects").send({ name: "Tenant B Project", description: "Private B project", type: "research" }).expect(201);
    const bChat = await asUserB().post("/chats").send({ title: "Tenant B Chat", projectId: bProject.body.data.id, mode: "single" }).expect(201);
    const bArtifact = await asUserB().post("/artifacts").send({ projectId: bProject.body.data.id, title: "Tenant B Artifact", type: "markdown", content: "# Tenant B" }).expect(201);

    await expectListExcludes(asUserA().get("/workspaces"), bWorkspace.body.data.id);
    await expectListExcludes(asUserA().get("/projects"), bProject.body.data.id);
    await expectListExcludes(asUserA().get("/chats"), bChat.body.data.id);
    await expectListExcludes(asUserA().get("/artifacts"), bArtifact.body.data.id);
    await expectBlocked(asUserA().get(`/workspaces/${bWorkspace.body.data.id}`));
    await expectBlocked(asUserA().get(`/projects/${bProject.body.data.id}`));
    await expectBlocked(asUserA().get(`/chats/${bChat.body.data.id}`));
    await expectBlocked(asUserA().get(`/artifacts/${bArtifact.body.data.id}`));
  }, 45000);

  async function register(name: string, email: string) {
    const response = await request(app.getHttpServer()).post("/auth/register").send({ name, email, password: "password123" }).expect(201);
    return response.body.data.accessToken as string;
  }

  function asUserA() {
    return authed(userAToken);
  }

  function asUserB() {
    return authed(userBToken);
  }

  function authed(token: string) {
    const withAuth = (testRequest: SupertestRequest) => testRequest.set("Authorization", `Bearer ${token}`);
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
