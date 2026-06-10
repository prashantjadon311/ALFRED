import "reflect-metadata";
import * as bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { defaultWorkflowDsl } from "../orchestrator/default-workflow.dsl";
import { ensureMongoIndexes } from "./index-definitions";
import { ensureRepositoryPricingSnapshots } from "./pricing-seed";

const MONGO_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME ?? "alfred";

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log("Connected to MongoDB — seeding A.L.F.R.E.D.");

  await ensureMongoIndexes(db);
  await ensureRepositoryPricingSnapshots(db);

  // Demo user
  const demoEmail = "demo@alfred.local";
  let user = await db.collection("users").findOne({ email: demoEmail });
  if (!user) {
    const result = await db.collection("users").insertOne({ name: "A.L.F.R.E.D. Demo", email: demoEmail, passwordHash: await bcrypt.hash("password123", 12), role: "user", status: "active", createdAt: new Date(), updatedAt: new Date() });
    user = await db.collection("users").findOne({ _id: result.insertedId });
    console.log("Created demo user:", demoEmail);
  } else {
    console.log("Demo user already exists:", demoEmail);
  }
  const userId = user!._id as ObjectId;

  const workspaceData = [
    { name: "Prashant / Pro Workspace", description: "Primary A.L.F.R.E.D. execution workspace.", plan: "Pro", active: true, defaultProvider: "mock", defaultModel: "Mock GPT-5", monthlyTokenLimit: 1000000, monthlyCostLimit: 250, themePreference: "dark" },
    { name: "A.L.F.R.E.D. Lab", description: "Sandbox for agent workflow and model governance experiments.", plan: "Lab", active: false, defaultProvider: "mock", defaultModel: "Mock Claude Opus", monthlyTokenLimit: 750000, monthlyCostLimit: 150, themePreference: "dark" },
    { name: "Personal Research", description: "Research workspace for planning, reading, and prompt library work.", plan: "Personal", active: false, defaultProvider: "mock", defaultModel: "Mock Gemini", monthlyTokenLimit: 300000, monthlyCostLimit: 50, themePreference: "system" }
  ];
  for (const workspace of workspaceData) {
    const existing = await db.collection("workspaces").findOne({ userId, name: workspace.name });
    if (!existing) {
      await db.collection("workspaces").insertOne({ userId, ...workspace, archived: false, createdAt: new Date(), updatedAt: new Date() });
    } else {
      await db.collection("workspaces").updateOne({ _id: existing._id }, { $set: { ...workspace, archived: false, updatedAt: new Date() } });
    }
  }
  await db.collection("workspaces").updateMany({ userId, name: { $ne: "Prashant / Pro Workspace" } }, { $set: { active: false, updatedAt: new Date() } });
  const activeWorkspace = await db.collection("workspaces").findOne({ userId, active: true, archived: { $ne: true } });
  const workspaceId = activeWorkspace!._id as ObjectId;
  console.log("Seeded workspaces");

  // Providers
  const providerData = [
    { name: "Mock (Default)", providerType: "mock", baseUrl: null, maskedApiKey: "mock-••••••••••••-mode", enabled: true, healthStatus: "healthy", config: { mockMode: true } },
    { name: "OpenAI", providerType: "openai", baseUrl: "https://api.openai.com/v1", maskedApiKey: "sk-••••••••••••4321", enabled: false, healthStatus: "unknown", config: {} },
    { name: "Anthropic Claude", providerType: "anthropic", baseUrl: "https://api.anthropic.com", maskedApiKey: "sk-ant-••••••••••••abcd", enabled: false, healthStatus: "unknown", config: {} },
    { name: "Google Gemini", providerType: "gemini", baseUrl: "https://generativelanguage.googleapis.com", maskedApiKey: "AIza••••••••••••XyZw", enabled: false, healthStatus: "unknown", config: {} },
    { name: "Ollama (Local)", providerType: "ollama", baseUrl: "http://localhost:11434", maskedApiKey: "local-only", enabled: false, healthStatus: "unknown", config: {} }
  ];
  const providerIds: Record<string, ObjectId> = {};
  for (const p of providerData) {
    const existing = await db.collection("model_providers").findOne({ userId, providerType: p.providerType });
    if (!existing) {
      const res = await db.collection("model_providers").insertOne({ userId, ...p, createdAt: new Date(), updatedAt: new Date() });
      providerIds[p.providerType] = res.insertedId;
    } else {
      providerIds[p.providerType] = existing._id;
    }
  }
  console.log("Seeded providers");

  // AI Models
  const modelData = [
    { name: "Mock GPT-5", displayName: "Mock GPT-5 (Offline)", providerType: "mock", contextWindow: 400000, inputCostPer1k: 0.002, outputCostPer1k: 0.006, latencyClass: "fast", qualityClass: "high", enabled: true, defaultRole: "designer" },
    { name: "Mock Claude Opus", displayName: "Mock Claude Opus (Offline)", providerType: "mock", contextWindow: 200000, inputCostPer1k: 0.003, outputCostPer1k: 0.015, latencyClass: "medium", qualityClass: "premium_reasoning", enabled: true, defaultRole: "critic" },
    { name: "Mock Gemini", displayName: "Mock Gemini 2.0 (Offline)", providerType: "mock", contextWindow: 1000000, inputCostPer1k: 0.0015, outputCostPer1k: 0.004, latencyClass: "fast", qualityClass: "high", enabled: true, defaultRole: "architect" },
    { name: "Mock Local", displayName: "Mock Llama (Offline)", providerType: "mock", contextWindow: 128000, inputCostPer1k: 0, outputCostPer1k: 0, latencyClass: "slow", qualityClass: "medium", enabled: true, defaultRole: "cheap_fast" },
    { name: "gpt-5", displayName: "GPT-5", providerType: "openai", contextWindow: 400000, inputCostPer1k: 0.002, outputCostPer1k: 0.006, latencyClass: "fast", qualityClass: "high", enabled: false, defaultRole: "designer" },
    { name: "claude-opus-4-7", displayName: "Claude Opus 4.7", providerType: "anthropic", contextWindow: 200000, inputCostPer1k: 0.003, outputCostPer1k: 0.015, latencyClass: "medium", qualityClass: "premium_reasoning", enabled: false, defaultRole: "critic" },
    { name: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash", providerType: "gemini", contextWindow: 1000000, inputCostPer1k: 0.0015, outputCostPer1k: 0.004, latencyClass: "fast", qualityClass: "high", enabled: false, defaultRole: "architect" },
    { name: "llama3.2", displayName: "Ollama Llama 3.2", providerType: "ollama", contextWindow: 128000, inputCostPer1k: 0, outputCostPer1k: 0, latencyClass: "slow", qualityClass: "medium", enabled: false, defaultRole: "cheap_fast" }
  ];
  for (const m of modelData) {
    const existing = await db.collection("ai_models").findOne({ userId, providerType: m.providerType, name: m.name });
    if (!existing) {
      await db.collection("ai_models").insertOne({ userId, providerId: providerIds[m.providerType] ?? providerIds["mock"], ...m, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  console.log("Seeded AI models");

  // Prompt templates
  const promptTemplates = [
    { title: "ChatGPT Designer v1", category: "agent_role", tags: ["chatgpt_designer_v1", "product_design"], content: "You are A.L.F.R.E.D.'s product design agent.\n\nYour role: Clarify the product requirement and produce a structured design.\n\nOutput JSON:\n{\n  \"clarifiedProductDesign\": \"string\",\n  \"userFlows\": [],\n  \"moduleBreakdown\": [],\n  \"assumptions\": [],\n  \"risks\": []\n}\n\nIMPORTANT: Never change the locked motive. Respond in structured JSON only." },
    { title: "Gemini Architect v1", category: "software_architecture", tags: ["gemini_architect_v1"], content: "You are A.L.F.R.E.D.'s software architecture agent.\n\nYour role: Design the technical architecture for the product.\n\nOutput JSON:\n{\n  \"architecture\": \"string\",\n  \"components\": [],\n  \"dataModelSuggestions\": [],\n  \"integrationPoints\": [],\n  \"technicalRisks\": []\n}" },
    { title: "Consensus Builder v1", category: "agent_role", tags: ["consensus_builder_v1"], content: "You are A.L.F.R.E.D.'s consensus agent.\n\nMerge the design and architecture outputs into a single agreed plan.\n\nOutput JSON:\n{\n  \"summary\": \"string\",\n  \"architecture\": \"string\",\n  \"decisions\": [],\n  \"risks\": [],\n  \"openQuestions\": [],\n  \"assumptions\": []\n}" },
    { title: "Claude Critic v1", category: "claude_critic", tags: ["claude_critic_v1"], content: "You are A.L.F.R.E.D.'s strict critic agent.\n\nReview the consensus output for requirement drift, quality issues, and governance violations.\n\nOutput JSON:\n{\n  \"verdict\": \"approved|needs_revision|rejected\",\n  \"summary\": \"string\",\n  \"issues\": [{\"title\": \"string\", \"severity\": \"BLOCKER|HIGH|MEDIUM|LOW\", \"affectedArea\": \"string\", \"recommendation\": \"string\"}],\n  \"requirementDriftDetected\": false,\n  \"driftReason\": \"string\",\n  \"confidence\": 0.0\n}" },
    { title: "Issue Resolver v1", category: "agent_role", tags: ["issue_resolver_v1"], content: "You are A.L.F.R.E.D.'s issue resolver agent.\n\nFix the issues identified by Claude Critic without changing the locked requirement motive.\n\nOutput JSON:\n{\n  \"patchSummary\": \"string\",\n  \"fixedIssues\": [{\"issueTitle\": \"string\", \"fix\": \"string\"}],\n  \"revisedOutput\": \"string\",\n  \"remainingRisks\": []\n}" },
    { title: "Final Output Generator v1", category: "agent_role", tags: ["final_output_v1"], content: "You are A.L.F.R.E.D.'s final output agent.\n\nGenerate the approved final plan/report.\n\nOutput JSON:\n{\n  \"title\": \"string\",\n  \"type\": \"software_plan|research_report|architecture\",\n  \"content\": \"markdown string\",\n  \"metadata\": {}\n}" },
    { title: "Codex Prompt Generator v1", category: "codex_prompt", tags: ["codex_prompt_generator_v1"], content: "You are A.L.F.R.E.D.'s Codex prompt generator.\n\nGenerate phased implementation prompts for Claude Code.\n\nOutput JSON:\n{\n  \"title\": \"string\",\n  \"type\": \"codex_prompt_bundle\",\n  \"content\": \"markdown with phase-wise prompts\",\n  \"metadata\": {\"phases\": 3}\n}" }
  ];
  for (const pt of promptTemplates) {
    const existing = await db.collection("prompt_library").findOne({ userId, title: pt.title });
    if (!existing) {
      await db.collection("prompt_library").insertOne({ userId, workspaceId, ...pt, favorite: false, version: 1, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  console.log("Seeded prompt library");

  // Projects
  const projectNames = [
    { name: "A.L.F.R.E.D. Core Backend", type: "software" as const, status: "running", description: "The NestJS orchestration backend for the A.L.F.R.E.D. platform." },
    { name: "Market Research Agent Loop", type: "research" as const, status: "planning", description: "Agentic market analysis with Claude critique loop." },
    { name: "Product Strategy Q3", type: "planning" as const, status: "draft", description: "Strategic planning session for Q3 roadmap." },
    { name: "Microservices Migration", type: "software" as const, status: "paused", description: "Monolith-to-microservices migration planning." },
    { name: "ML Pipeline Design", type: "mixed" as const, status: "draft", description: "Design and implement an agentic ML training pipeline." }
  ];
  const projectIds: ObjectId[] = [];
  for (const proj of projectNames) {
    const existing = await db.collection("projects").findOne({ userId, name: proj.name });
    if (existing) { projectIds.push(existing._id); continue; }
    const res = await db.collection("projects").insertOne({ userId, workspaceId, ...proj, progress: proj.status === "running" ? 45 : proj.status === "planning" ? 10 : 0, tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { totalUsd: 0 }, metadata: {}, createdAt: new Date(), updatedAt: new Date() });
    projectIds.push(res.insertedId);
  }
  console.log("Seeded projects");

  const mainProjectId = projectIds[0];

  // Requirement contracts
  const existing_rc = await db.collection("requirement_contracts").findOne({ userId, projectId: mainProjectId });
  let rcId: ObjectId;
  if (!existing_rc) {
    const rcRes = await db.collection("requirement_contracts").insertOne({
      userId, projectId: mainProjectId,
      originalRequirement: "Build the A.L.F.R.E.D. agentic orchestration backend with NestJS, BullMQ, mock LLM, SSE events, and Claude critique loop.",
      lockedGoal: "Production-quality MVP backend for the A.L.F.R.E.D. platform with vertical slice: auth → project → workflow run → agent loop → artifact → SSE.",
      taskType: "software",
      nonNegotiables: ["Must run without real API keys in mock mode", "All workflow events must be persisted", "No raw API keys in logs or responses"],
      successCriteria: ["Backend builds successfully", "Vertical slice runs end-to-end", "SSE delivers live events", "Artifact is created after critic approval"],
      outOfScope: ["Frontend code", "Real LLM integration in MVP", "Payment gateway"],
      allowedChanges: ["Implementation details", "Architecture refinements", "Prompt compression", "Module naming"],
      forbiddenChanges: ["Changing platform from agentic AI to trading/stock", "Removing Claude critic loop", "Removing SSE", "Skipping auth"],
      driftStatus: "stable", driftScore: 0, locked: true, lockedAt: new Date(), version: 1, createdAt: new Date(), updatedAt: new Date()
    });
    rcId = rcRes.insertedId;
    await db.collection("projects").updateOne({ _id: mainProjectId }, { $set: { activeRequirementContractId: rcId } });
  } else {
    rcId = existing_rc._id;
  }

  // Project memory
  await db.collection("project_memory").updateOne({ userId, projectId: mainProjectId }, {
    $setOnInsert: { userId, projectId: mainProjectId, bullets: ["Backend uses NestJS + Fastify + MongoDB native driver", "Default LLM mode is mock — runs without real API keys", "BullMQ handles async workflow execution", "SSE delivers live workflow events to frontend", "Claude critic runs on every iteration and catches requirement drift"], files: [], contextPolicy: { injectMemory: true, maxMemoryTokens: 6000, includeRecentChats: true, includeArtifacts: true }, createdAt: new Date(), updatedAt: new Date() }
  }, { upsert: true });
  console.log("Seeded project memory");

  // Default workflow
  let workflowId: ObjectId;
  const existingWf = await db.collection("workflows").findOne({ userId, name: defaultWorkflowDsl.name });
  if (!existingWf) {
    const wfRes = await db.collection("workflows").insertOne({ userId, workspaceId, projectId: mainProjectId, name: defaultWorkflowDsl.name, description: "Default multi-agent product design loop with requirement lock, ChatGPT designer, Gemini architect, consensus builder, Claude critic, issue resolver, final output, and Codex prompt generator.", workflowDsl: defaultWorkflowDsl, maxIterations: 3, maxTokens: 100000, maxCostUsd: 5, status: "active", version: 1, createdAt: new Date(), updatedAt: new Date() });
    workflowId = wfRes.insertedId;
    await db.collection("projects").updateOne({ _id: mainProjectId }, { $set: { activeWorkflowId: workflowId } });
  } else {
    workflowId = existingWf._id;
  }
  console.log("Seeded default workflow");

  // Sample workflow run
  const existingRun = await db.collection("workflow_runs").findOne({ userId, workflowId });
  let runId: ObjectId;
  if (!existingRun) {
    const runRes = await db.collection("workflow_runs").insertOne({
      userId, workspaceId, projectId: mainProjectId, workflowId, status: "completed", currentNodeKey: "codex_prompt_generator", currentEdgeKey: "e8", iteration: 2, maxIterations: 3,
      totalInputTokens: 14200, totalOutputTokens: 8600, totalCostUsd: 0.0796,
      budgetState: { maxTokens: 100000, usedTokens: 22800, remainingTokens: 77200, maxCostUsd: 5, usedCostUsd: 0.0796, remainingCostUsd: 4.9204, mode: "normal", warnings: [] },
      claudeVerdict: "Issue resolver added explicit governance checks. Approved.",
      requirementContractSnapshot: { originalRequirement: "Build A.L.F.R.E.D. backend", lockedGoal: "Production-quality MVP", taskType: "software", nonNegotiables: ["No real API keys"], forbiddenChanges: ["Switch to trading platform"] },
      workflowDslSnapshot: defaultWorkflowDsl, acceptedDecisions: [{ decision: "Workflow events are source of truth for live UI", reason: "Keeps graph replayable and auditable" }], rejectedIdeas: [], openIssues: [], stopReason: "critic_approved", version: 6,
      startedAt: new Date(Date.now() - 120000), completedAt: new Date(), createdAt: new Date(Date.now() - 130000), updatedAt: new Date()
    });
    runId = runRes.insertedId;
  } else {
    runId = existingRun._id;
  }

  // Sample workflow events
  const existingEvt = await db.collection("workflow_events").findOne({ workflowRunId: runId });
  if (!existingEvt) {
    const evtTypes = [
      { eventType: "run.queued", nodeKey: null, data: { status: "queued" }, t: -130 },
      { eventType: "run.started", nodeKey: null, data: { status: "running" }, t: -120 },
      { eventType: "node.status.changed", nodeKey: "requirement_lock", data: { status: "running", iteration: 1 }, t: -118 },
      { eventType: "node.status.changed", nodeKey: "requirement_lock", data: { status: "completed" }, t: -117 },
      { eventType: "node.status.changed", nodeKey: "chatgpt_designer", data: { status: "running", iteration: 1 }, t: -115 },
      { eventType: "node.status.changed", nodeKey: "chatgpt_designer", data: { status: "completed", inputTokens: 1200, outputTokens: 800, costUsd: 0.0072 }, t: -112 },
      { eventType: "node.status.changed", nodeKey: "gemini_architect", data: { status: "running", iteration: 1 }, t: -110 },
      { eventType: "node.status.changed", nodeKey: "gemini_architect", data: { status: "completed", inputTokens: 1400, outputTokens: 900, costUsd: 0.0082 }, t: -107 },
      { eventType: "node.status.changed", nodeKey: "consensus_builder", data: { status: "running", iteration: 1 }, t: -105 },
      { eventType: "node.status.changed", nodeKey: "consensus_builder", data: { status: "completed", inputTokens: 1800, outputTokens: 1200, costUsd: 0.0108 }, t: -100 },
      { eventType: "workflow.loop.started", nodeKey: null, data: { iteration: 1 }, t: -98 },
      { eventType: "node.status.changed", nodeKey: "claude_critic", data: { status: "running", iteration: 1 }, t: -97 },
      { eventType: "node.status.changed", nodeKey: "claude_critic", data: { status: "completed", inputTokens: 2200, outputTokens: 1400, costUsd: 0.0148 }, t: -93 },
      { eventType: "critique.issue.created", nodeKey: "claude_critic", data: { title: "Budget stop condition underspecified", severity: "HIGH", affectedArea: "Workflow governance" }, t: -92 },
      { eventType: "critique.issues_found", nodeKey: null, data: { count: 1 }, t: -91 },
      { eventType: "node.status.changed", nodeKey: "issue_resolver", data: { status: "running", iteration: 1 }, t: -89 },
      { eventType: "node.status.changed", nodeKey: "issue_resolver", data: { status: "completed", inputTokens: 2000, outputTokens: 1100, costUsd: 0.0106 }, t: -85 },
      { eventType: "revision.patch.created", nodeKey: "issue_resolver", data: { iteration: 1 }, t: -84 },
      { eventType: "workflow.loop.started", nodeKey: null, data: { iteration: 2 }, t: -82 },
      { eventType: "node.status.changed", nodeKey: "claude_critic", data: { status: "running", iteration: 2 }, t: -81 },
      { eventType: "node.status.changed", nodeKey: "claude_critic", data: { status: "completed", inputTokens: 2100, outputTokens: 1000, costUsd: 0.0102 }, t: -77 },
      { eventType: "node.status.changed", nodeKey: "final_output", data: { status: "running", iteration: 2 }, t: -75 },
      { eventType: "node.status.changed", nodeKey: "final_output", data: { status: "completed", inputTokens: 1800, outputTokens: 900, costUsd: 0.0090 }, t: -70 },
      { eventType: "artifact.created", nodeKey: null, data: { type: "software_plan" }, t: -69 },
      { eventType: "node.status.changed", nodeKey: "codex_prompt_generator", data: { status: "running", iteration: 2 }, t: -67 },
      { eventType: "node.status.changed", nodeKey: "codex_prompt_generator", data: { status: "completed", inputTokens: 1500, outputTokens: 1300, costUsd: 0.0088 }, t: -62 },
      { eventType: "artifact.created", nodeKey: null, data: { type: "codex_prompt_bundle" }, t: -61 },
      { eventType: "run.completed", nodeKey: null, data: { status: "completed" }, t: -60 }
    ];
    const now = Date.now();
    await db.collection("workflow_events").insertMany(evtTypes.map((e) => ({ userId, workflowRunId: runId, eventType: e.eventType, nodeKey: e.nodeKey, edgeKey: null, data: e.data, message: null, createdAt: new Date(now + e.t * 1000) })));
  }
  console.log("Seeded workflow events");

  // Sample critique issue
  const existingIssue = await db.collection("critique_issues").findOne({ workflowRunId: runId });
  if (!existingIssue) {
    await db.collection("critique_issues").insertOne({ userId, workflowRunId: runId, iteration: 1, title: "Budget stop condition underspecified", severity: "HIGH", affectedArea: "Workflow governance", recommendation: "Add a budget gate before final artifact generation.", status: "fixed", sourceAgent: "claude_critic", createdAt: new Date(), updatedAt: new Date() });
  }

  // Sample artifact
  const existingArtifact = await db.collection("artifacts").findOne({ userId, workflowRunId: runId, type: "software_plan" });
  if (!existingArtifact) {
    const artRes = await db.collection("artifacts").insertOne({ userId, workspaceId, projectId: mainProjectId, workflowRunId: runId, title: "A.L.F.R.E.D. Reviewed Execution Plan", type: "software_plan", content: "## Final Plan\n\nA requirement-locked, budget-aware agentic orchestration backend with:\n\n- Mock LLM router\n- BullMQ workflow engine\n- Claude critique loop (2 iterations)\n- SSE graph replay\n- Artifact generation\n- Token/cost governance\n\n### Architecture\n\nNestJS + Fastify → MongoDB (native) → BullMQ → MockLLM → SSE\n\n### Approved by Claude Critic at iteration 2.", metadata: { approvedByCritic: true, iteration: 2 }, createdAt: new Date(), updatedAt: new Date() });
    const vRes = await db.collection("artifact_versions").insertOne({ userId, workspaceId, artifactId: artRes.insertedId, workflowRunId: runId, version: 1, title: "A.L.F.R.E.D. Reviewed Execution Plan", content: "## Final Plan\n\nAgentic orchestration backend — approved.", createdAt: new Date() });
    await db.collection("artifacts").updateOne({ _id: artRes.insertedId }, { $set: { currentVersionId: vRes.insertedId } });

    await db.collection("artifacts").insertOne({ userId, workspaceId, projectId: mainProjectId, workflowRunId: runId, title: "A.L.F.R.E.D. Codex Prompt Bundle", type: "codex_prompt_bundle", content: "## Phase 1\nBuild auth, projects, requirement contracts.\n\n## Phase 2\nImplement BullMQ workflow engine and mock LLM router.\n\n## Phase 3\nAdd SSE graph replay and governance tests.\n\n**Acceptance**: No raw keys, all events persisted, e2e test passes.", metadata: { generatedBy: "mock-codex", phases: 3 }, createdAt: new Date(), updatedAt: new Date() });
  }
  console.log("Seeded artifacts");

  // Sample usage events
  const existingUsage = await db.collection("usage_events").findOne({ userId, workflowRunId: runId });
  if (!existingUsage) {
    const agents = ["chatgpt_designer", "gemini_architect", "consensus_builder", "claude_critic", "issue_resolver", "claude_critic", "final_output", "codex_prompt_generator"];
    for (const agent of agents) {
      const input = 1200 + Math.floor(Math.random() * 1000);
      const output = 800 + Math.floor(Math.random() * 600);
      await db.collection("usage_events").insertOne({ userId, workspaceId, projectId: mainProjectId, workflowRunId: runId, providerType: "mock", modelName: agent.includes("claude") ? "Mock Claude Opus" : agent.includes("gemini") ? "Mock Gemini" : "Mock GPT-5", inputTokens: input, outputTokens: output, totalTokens: input + output, costUsd: Number(((input * 0.000002) + (output * 0.000006)).toFixed(6)), latencyMs: 100 + Math.floor(Math.random() * 200), source: "workflow", createdAt: new Date() });
    }
  }
  console.log("Seeded usage events");

  // Sample chat
  const existingChat = await db.collection("chats").findOne({ userId, projectId: mainProjectId });
  if (!existingChat) {
    const chatRes = await db.collection("chats").insertOne({ userId, workspaceId, projectId: mainProjectId, title: "What should A.L.F.R.E.D. do first?", mode: "single", settings: { temperature: 0.7, topP: 1, maxTokens: 4096 }, tokenUsage: { inputTokens: 320, outputTokens: 480, totalTokens: 800 }, cost: { totalUsd: 0.00352 }, createdAt: new Date(), updatedAt: new Date() });
    await db.collection("messages").insertMany([
      { userId, workspaceId, chatId: chatRes.insertedId, projectId: mainProjectId, role: "user", content: "What should the A.L.F.R.E.D. backend do first?", createdAt: new Date(Date.now() - 30000) },
      { userId, workspaceId, chatId: chatRes.insertedId, projectId: mainProjectId, role: "assistant", content: "The first working vertical slice should demonstrate the complete flow: register → create project → lock requirement contract → run default workflow → agent loop executes via BullMQ → Claude critic reviews → issue resolver fixes → final artifact is created → SSE streams all events live.", modelName: "Mock GPT-5", providerType: "mock", inputTokens: 320, outputTokens: 480, costUsd: 0.00352, latencyMs: 145, createdAt: new Date() }
    ]);
  }
  console.log("Seeded chats");

  for (const collectionName of ["projects", "chats", "messages", "workflows", "workflow_runs", "artifacts", "usage_events", "prompt_library"]) {
    await db.collection(collectionName).updateMany({ userId, workspaceId: { $exists: false } }, { $set: { workspaceId, updatedAt: new Date() } });
  }
  console.log("Backfilled demo workspaceId fields");

  await client.close();
  console.log("\n✅ Seed complete. Login: demo@alfred.local / password123");
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
