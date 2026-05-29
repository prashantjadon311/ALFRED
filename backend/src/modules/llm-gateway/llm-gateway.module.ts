import { Module } from "@nestjs/common";
import { LlmRouterService } from "../../llm/llm-router.service";
import { MockLlmProvider } from "../../llm/providers/mock.provider";
import { OpenAiProvider } from "../../llm/providers/openai.provider";
import { AnthropicProvider } from "../../llm/providers/anthropic.provider";
import { GeminiProvider } from "../../llm/providers/gemini.provider";
import { OllamaProvider } from "../../llm/providers/ollama.provider";
import { CustomOpenAiCompatibleProvider } from "../../llm/providers/custom-openai.provider";
import { UsageModule } from "../usage/usage.module";

import { LlmGatewayController } from "./llm-gateway.controller";

@Module({
  imports: [UsageModule],
  providers: [LlmRouterService, MockLlmProvider, OpenAiProvider, AnthropicProvider, GeminiProvider, OllamaProvider, CustomOpenAiCompatibleProvider],
  controllers: [LlmGatewayController],
  exports: [LlmRouterService, MockLlmProvider]
})
export class LlmGatewayModule {}
