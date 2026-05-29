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

  async list(userId: ObjectId, page: number, limit: number, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const result = await this.repo.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Approval request not found");
    return this.repo.serialize(doc);
  }

  async approve(userId: ObjectId, id: ObjectId, reason?: string) {
    return this.decide(userId, id, "approved", reason);
  }

  async reject(userId: ObjectId, id: ObjectId, reason?: string) {
    return this.decide(userId, id, "rejected", reason);
  }

  private async decide(userId: ObjectId, id: ObjectId, status: "approved" | "rejected", reason?: string) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Approval request not found");
    if (doc.status !== "pending") throw new BadRequestException(`Approval is already ${doc.status}`);
    const updated = await this.repo.updateById(id, userId, { status, approvedBy: userId.toHexString(), decisionReason: reason, decidedAt: new Date() } as any);
    await this.audit.audit({ userId, entityType: "approval_request", entityId: id.toHexString(), action: `approval_${status}`, metadata: { reason } });
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
