import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { ok } from "../../contracts/api-response.types";
import { LlmRouterService } from "../../llm/llm-router.service";
import { UsageService } from "../usage/usage.service";

const chatSchema = z.object({
  prompt: z.string().min(1).max(100000),
  systemPrompt: z.string().max(20000).optional(),
  providerType: z.string().default("mock"),
  modelName: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional()
});

const compareSchema = z.object({
  prompt: z.string().min(1).max(100000),
  systemPrompt: z.string().max(20000).optional(),
  models: z.array(z.object({ providerType: z.string(), modelName: z.string().optional() })).min(1).max(5)
});

const estimateCostSchema = z.object({
  inputText: z.string(),
  outputText: z.string().optional(),
  inputCostPer1k: z.number().default(0.002),
  outputCostPer1k: z.number().default(0.006)
});

@UseGuards(JwtAuthGuard)
@Controller("llm")
export class LlmGatewayController {
  constructor(private readonly llm: LlmRouterService, private readonly usage: UsageService) {}

  @Post("chat")
  async chat(@CurrentUser() u: RequestUser, @Body(zodPipe(chatSchema)) body: z.infer<typeof chatSchema>) {
    const result = await this.llm.chat({ prompt: body.prompt, systemPrompt: body.systemPrompt, providerType: body.providerType, modelName: body.modelName, nodeKey: "chat" });
    await this.usage.record({
      userId: new ObjectId(u.userId),
      providerType: result.providerType,
      modelName: result.modelName,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      latencyMs: result.latencyMs,
      source: "chat"
    });
    return ok(result);
  }

  @Post("compare")
  async compare(@CurrentUser() u: RequestUser, @Body(zodPipe(compareSchema)) body: z.infer<typeof compareSchema>) {
    const results = await Promise.all(
      body.models.map((m) => this.llm.chat({ prompt: body.prompt, systemPrompt: body.systemPrompt, providerType: m.providerType, modelName: m.modelName, nodeKey: "compare" }))
    );
    for (const result of results) {
      await this.usage.record({
        userId: new ObjectId(u.userId),
        providerType: result.providerType,
        modelName: result.modelName,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd: result.costUsd,
        latencyMs: result.latencyMs,
        source: "compare"
      });
    }
    return ok(results.map((r, i) => ({ model: body.models[i], ...r })));
  }

  @Post("estimate-cost")
  async estimateCost(@CurrentUser() _u: RequestUser, @Body(zodPipe(estimateCostSchema)) body: z.infer<typeof estimateCostSchema>) {
    const inputTokens = await this.llm.estimateTokens(body.inputText);
    const outputTokens = body.outputText ? await this.llm.estimateTokens(body.outputText) : 0;
    const inputCost = (inputTokens / 1000) * body.inputCostPer1k;
    const outputCost = (outputTokens / 1000) * body.outputCostPer1k;
    return ok({ inputTokens, outputTokens, inputCost: Number(inputCost.toFixed(6)), outputCost: Number(outputCost.toFixed(6)), totalCost: Number((inputCost + outputCost).toFixed(6)) });
  }
}
