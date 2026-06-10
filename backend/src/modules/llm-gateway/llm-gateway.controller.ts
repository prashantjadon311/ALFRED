import { Body, Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { zodPipe } from "../../common/pipes/zod-validation.pipe";
import { RequestUser } from "../../common/types/request-user";
import { ok } from "../../contracts/api-response.types";
import { LlmRouterService } from "../../llm/llm-router.service";
import { UsageService } from "../usage/usage.service";
import { WorkspaceScopeService } from "../workspaces/workspace-scope.service";

const chatSchema = z.object({
  prompt: z.string().min(1).max(100000),
  systemPrompt: z.string().max(20000).optional(),
  providerType: z.string().optional(),
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
  constructor(private readonly llm: LlmRouterService, private readonly usage: UsageService, private readonly scope: WorkspaceScopeService) {}

  @Post("chat")
  async chat(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Body(zodPipe(chatSchema)) body: z.infer<typeof chatSchema>) {
    const userId = new ObjectId(u.userId);
    const result = await this.llm.chat({ prompt: body.prompt, systemPrompt: body.systemPrompt, providerType: body.providerType, modelName: body.modelName, temperature: body.temperature, maxTokens: body.maxTokens, userId: u.userId, nodeKey: "chat" });
    await this.usage.record({
      userId,
      workspaceId: await this.scope.resolve(userId, workspaceHeader),
      providerType: result.providerType,
      modelName: result.modelName,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cachedInputTokens: result.cachedInputTokens,
      reasoningTokens: result.reasoningTokens,
      costUsd: result.costUsd,
      pricingSnapshotId: result.pricingSnapshotId,
      usageSource: result.usageSource,
      costSource: result.costSource,
      calculatedAt: result.calculatedAt,
      latencyMs: result.latencyMs,
      source: "chat"
    });
    return ok(result);
  }

  @Post("compare")
  async compare(@CurrentUser() u: RequestUser, @Headers("x-workspace-id") workspaceHeader: string | undefined, @Body(zodPipe(compareSchema)) body: z.infer<typeof compareSchema>) {
    const userId = new ObjectId(u.userId);
    const workspaceId = await this.scope.resolve(userId, workspaceHeader);
    const results = await Promise.allSettled(
      body.models.map((m) => this.llm.chat({ prompt: body.prompt, systemPrompt: body.systemPrompt, providerType: m.providerType, modelName: m.modelName, userId: u.userId, nodeKey: "compare" }))
    );
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      await this.usage.record({
        userId,
        workspaceId,
        providerType: result.value.providerType,
        modelName: result.value.modelName,
        inputTokens: result.value.inputTokens,
        outputTokens: result.value.outputTokens,
        cachedInputTokens: result.value.cachedInputTokens,
        reasoningTokens: result.value.reasoningTokens,
        costUsd: result.value.costUsd,
        pricingSnapshotId: result.value.pricingSnapshotId,
        usageSource: result.value.usageSource,
        costSource: result.value.costSource,
        calculatedAt: result.value.calculatedAt,
        latencyMs: result.value.latencyMs,
        source: "compare"
      });
    }
    return ok(results.map((result, i) => result.status === "fulfilled"
      ? { model: body.models[i], ...result.value }
      : { model: body.models[i], error: result.reason instanceof Error ? result.reason.message : "Model execution failed" }));
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
