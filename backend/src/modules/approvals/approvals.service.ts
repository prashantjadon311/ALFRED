import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ApprovalRequestsRepository } from "../../repositories/approval-requests.repository";
import { AuditLogsRepository } from "../../repositories/audit-logs.repository";
import { WorkflowEventsRepository } from "../../repositories/workflow-events.repository";
import { RealtimeEventBus } from "../realtime/realtime-event-bus.service";

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly repo: ApprovalRequestsRepository,
    private readonly audit: AuditLogsRepository,
    private readonly events: WorkflowEventsRepository,
    private readonly bus: RealtimeEventBus
  ) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page: number, limit: number, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const result = await this.repo.listByWorkspace(userId, workspaceId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Approval request not found");
    return this.repo.serialize(doc);
  }

  async approve(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, reason?: string) {
    return this.decide(userId, workspaceId, id, "approved", reason);
  }

  async reject(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, reason?: string) {
    return this.decide(userId, workspaceId, id, "rejected", reason);
  }

  private async decide(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, status: "approved" | "rejected", reason?: string) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Approval request not found");
    if (doc.status !== "pending") throw new BadRequestException(`Approval is already ${doc.status}`);
    const updated = await this.repo.updateDecision(id, userId, workspaceId, { status, approvedBy: userId, decisionReason: reason, decidedAt: new Date() });
    await this.audit.audit({
      userId,
      workspaceId,
      entityType: "approval_request",
      entityId: id.toHexString(),
      action: `approval_${status}`,
      metadata: { reason }
    });
    if (doc.workflowRunId && doc.projectId) {
      const event = await this.events.create({
        userId,
        workflowRunId: doc.workflowRunId,
        eventType: "approval.resolved",
        nodeKey: null,
        edgeKey: null,
        data: { approvalRequestId: id.toHexString(), status, reason },
        createdAt: new Date()
      } as any);
      this.bus.publish({
        eventType: "approval.resolved",
        workflowRunId: doc.workflowRunId.toHexString(),
        projectId: doc.projectId.toHexString(),
        nodeKey: null,
        edgeKey: null,
        timestamp: event!.createdAt.toISOString(),
        data: { approvalRequestId: id.toHexString(), status, reason }
      });
    }
    return this.repo.serialize(updated);
  }
}
