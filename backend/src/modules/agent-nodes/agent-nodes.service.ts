import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { AgentNodesRepository } from "../../repositories/agent-nodes.repository";

@Injectable()
export class AgentNodesService {
  constructor(private readonly repo: AgentNodesRepository) {}

  async listByWorkflow(userId: ObjectId, workflowId: ObjectId) {
    const docs = await this.repo.collection().find({ userId, workflowId }).toArray();
    return this.repo.serializeMany(docs);
  }

  async upsertNode(userId: ObjectId, workflowId: ObjectId, body: { nodeKey: string; nodeType: string; title: string; role?: string; providerType?: string; modelName?: string; inlineSystemPrompt?: string; temperature?: number; maxTokens?: number; budgetUsd?: number; config?: Record<string, unknown> }) {
    const existing = await this.repo.collection().findOne({ workflowId, nodeKey: body.nodeKey });
    if (existing) {
      await this.repo.collection().updateOne({ _id: existing._id }, { $set: { ...body, updatedAt: new Date() } });
      return this.repo.serialize(await this.repo.findById(existing._id, userId));
    }
    return this.repo.serialize(await this.repo.create({ userId, workflowId, ...body, createdAt: new Date() } as any));
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findById(id, userId);
    if (!doc) throw new NotFoundException("Agent node not found");
    return this.repo.serialize(doc);
  }

  async delete(userId: ObjectId, id: ObjectId) {
    const ok = await this.repo.deleteById(id, userId);
    if (!ok) throw new NotFoundException("Agent node not found");
    return { deleted: true };
  }
}
