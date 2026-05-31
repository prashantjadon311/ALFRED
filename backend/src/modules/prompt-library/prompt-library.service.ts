import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { PromptsRepository } from "../../repositories/prompts.repository";

type Category =
  | "product_design"
  | "software_architecture"
  | "research"
  | "code_review"
  | "qa_audit"
  | "agent_role"
  | "claude_critic"
  | "codex_prompt"
  | "prompt_compression";

@Injectable()
export class PromptLibraryService {
  constructor(private readonly repo: PromptsRepository) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page: number, limit: number, category?: string, favorite?: boolean) {
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (favorite !== undefined) filter.favorite = favorite;
    const result = await this.repo.listByUserAndWorkspace(userId, workspaceId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.repo.serializeMany(result.items), total: result.total };
  }

  async create(userId: ObjectId, workspaceId: ObjectId, body: { title: string; category: Category; content: string; tags?: string[] }) {
    const doc = await this.repo.create({ userId, workspaceId, title: body.title, category: body.category, content: body.content, tags: body.tags ?? [], favorite: false, version: 1, createdAt: new Date() } as any);
    return this.repo.serialize(doc);
  }

  async get(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Prompt not found");
    return this.repo.serialize(doc);
  }

  async update(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, body: Partial<{ title: string; category: string; content: string; tags: string[] }>) {
    const doc = await this.repo.updateByIdForWorkspace(id, userId, workspaceId, body as any);
    if (!doc) throw new NotFoundException("Prompt not found");
    return this.repo.serialize(doc);
  }

  async delete(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const ok = await this.repo.deleteByIdForWorkspace(id, userId, workspaceId);
    if (!ok) throw new NotFoundException("Prompt not found");
    return { deleted: true };
  }

  async toggleFavorite(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const doc = await this.repo.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Prompt not found");
    const updated = await this.repo.updateByIdForWorkspace(id, userId, workspaceId, { favorite: !doc.favorite } as any);
    return this.repo.serialize(updated);
  }
}
