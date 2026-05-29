import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
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
  constructor(private readonly service: RequirementContractsService) {}

  @Post("projects/:projectId/requirement-contracts")
  async create(@CurrentUser() user: RequestUser, @Param("projectId") projectId: string, @Body(zodPipe(contractSchema)) body: z.infer<typeof contractSchema>) {
    return ok(await this.service.create(toObjectId(user.userId, "userId"), toObjectId(projectId, "projectId"), body));
  }

  @Get("projects/:projectId/requirement-contracts/current")
  async current(@CurrentUser() user: RequestUser, @Param("projectId") projectId: string) {
    return ok(await this.service.current(toObjectId(user.userId, "userId"), toObjectId(projectId, "projectId")));
  }

  @Patch("requirement-contracts/:id")
  async update(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return ok(await this.service.update(toObjectId(user.userId, "userId"), toObjectId(id), body));
  }

  @Post("requirement-contracts/:id/check-drift")
  async checkDrift(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body(zodPipe(driftSchema)) body: z.infer<typeof driftSchema>) {
    return ok(await this.service.checkDrift(toObjectId(user.userId, "userId"), toObjectId(id), body.output));
  }
}
