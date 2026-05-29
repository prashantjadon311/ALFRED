import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { AgentNodesService } from "./agent-nodes.service";

@UseGuards(JwtAuthGuard)
@Controller("agent-nodes")
export class AgentNodesController {
  constructor(private readonly service: AgentNodesService) {}

  @Get("workflow/:workflowId")
  async listByWorkflow(@CurrentUser() u: RequestUser, @Param("workflowId") workflowId: string) {
    return ok(await this.service.listByWorkflow(toObjectId(u.userId, "userId"), toObjectId(workflowId)));
  }

  @Post("workflow/:workflowId")
  async upsert(@CurrentUser() u: RequestUser, @Param("workflowId") workflowId: string, @Body() body: any) {
    return ok(await this.service.upsertNode(toObjectId(u.userId, "userId"), toObjectId(workflowId), body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.delete(toObjectId(u.userId, "userId"), toObjectId(id)));
  }
}
