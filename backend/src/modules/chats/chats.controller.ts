import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";
import { ChatsService } from "./chats.service";

const createChatSchema = z.object({
  title: z.string().max(200).optional(),
  projectId: z.string().optional(),
  mode: z.enum(["single", "compare", "agent_assisted"]).default("single"),
  systemPrompt: z.string().max(10000).optional(),
  settings: z.object({ temperature: z.number().min(0).max(2).optional(), topP: z.number().min(0).max(1).optional(), maxTokens: z.number().min(1).max(128000).optional() }).optional()
});
const updateChatSchema = createChatSchema.partial();
const addMsgSchema = z.object({ content: z.string().min(1).max(100000), role: z.string().optional(), providerType: z.string().optional(), modelName: z.string().optional() });
const branchSchema = z.object({ fromMessageId: z.string() });
const regenerateSchema = z.object({ messageId: z.string(), providerType: z.string().optional(), modelName: z.string().optional() });
const exportSchema = z.object({ format: z.enum(["markdown", "json"]).default("markdown") });

@UseGuards(JwtAuthGuard)
@Controller("chats")
export class ChatsController {
  constructor(private readonly service: ChatsService, private readonly scope: WorkspaceScopeService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.list(userId, workspaceId, Number(page), Number(limit), projectId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post()
  async create(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Body(zodPipe(createChatSchema)) body: z.infer<typeof createChatSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.create(userId, workspaceId, body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.get(userId, workspaceId, toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string, @Body(zodPipe(updateChatSchema)) body: z.infer<typeof updateChatSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.update(userId, workspaceId, toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("id") id: string) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.delete(userId, workspaceId, toObjectId(id)));
  }

  @Get(":chatId/messages")
  async messages(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("chatId") chatId: string, @Query("page") page = "1", @Query("limit") limit = "50") {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const res = await this.service.listMessages(userId, workspaceId, toObjectId(chatId), Number(page), Number(limit));
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post(":chatId/messages")
  async addMessage(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("chatId") chatId: string, @Body(zodPipe(addMsgSchema)) body: z.infer<typeof addMsgSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.addMessage(userId, workspaceId, toObjectId(chatId), body));
  }

  @Post(":chatId/branch")
  async branch(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("chatId") chatId: string, @Body(zodPipe(branchSchema)) body: z.infer<typeof branchSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.branch(userId, workspaceId, toObjectId(chatId), body.fromMessageId));
  }

  @Post(":chatId/regenerate")
  async regenerate(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("chatId") chatId: string, @Body(zodPipe(regenerateSchema)) body: z.infer<typeof regenerateSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.regenerate(userId, workspaceId, toObjectId(chatId), body));
  }

  @Post(":chatId/export")
  async exportChat(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Param("chatId") chatId: string, @Body(zodPipe(exportSchema)) body: z.infer<typeof exportSchema>) {
    const userId = toObjectId(u.userId, "userId");
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    return ok(await this.service.exportChat(userId, workspaceId, toObjectId(chatId), body.format));
  }
}
