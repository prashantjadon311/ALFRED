import { Module } from "@nestjs/common";
import { LlmRouterService } from "../../llm/llm-router.service";
import { MockLlmProvider } from "../../llm/providers/mock.provider";
import { OpenAiProvider } from "../../llm/providers/openai.provider";
import { AnthropicProvider } from "../../llm/providers/anthropic.provider";
import { GeminiProvider } from "../../llm/providers/gemini.provider";
import { OllamaProvider } from "../../llm/providers/ollama.provider";
import { CustomOpenAiCompatibleProvider } from "../../llm/providers/custom-openai.provider";
import { AiModelsModule } from "../ai-models/ai-models.module";
import { ModelProvidersModule } from "../model-providers/model-providers.module";
import { SecurityModule } from "../../security/security.module";
import { UsageModule } from "../usage/usage.module";
import { WorkspacesModule } from "../workspaces/workspaces.module";

import { LlmGatewayController } from "./llm-gateway.controller";

@Module({
  imports: [UsageModule, WorkspacesModule, ModelProvidersModule, AiModelsModule, SecurityModule],
  providers: [LlmRouterService, MockLlmProvider, OpenAiProvider, AnthropicProvider, GeminiProvider, OllamaProvider, CustomOpenAiCompatibleProvider],
  controllers: [LlmGatewayController],
  exports: [LlmRouterService, MockLlmProvider]
})
export class LlmGatewayModule {}
