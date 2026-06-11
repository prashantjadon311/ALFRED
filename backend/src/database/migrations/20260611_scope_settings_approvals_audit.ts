import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/alfred";
const DB_NAME = process.env.MONGODB_DB_NAME ?? "alfred";

async function dropIndexIfExists(collection: any, name: string) {
  const indexes = await collection.indexes();
  if (indexes.some((index: { name: string }) => index.name === name)) {
    await collection.dropIndex(name);
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const settings = db.collection("settings");
  await settings.updateMany(
    { scopeType: { $exists: false } },
    { $set: { scopeType: "user" } }
  );
  await dropIndexIfExists(settings, "userId_1_key_1");

  await settings.createIndex(
    { userId: 1, scopeType: 1, key: 1 },
    {
      unique: true,
      partialFilterExpression: { scopeType: "user" }
    }
  );

  await settings.createIndex(
    { userId: 1, workspaceId: 1, scopeType: 1, key: 1 },
    {
      unique: true,
      partialFilterExpression: { scopeType: "workspace" }
    }
  );

  const approvalRequests = db.collection("approval_requests");
  const approvalsWithoutWorkspace = approvalRequests.find({
    workspaceId: { $exists: false },
    workflowRunId: { $exists: true }
  });

  for await (const approval of approvalsWithoutWorkspace) {
    const run = await db.collection("workflow_runs").findOne({
      _id: approval.workflowRunId instanceof ObjectId
        ? approval.workflowRunId
        : new ObjectId(String(approval.workflowRunId))
    });

    if (run?.workspaceId) {
      await approvalRequests.updateOne(
        { _id: approval._id },
        { $set: { workspaceId: run.workspaceId } }
      );
    }
  }

  await approvalRequests.createIndex({ userId: 1, workspaceId: 1, status: 1 });
  await approvalRequests.createIndex({ userId: 1, workspaceId: 1, workflowRunId: 1 });

  const auditLogs = db.collection("audit_logs");
  await auditLogs.createIndex({ userId: 1, workspaceId: 1, createdAt: -1 });
  await auditLogs.createIndex({ userId: 1, workspaceId: 1, entityType: 1, entityId: 1 });

  await client.close();
  console.log("Scoped settings, approvals and audit migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
