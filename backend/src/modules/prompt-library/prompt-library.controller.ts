import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { PromptLibraryService } from "./prompt-library.service";

const categories = ["product_design", "software_architecture", "research", "code_review", "qa_audit", "agent_role", "claude_critic", "codex_prompt", "prompt_compression"] as const;
const createSchema = z.object({ title: z.string().min(1).max(200), category: z.enum(categories), content: z.string().min(1).max(50000), tags: z.array(z.string()).optional() });
const updateSchema = createSchema.partial();

@UseGuards(JwtAuthGuard)
@Controller("prompts")
export class PromptLibraryController {
  constructor(private readonly service: PromptLibraryService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20", @Query("category") category?: string, @Query("favorite") favorite?: string) {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit), category, favorite === "true" ? true : undefined);
    return list(res.items, { page: Number(page), limit: Number(limit), total: res.total, hasMore: Number(page) * Number(limit) < res.total });
  }

  @Post()
  async create(@CurrentUser() u: RequestUser, @Body(zodPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return ok(await this.service.create(toObjectId(u.userId, "userId"), body));
  }

  @Get(":id")
  async get(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.get(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Patch(":id")
  async update(@CurrentUser() u: RequestUser, @Param("id") id: string, @Body(zodPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return ok(await this.service.update(toObjectId(u.userId, "userId"), toObjectId(id), body));
  }

  @Delete(":id")
  async remove(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.delete(toObjectId(u.userId, "userId"), toObjectId(id)));
  }

  @Post(":id/favorite")
  async favorite(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.toggleFavorite(toObjectId(u.userId, "userId"), toObjectId(id)));
  }
}
