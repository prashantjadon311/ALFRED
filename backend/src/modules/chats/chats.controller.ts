import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
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
  constructor(private readonly service: ChatsService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("projectId") projectId?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), projectId);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post()
  async create(@CurrentUser() u: RequestUser, @Body(zodPipe(createChatSchema)) body: z.infer<typeof createChatSchema>) {
    return ok(await this.service.create(toObjectId(u.userId, "userId"), body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(updateChatSchema)) body: z.infer<typeof updateChatSchema>) {
    return ok(await this.service.update(toObjectId(u.userId, "userId"), toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.delete(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Get(":chatId/messages")
  async messages(@CurrentUser() u: RequestUser, @Param("chatId") chatId: string, @Query("page") page = "1", @Query("limit") limit = "50") {
    const res = await this.service.listMessages(toObjectId(u.userId, "userId"), toObjectId(chatId), Number(page), Number(limit));
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post(":chatId/messages")
  async addMessage(@CurrentUser() u: RequestUser, @Param("chatId") chatId: string, @Body(zodPipe(addMsgSchema)) body: z.infer<typeof addMsgSchema>) {
    return ok(await this.service.addMessage(toObjectId(u.userId, "userId"), toObjectId(chatId), body));
  }

  @Post(":chatId/branch")
  async branch(@CurrentUser() u: RequestUser, @Param("chatId") chatId: string, @Body(zodPipe(branchSchema)) body: z.infer<typeof branchSchema>) {
    return ok(await this.service.branch(toObjectId(u.userId, "userId"), toObjectId(chatId), body.fromMessageId));
  }

  @Post(":chatId/regenerate")
  async regenerate(@CurrentUser() u: RequestUser, @Param("chatId") chatId: string, @Body(zodPipe(regenerateSchema)) body: z.infer<typeof regenerateSchema>) {
    return ok(await this.service.regenerate(toObjectId(u.userId, "userId"), toObjectId(chatId), body));
  }

  @Post(":chatId/export")
  async exportChat(@CurrentUser() u: RequestUser, @Param("chatId") chatId: string, @Body(zodPipe(exportSchema)) body: z.infer<typeof exportSchema>) {
    return ok(await this.service.exportChat(toObjectId(u.userId, "userId"), toObjectId(chatId), body.format));
  }
}
