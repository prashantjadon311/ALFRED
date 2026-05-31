import { Body, Controller, Get, Headers, NotFoundException, Param, Patch, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { serializeDoc, toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { ProjectMemoryRepository } from "../../repositories/project-memory.repository";
import { ProjectsRepository } from "../../repositories/projects.repository";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";

const memorySchema = z.object({
  bullets: z.array(z.string()).default([]),
  files: z.array(z.unknown()).default([]),
  contextPolicy: z.object({
    injectMemory: z.boolean().default(true),
    maxMemoryTokens: z.number().min(100).max(50000).default(6000),
    includeRecentChats: z.boolean().default(true),
    includeArtifacts: z.boolean().default(true)
  }).default({ injectMemory: true, maxMemoryTokens: 6000, includeRecentChats: true, includeArtifacts: true })
});

@UseGuards(JwtAuthGuard)
@Controller("projects/:projectId/memory")
export class ProjectMemoryController {
  constructor(private readonly memory: ProjectMemoryRepository, private readonly projects: ProjectsRepository, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async get(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("projectId") projectId: string) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const pid = toObjectId(projectId, "projectId");
    if (!(await this.projects.findByIdForWorkspace(pid, userId, workspaceId))) throw new NotFoundException("Project not found");
    const existing = await this.memory.findByProject(userId, pid);
    return ok(serializeDoc(existing) ?? {
      projectId,
      bullets: [],
      files: [],
      contextPolicy: { injectMemory: true, maxMemoryTokens: 6000, includeRecentChats: true, includeArtifacts: true }
    });
  }

  @Patch()
  async update(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("projectId") projectId: string, @Body(zodPipe(memorySchema.partial())) body: Partial<z.infer<typeof memorySchema>>) {
    const userId = toObjectId(user.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const pid = toObjectId(projectId, "projectId");
    if (!(await this.projects.findByIdForWorkspace(pid, userId, workspaceId))) throw new NotFoundException("Project not found");
    return ok(serializeDoc(await this.memory.upsert(userId, pid, body as any)));
  }
}
