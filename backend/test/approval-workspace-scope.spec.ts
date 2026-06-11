import { NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ApprovalsService } from "../src/modules/approvals/approvals.service";

describe("ApprovalsService workspace scope", () => {
  const userId = new ObjectId();
  const workspaceId = new ObjectId();
  const approvalId = new ObjectId();
  const workflowRunId = new ObjectId();
  const projectId = new ObjectId();
  const pendingApproval = {
    _id: approvalId,
    userId,
    workspaceId,
    workflowRunId,
    projectId,
    type: "final_output_approval",
    status: "pending",
    title: "Review",
    description: "Review output",
    requestedBy: "workflow"
  };

  function makeService(found: typeof pendingApproval | null = pendingApproval) {
    const repo = {
      listByWorkspace: jest.fn(async () => ({ items: [pendingApproval], total: 1 })),
      findByIdForWorkspace: jest.fn(async () => found),
      updateDecision: jest.fn(async (_id, _userId, _workspaceId, patch) => ({
        ...pendingApproval,
        ...patch
      })),
      serialize: jest.fn((doc) => doc),
      serializeMany: jest.fn((docs) => docs)
    };
    const audit = { audit: jest.fn(async () => undefined) };
    const events = {
      create: jest.fn(async (doc) => ({ ...doc, createdAt: new Date() }))
    };
    const bus = { publish: jest.fn() };
    return {
      service: new ApprovalsService(repo as any, audit as any, events as any, bus as any),
      repo,
      audit,
      events,
      bus
    };
  }

  it("lists through repo.listByWorkspace", async () => {
    const { service, repo } = makeService();
    await service.list(userId, workspaceId, 1, 20, "pending");
    expect(repo.listByWorkspace).toHaveBeenCalledWith(
      userId,
      workspaceId,
      { status: "pending" },
      { skip: 0, limit: 20 }
    );
  });

  it("gets through findByIdForWorkspace", async () => {
    const { service, repo } = makeService();
    await service.get(userId, workspaceId, approvalId);
    expect(repo.findByIdForWorkspace).toHaveBeenCalledWith(
      approvalId,
      userId,
      workspaceId
    );
  });

  it("rejects approval not found in the workspace", async () => {
    const { service } = makeService(null);
    await expect(service.approve(userId, workspaceId, approvalId))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it("includes workspaceId in approval audit", async () => {
    const { service, audit } = makeService();
    await service.approve(userId, workspaceId, approvalId, "approved");
    expect(audit.audit).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      workspaceId,
      action: "approval_approved"
    }));
  });

  it("includes workspaceId in rejection audit", async () => {
    const { service, audit } = makeService();
    await service.reject(userId, workspaceId, approvalId, "rejected");
    expect(audit.audit).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      workspaceId,
      action: "approval_rejected"
    }));
  });

  it("still publishes approval.resolved", async () => {
    const { service, events, bus } = makeService();
    await service.approve(userId, workspaceId, approvalId);
    expect(events.create).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "approval.resolved",
      workflowRunId
    }));
    expect(bus.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "approval.resolved",
      workflowRunId: workflowRunId.toHexString(),
      projectId: projectId.toHexString()
    }));
  });
});
