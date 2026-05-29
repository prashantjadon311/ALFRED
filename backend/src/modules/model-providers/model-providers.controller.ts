import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok, list } from "../../contracts/api-response.types";
import { ModelProvidersService } from "./model-providers.service";

const providerTypes = ["mock", "openai", "anthropic", "gemini", "ollama", "openrouter", "groq", "together", "custom_openai_compatible"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(80),
  providerType: z.enum(providerTypes),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  config: z.record(z.unknown()).optional()
});
const updateSchema = createSchema.partial().omit({ providerType: true });

@UseGuards(JwtAuthGuard)
@Controller("model-providers")
export class ModelProvidersController {
  constructor(private readonly service: ModelProvidersService) {}

  @Get()
  async list(@CurrentUser() u: RequestUser, @Query("page") page = "1", @Query("limit") limit = "20") {
    const res = await this.service.list(toObjectId(u.userId, "userId"), Number(page), Number(limit));
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

  @Post(":id/test")
  async test(@CurrentUser() u: RequestUser, @Param("id") id: string) {
    return ok(await this.service.test(toObjectId(u.userId, "userId"), toObjectId(id)));
  }
}
