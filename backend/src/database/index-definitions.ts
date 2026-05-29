import { Db } from "mongodb";

export async function ensureMongoIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),

    db.collection("projects").createIndex({ userId: 1 }),
    db.collection("projects").createIndex({ userId: 1, status: 1 }),
    db.collection("projects").createIndex({ userId: 1, updatedAt: -1 }),

    db.collection("requirement_contracts").createIndex({ userId: 1, projectId: 1 }),
    db.collection("requirement_contracts").createIndex({ projectId: 1 }),

    db.collection("project_memory").createIndex({ userId: 1, projectId: 1 }, { unique: true }),

    db.collection("model_providers").createIndex({ userId: 1 }),
    db.collection("model_providers").createIndex({ userId: 1, providerType: 1 }),

    db.collection("ai_models").createIndex({ userId: 1, providerId: 1 }),
    db.collection("ai_models").createIndex({ userId: 1, providerType: 1, name: 1 }),

    db.collection("chats").createIndex({ userId: 1 }),
    db.collection("chats").createIndex({ userId: 1, projectId: 1 }),
    db.collection("chats").createIndex({ userId: 1, updatedAt: -1 }),
    db.collection("chats").createIndex({ parentChatId: 1 }),

    db.collection("messages").createIndex({ chatId: 1, createdAt: 1 }),
    db.collection("messages").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("messages").createIndex({ projectId: 1, createdAt: -1 }),

    db.collection("prompt_library").createIndex({ userId: 1 }),
    db.collection("prompt_library").createIndex({ userId: 1, category: 1 }),
    db.collection("prompt_library").createIndex({ userId: 1, favorite: 1 }),
    db.collection("prompt_library").createIndex({ title: "text", content: "text", tags: "text" }),

    db.collection("workflows").createIndex({ userId: 1 }),
    db.collection("workflows").createIndex({ userId: 1, projectId: 1 }),
    db.collection("workflows").createIndex({ userId: 1, status: 1 }),

    db.collection("workflow_runs").createIndex({ userId: 1 }),
    db.collection("workflow_runs").createIndex({ userId: 1, projectId: 1 }),
    db.collection("workflow_runs").createIndex({ userId: 1, status: 1 }),
    db.collection("workflow_runs").createIndex({ workflowId: 1 }),
    db.collection("workflow_runs").createIndex({ createdAt: -1 }),

    db.collection("agent_nodes").createIndex({ workflowId: 1 }),
    db.collection("agent_nodes").createIndex({ userId: 1, workflowId: 1 }),
    db.collection("agent_nodes").createIndex({ workflowId: 1, nodeKey: 1 }),

    db.collection("agent_executions").createIndex({ workflowRunId: 1 }),
    db.collection("agent_executions").createIndex({ workflowRunId: 1, nodeKey: 1 }),
    db.collection("agent_executions").createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
    db.collection("agent_executions").createIndex({ status: 1 }),

    db.collection("agent_messages").createIndex({ workflowRunId: 1, createdAt: 1 }),
    db.collection("agent_messages").createIndex({ workflowRunId: 1, iteration: 1 }),

    db.collection("agent_decisions").createIndex({ workflowRunId: 1 }),
    db.collection("agent_decisions").createIndex({ status: 1 }),

    db.collection("critique_issues").createIndex({ workflowRunId: 1 }),
    db.collection("critique_issues").createIndex({ workflowRunId: 1, severity: 1 }),
    db.collection("critique_issues").createIndex({ workflowRunId: 1, status: 1 }),

    db.collection("revision_patches").createIndex({ workflowRunId: 1 }),
    db.collection("revision_patches").createIndex({ workflowRunId: 1, iteration: 1 }),

    db.collection("workflow_events").createIndex({ workflowRunId: 1, createdAt: 1 }),
    db.collection("workflow_events").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("workflow_events").createIndex({ eventType: 1 }),

    db.collection("usage_events").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("usage_events").createIndex({ projectId: 1, createdAt: -1 }),
    db.collection("usage_events").createIndex({ workflowRunId: 1 }),
    db.collection("usage_events").createIndex({ providerType: 1 }),
    db.collection("usage_events").createIndex({ modelName: 1 }),

    db.collection("artifacts").createIndex({ userId: 1 }),
    db.collection("artifacts").createIndex({ projectId: 1 }),
    db.collection("artifacts").createIndex({ workflowRunId: 1 }),
    db.collection("artifacts").createIndex({ type: 1 }),

    db.collection("artifact_versions").createIndex({ artifactId: 1, version: 1 }),
    db.collection("artifact_versions").createIndex({ workflowRunId: 1 }),

    db.collection("approval_requests").createIndex({ userId: 1, status: 1 }),
    db.collection("approval_requests").createIndex({ workflowRunId: 1 }),

    db.collection("audit_logs").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("audit_logs").createIndex({ entityType: 1, entityId: 1 }),

    db.collection("settings").createIndex({ userId: 1, key: 1 }, { unique: true })
  ]);
}
