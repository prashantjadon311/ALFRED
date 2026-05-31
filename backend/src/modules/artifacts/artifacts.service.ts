import { Injectable, NotFoundException } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { ArtifactsRepository } from "../../repositories/artifacts.repository";
import { ArtifactVersionsRepository } from "../../repositories/artifact-versions.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";

@Injectable()
export class ArtifactsService {
  constructor(
    private readonly artifacts: ArtifactsRepository,
    private readonly versions: ArtifactVersionsRepository,
    private readonly projects: ProjectsRepository
  ) {}

  async list(userId: ObjectId, workspaceId: ObjectId, page: number, limit: number, projectId?: string, type?: string) {
    const filter: Record<string, unknown> = {};
    if (projectId) {
      const pid = new ObjectId(projectId);
      await this.assertProject(userId, workspaceId, pid);
      filter.projectId = pid;
    }
    if (type) filter.type = type;
    const result = await this.artifacts.listByUserAndWorkspace(userId, workspaceId, filter as any, { skip: (page - 1) * limit, limit });
    return { items: this.artifacts.serializeMany(result.items), total: result.total };
  }

  async get(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const doc = await this.artifacts.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Artifact not found");
    return this.artifacts.serialize(doc);
  }

  async create(userId: ObjectId, workspaceId: ObjectId, body: { title: string; type: string; content: string; projectId?: string; metadata?: Record<string, unknown> }) {
    const projectId = body.projectId ? new ObjectId(body.projectId) : undefined;
    if (projectId) await this.assertProject(userId, workspaceId, projectId);
    const doc = await this.artifacts.create({ userId, workspaceId, projectId, title: body.title, type: body.type, content: body.content, metadata: body.metadata ?? {}, createdAt: new Date() } as any);
    const version = await this.versions.create({ userId, workspaceId, artifactId: doc!._id!, version: 1, title: body.title, content: body.content, createdAt: new Date() } as any);
    await this.artifacts.updateById(doc!._id!, userId, { currentVersionId: version!._id } as any);
    return this.artifacts.serialize(doc);
  }

  async update(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, body: { title?: string; content?: string; metadata?: Record<string, unknown> }) {
    const existing = await this.artifacts.findByIdForWorkspace(id, userId, workspaceId);
    if (!existing) throw new NotFoundException("Artifact not found");
    const doc = await this.artifacts.updateByIdForWorkspace(id, userId, workspaceId, body as any);
    if (body.content) {
      const latestVersion = await this.versions.collection().find({ artifactId: id }).sort({ version: -1 }).limit(1).next();
      const nextVersion = (latestVersion?.version ?? 0) + 1;
      const version = await this.versions.create({ userId, workspaceId, artifactId: id, version: nextVersion, title: body.title ?? existing.title, content: body.content, createdAt: new Date() } as any);
      await this.artifacts.updateById(id, userId, { currentVersionId: version!._id } as any);
    }
    return this.artifacts.serialize(doc);
  }

  async delete(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    const ok = await this.artifacts.deleteByIdForWorkspace(id, userId, workspaceId);
    if (!ok) throw new NotFoundException("Artifact not found");
    return { deleted: true };
  }

  async getVersions(userId: ObjectId, workspaceId: ObjectId, id: ObjectId) {
    await this.get(userId, workspaceId, id);
    const docs = await this.versions.collection().find({ artifactId: id, userId }).sort({ version: 1 }).toArray();
    return this.versions.serializeMany(docs);
  }

  async export(userId: ObjectId, workspaceId: ObjectId, id: ObjectId, format: "markdown" | "json") {
    const doc = await this.artifacts.findByIdForWorkspace(id, userId, workspaceId);
    if (!doc) throw new NotFoundException("Artifact not found");
    if (format === "json") return doc;
    return { format: "markdown", content: `# ${doc.title}\n\n${doc.content}` };
  }

  private async assertProject(userId: ObjectId, workspaceId: ObjectId, projectId: ObjectId) {
    const project = await this.projects.findByIdForWorkspace(projectId, userId, workspaceId);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
