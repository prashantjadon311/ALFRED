import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { RequirementContractsService } from "./requirement-contracts.service";

const contractSchema = z.object({
  originalRequirement: z.string().min(10),
  lockedGoal: z.string().min(10).optional(),
  taskType: z.enum(["software", "research", "planning", "mixed"]).optional(),
  nonNegotiables: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
  allowedChanges: z.array(z.string()).optional(),
  forbiddenChanges: z.array(z.string()).optional(),
  locked: z.boolean().default(true)
});
const updateSchema = contractSchema.partial().extend({
  driftStatus: z.enum(["stable", "watch", "drift_detected"]).optional()
});
const driftSchema = z.object({ output: z.string().min(1) });

@UseGuards(JwtAuthGuard)
@Controller()
export class RequirementContractsController {
  constructor(private readonly service: RequirementContractsService, private readonly scope: WorkspaceScopeService) {}

  @Post("projects/:projectId/requirement-contracts")
  async create(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("projectId") projectId: string, @Body(zodPipe(contractSchema)) body: z.infer<typeof contractSchema>) {
    const userId = toObjectId(user.userId, "userId");
    return ok(await this.service.create(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(projectId, "projectId"), body));
  }

  @Get("projects/:projectId/requirement-contracts/current")
  async current(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("projectId") projectId: string) {
    const userId = toObjectId(user.userId, "userId");
    return ok(await this.service.current(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(projectId, "projectId")));
  }

  @Patch("requirement-contracts/:id")
  async update(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    const userId = toObjectId(user.userId, "userId");
    return ok(await this.service.update(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id), body));
  }

  @Post("requirement-contracts/:id/check-drift")
  async checkDrift(@CurrentUser() user: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(driftSchema)) body: z.infer<typeof driftSchema>) {
    const userId = toObjectId(user.userId, "userId");
    return ok(await this.service.checkDrift(userId, await this.scope.resolve(userId, workspaceHeader), toObjectId(id), body.output));
  }
}
