import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ArtifactsRepository } from "../../repositories/artifacts.repository";
import { ArtifactVersionsRepository } from "../../repositories/artifact-versions.repository";

@Injectable()
export class ArtifactsService {
  constructor(
    private readonly artifacts: ArtifactsRepository,
    private readonly versions: ArtifactVersionsRepository
  ) {}

  async list(userId: ObjectId, page: number, limit: number, projectId?: string, type?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = new ObjectId(projectId);
    if (type) filter.type = type;
    const result = await this.artifacts.listByUser(userId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.artifacts.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, id: ObjectId) {
    const doc = await this.artifacts.findById(id, userId);
    if (!doc) throw new NotFoundException("Artifact not found");
    return this.artifacts.serialize(doc);
  }

  async create(userId: ObjectId, body: { title: string; type: string; content: string; projectId?: string; metadata?: Record<string, unknown> }) {
    const doc = await this.artifacts.create({ userId, projectId: body.projectId ? new ObjectId(body.projectId) : undefined, title: body.title, type: body.type, content: body.content, metadata: body.metadata ?? {}, createdAt: new Date() } as any);
    const version = await this.versions.create({ userId, artifactId: doc!._id!, version: 1, title: body.title, content: body.content, createdAt: new Date() } as any);
    await this.artifacts.updateById(doc!._id!, userId, { currentVersionId: version!._id } as any);
    return this.artifacts.serialize(doc);
  }

  async update(userId: ObjectId, id: ObjectId, body: { title?: string; content?: string; metadata?: Record<string, unknown> }) {
    const existing = await this.artifacts.findById(id, userId);
    if (!existing) throw new NotFoundException("Artifact not found");
    const doc = await this.artifacts.updateById(id, userId, body as any);
    if (body.content) {
      const latestVersion = await this.versions.collection().find({ artifactId: id }).sort({ version: -1 }).limit(1).next();
      const nextVersion = (latestVersion?.version ?? 0) + 1;
      const version = await this.versions.create({ userId, artifactId: id, version: nextVersion, title: body.title ?? existing.title, content: body.content, createdAt: new Date() } as any);
      await this.artifacts.updateById(id, userId, { currentVersionId: version!._id } as any);
    }
    return this.artifacts.serialize(doc);
  }

  async delete(userId: ObjectId, id: ObjectId) {
    const ok = await this.artifacts.deleteById(id, userId);
    if (!ok) throw new NotFoundException("Artifact not found");
    return { deleted: true };
  }

  async getVersions(userId: ObjectId, id: ObjectId) {
    await this.get(userId, id);
    const docs = await this.versions.collection().find({ artifactId: id, userId }).sort({ version: 1 }).toArray();
    return this.versions.serializeMany(docs);
  }

  async export(userId: ObjectId, id: ObjectId, format: "markdown" | "json") {
    const doc = await this.artifacts.findById(id, userId);
    if (!doc) throw new NotFoundException("Artifact not found");
    if (format === "json") return doc;
    return { format: "markdown", content: `# ${doc.title}\n\n${doc.content}` };
  }
}
